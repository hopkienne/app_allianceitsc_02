import { create } from 'zustand';
import { Conversation, Message, ID, ConversationType } from '../types';
import { mockChatService } from '../lib/mock/chat';
import { signalRService } from '../lib/signalr/hub';
import { conversationsApi } from '../lib/api/conversations';
import Toast from '../lib/toast';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface ChatState {
  conversations: Conversation[];
  messagesByConv: Record<ID, Message[]>;
  selectedConvId: ID | null;
  isLoading: boolean;
  isSending: boolean;
  messagePagination: Record<ID, { pageIndex: number; totalPages: number; hasMore: boolean }>;
  isLoadingMoreMessages: boolean;
  typingUsersByConv: Record<ID, TypingUser[]>;
}

interface ChatActions {
  loadConversations: (userId: ID) => Promise<void>;
  loadMessages: (conversationId: ID, pageIndex?: number) => Promise<void>;
  loadMoreMessages: (conversationId: ID) => Promise<void>;
  selectConversation: (conversationId: ID) => Promise<void>;
  sendMessage: (text: string, senderId: ID) => Promise<void>;
  addReaction: (convId: ID, msgId: ID, emoji: string, userId: ID) => Promise<void>;
  markAsRead: (convId: ID) => Promise<void>;
  ensureDMWith: (userId: ID, currentUserId: ID, displayName?: string) => Promise<string | void>;
  deleteConversation: (conversationId: ID) => Promise<void>;
  updateMessageStatus: (convId: ID, msgId: ID, status: Message['status']) => void;
  subscribeToMessages: () => () => void;
  receiveMessage: (messageData: any) => void;
  receiveGroupMessage: (bumpData: any) => void;
  openConversationFromNotification: (conversationId: ID) => Promise<void>;
  markAsReadFromNotification: (conversationId: ID) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  conversations: [],
  messagesByConv: {},
  selectedConvId: null,
  isLoading: false,
  isSending: false,
  messagePagination: {},
  isLoadingMoreMessages: false,
  typingUsersByConv: {},

  loadConversations: async (userId: ID) => {
    set({ isLoading: true });
    try {
      // Call real API to get user's conversations
      const conversationsData = await conversationsApi.getByUser(userId);
      
      // Map API response (ViewMyConversations) to Conversation type
      const conversations: Conversation[] = conversationsData.map((conv) => ({
        id: conv.conversationId,
        title: conv.titleByMember,
        memberIds: [], // Member IDs not provided in this endpoint, will be populated when conversation is selected
        unreadCount: Number(conv.unreadCount) || 0,
        isGroup: conv.conversationType === 'GROUP' || conv.conversationType === 'EXTERNAL_GROUP',
        type: conv.conversationType as ConversationType, // 'DIRECT', 'GROUP', or 'EXTERNAL_GROUP'
        lastMessage: conv.lastMessageId ? {
          id: conv.lastMessageId,
          conversationId: conv.conversationId,
          senderId: '', // Sender ID not provided, but we have display name
          text: conv.lastMessageContent || '',
          createdAt: conv.lastMessageAt || new Date().toISOString(),
          status: 'delivered',
          senderName: conv.lastMessageSenderDisplayName // Store sender display name for UI
        } : undefined
      }));
      
      set({ conversations, isLoading: false });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      set({ isLoading: false });
      Toast.error('Failed to load conversations');
    }
  },

  loadMessages: async (conversationId: ID, pageIndex: number = 1) => {
    try {
      // Call real API to get messages with pagination
      const response = await conversationsApi.getMessages(conversationId, pageIndex, 50);
      
      // Map API response to Message type
      const messages: Message[] = response.data.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        text: msg.content,
        createdAt: msg.sentAt,
        status: msg.isRead ? 'read' : 'delivered'
      }));

      // Messages come from newest to oldest from API, so reverse for chronological order
      const sortedMessages = messages.reverse();

      set((state) => ({
        messagesByConv: {
          ...state.messagesByConv,
          [conversationId]: pageIndex === 1 
            ? sortedMessages 
            : [...sortedMessages, ...(state.messagesByConv[conversationId] || [])]
        },
        messagePagination: {
          ...state.messagePagination,
          [conversationId]: {
            pageIndex: response.pageIndex,
            totalPages: response.totalPages,
            hasMore: response.pageIndex < response.totalPages
          }
        }
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
      Toast.error('Failed to load messages');
    }
  },

  loadMoreMessages: async (conversationId: ID) => {
    const { messagePagination, isLoadingMoreMessages } = get();
    const pagination = messagePagination[conversationId];

    // Don't load if already loading or no more pages
    if (isLoadingMoreMessages || !pagination?.hasMore) {
      return;
    }

    set({ isLoadingMoreMessages: true });

    try {
      const nextPage = pagination.pageIndex + 1;
      await get().loadMessages(conversationId, nextPage);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      set({ isLoadingMoreMessages: false });
    }
  },

  selectConversation: async (conversationId: ID) => {
  const { selectedConvId, messagesByConv } = get();
  if (selectedConvId === conversationId) return; // tránh churn

  const prevId = selectedConvId ?? null;

  // Cập nhật state sớm (tuỳ UI), hoặc đặt cờ isSwitching
  set({ selectedConvId: conversationId });

  // Join trước, rồi leave sau để tránh "gap"
  if (signalRService.isConnected()) {
    try {
      await signalRService.joinConversation(conversationId);
      console.log('Joined conversation:', conversationId);
    } catch (e) {
      console.error('Failed to join conversation:', e);
      Toast.error('Failed to join conversation');
      // (tuỳ chọn) rollback UI: set({ selectedConvId: prevId });
      // return; // nếu muốn dừng hẳn
    }

    if (prevId && prevId !== conversationId) {
      // leave phòng cũ sau khi đã join phòng mới
      signalRService.leaveConversation(prevId).catch(err =>
        console.warn('Leave previous conversation failed (ignored):', err)
      );
    }
  }

  // Load messages (refetch/refresh tuỳ tình huống)
  if (!messagesByConv[conversationId]) {
    await get().loadMessages(conversationId);
  }
  
  await get().markAsRead(conversationId);
},

  sendMessage: async (text: string, senderId: ID) => {
    const { selectedConvId, conversations } = get();
    if (!selectedConvId) return;

    // Find the selected conversation to determine type
    const conversation = conversations.find(c => c.id === selectedConvId);
    if (!conversation) {
      Toast.error('Conversation not found');
      return;
    }

    set({ isSending: true });
    
    try {
      let conversationId = selectedConvId;

      // Determine conversation type
      let conversationType: ConversationType = conversation.type || 'DIRECT';
      
      if (!conversation.type) {
        if (conversation.isGroup || conversation.memberIds.length > 2) {
          conversationType = 'GROUP';
        }
      }
      // Send message via SignalR hub
      // Backend will handle saving and broadcasting the message
      await signalRService.sendMessage(conversationId, text);

      set({ isSending: false });
      
      // Message will be received back through MessageCreated event
      // No need to update UI here - the backend will broadcast it

    } catch (error) {
      console.error('Failed to send message:', error);
      set({ isSending: false });
      Toast.error('Failed to send message');
    }
  },

  addReaction: async (convId: ID, msgId: ID, emoji: string, userId: ID) => {
    try {
      await mockChatService.addReaction(convId, msgId, emoji, userId);
      
      // Update message in store
      set((state) => {
        const messages = state.messagesByConv[convId];
        if (!messages) return state;

        const updatedMessages = messages.map(msg => {
          if (msg.id === msgId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.emoji === emoji);
            
            if (existingReaction) {
              if (!existingReaction.userIds.includes(userId)) {
                return {
                  ...msg,
                  reactions: reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, userIds: [...r.userIds, userId] }
                      : r
                  )
                };
              }
            } else {
              return {
                ...msg,
                reactions: [...reactions, { emoji, userIds: [userId] }]
              };
            }
          }
          return msg;
        });

        return {
          messagesByConv: {
            ...state.messagesByConv,
            [convId]: updatedMessages
          }
        };
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  },

  markAsRead: async (convId: ID) => {
    try {
      const { messagesByConv } = get();
      const messages = messagesByConv[convId];
      
      if (!messages || messages.length === 0) {
        return;
      }

      // Get the last message ID
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        return;
      }
      
      // Only mark as read if SignalR is connected
      if (signalRService.isConnected() && lastMessage.status == 'delivered') {
        await signalRService.markRead(convId, lastMessage.id);
      }
      
      // Update local state
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === convId ? { ...conv, unreadCount: 0 } : conv
        )
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  ensureDMWith: async (userId: ID, currentUserId: ID, displayName?: string) => {
    try {
      // Call API to get or create conversation between users
      const conversationId = await conversationsApi.checkExists(currentUserId, userId);
      
      // Check if conversation already exists in store
      const exists = get().conversations.find(c => c.id === conversationId);
      
      if (!exists) {
        // Create a new conversation object in the store with displayName as title
        const newConversation: Conversation = {
          id: conversationId,
          title: displayName || 'Direct Message',
          memberIds: [currentUserId, userId],
          unreadCount: 0,
          isGroup: false,
          type: 'DIRECT'
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations]
        }));
      }
      
      // Select the conversation
      get().selectConversation(conversationId);
      
      // Return the conversation ID so the caller can navigate to it
      return conversationId;
    } catch (error) {
      console.error('Failed to create DM:', error);
      Toast.error('Failed to start conversation');
    }
  },

  deleteConversation: async (conversationId: ID) => {
    try {
      // Call API to delete the conversation
      await conversationsApi.delete(conversationId);
      
      // Remove from store
      set((state) => {
        const newMessagesByConv = { ...state.messagesByConv };
        delete newMessagesByConv[conversationId];
        
        return {
          conversations: state.conversations.filter(c => c.id !== conversationId),
          messagesByConv: newMessagesByConv,
          selectedConvId: state.selectedConvId === conversationId ? null : state.selectedConvId
        };
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      Toast.error('Failed to delete conversation');
      throw error;
    }
  },

  updateMessageStatus: (convId: ID, msgId: ID, status: Message['status']) => {
    set((state) => {
      const messages = state.messagesByConv[convId];
      if (!messages) return state;

      return {
        messagesByConv: {
          ...state.messagesByConv,
          [convId]: messages.map(msg =>
            msg.id === msgId ? { ...msg, status } : msg
          )
        }
      };
    });
  },

  /**
   * Handle MessageCreated event from server
   * This is called when a new message is created in a conversation
   */
  receiveMessage: (messageData: any) => {
    const { conversations, selectedConvId } = get();
    
    // Extract message data (adjust based on actual server response structure)
    const conversationId = messageData.conversationId || messageData.ConversationId;
    const senderId = messageData.senderId || messageData.SenderId;
    const content = messageData.content || messageData.Content;
    const messageId = messageData.messageId || messageData.MessageId || messageData.id || messageData.Id;
    const createdAt = messageData.createdAt || messageData.CreatedAt || new Date().toISOString();
    const senderName = messageData.senderName || messageData.SenderName;

    // Find the conversation
    const conversation = conversations.find(conv => conv.id === conversationId);

    if (!conversation) {
      console.warn('Conversation not found:', conversationId);
      return;
    }

    // Create message object
    const newMessage: Message = {
      id: messageId,
      conversationId,
      senderId,
      text: content,
      createdAt,
      status: 'delivered',
      senderName
    };

    // Add message to store
    set((state) => ({
      messagesByConv: {
        ...state.messagesByConv,
        [conversationId]: [
          ...(state.messagesByConv[conversationId] || []),
          newMessage
        ]
      }
    }));

    // Determine if we should increment unread count
    const isViewingConversation = selectedConvId === conversationId;
    
    // Update conversation's last message and bump to top
    set((state) => {
      const updatedConversations = state.conversations.map(conv =>
        conv.id === conversationId
          ? { 
              ...conv, 
              lastMessage: newMessage, 
              // Only increment unread if not currently viewing this conversation
              unreadCount: isViewingConversation ? 0 : (conv.unreadCount || 0) + 1 
            }
          : conv
      );

      // Sort conversations by last message time (most recent first)
      updatedConversations.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || '';
        const timeB = b.lastMessage?.createdAt || '';
        return timeB.localeCompare(timeA);
      });

      return { conversations: updatedConversations };
    });

    // Don't show notification if viewing this conversation
    // Notification will be shown via ConversationBump event instead
  },

  /**
   * Handle ConversationBump event from server
   * This updates the conversation list when a message is sent
   * Implements the "bump + toast" pattern like Slack/Teams
   */
  receiveGroupMessage: (bumpData: any) => {
    const { selectedConvId, conversations } = get();
    
    const conversationId = bumpData.conversationId || bumpData.ConversationId;
    const lastMessagePreview = bumpData.lastMessagePreview || bumpData.LastMessagePreview;
    const at = bumpData.at || bumpData.At || new Date().toISOString();
    const displayName = bumpData.displayName || bumpData.DisplayName || 'Someone';
    const senderId = bumpData.senderId || bumpData.SenderId;

    console.log('📬 ConversationBump received:', { conversationId, displayName, lastMessagePreview });

    const isViewingConversation = selectedConvId === conversationId;

    // Update conversation to bump to top and update preview
    set((state) => {
      const conversations = [...state.conversations];
      const index = conversations.findIndex(conv => conv.id === conversationId);
      
      if (index > -1 && index < conversations.length) {
        const [conversation] = conversations.splice(index, 1);
        if (conversation) {
          // Update the conversation with new message info and bump to top
          const updatedConversation = {
            ...conversation,
            lastMessage: {
              id: 'bump-' + Date.now(), // Temporary ID for bump message
              conversationId,
              senderId: senderId || '',
              text: lastMessagePreview,
              createdAt: at,
              status: 'delivered' as const,
              senderName: displayName
            },
            // Increment unread count only if not currently viewing this conversation
            unreadCount: isViewingConversation ? 0 : (conversation.unreadCount || 0) + 1
          };
          
          conversations.unshift(updatedConversation);
        }
      }
      
      return { conversations };
    });

    // Show toast notification only if user is NOT viewing this conversation
    // This implements the "bump + toast" pattern
    if (!isViewingConversation) {
      // Store the bump data for toast rendering
      // We'll trigger the toast from the component layer via a custom event
      const bumpEvent = new CustomEvent('chat:conversationBump', {
        detail: {
          conversationId,
          senderName: displayName,
          messagePreview: lastMessagePreview,
          senderId
        }
      });
      window.dispatchEvent(bumpEvent);
    }
  },

  /**
   * Subscribe to SignalR message events
   */
  subscribeToMessages: () => {
    const handleMessageCreated = (messageData: any) => {
      get().receiveMessage(messageData);
    };

    const handleConversationBump = (bumpData: any) => {
      get().receiveGroupMessage(bumpData);
    };

    const handleJoinedConversation = (conversationId: string) => {
      console.log('Joined conversation:', conversationId);
    };

    const handleLeftConversation = (conversationId: string) => {
      console.log('Left conversation:', conversationId);
    };

    const handleTypingStarted = (data: any) => {
      // Handle both camelCase and PascalCase from server
      const conversationId = data.conversationId || data.ConversationId;
      const userId = data.userId || data.UserId;
      const displayName = data.displayName || data.DisplayName;
      
      if (!conversationId || !userId) {
        console.warn('⚠️ Invalid typing started data:', data);
        return;
      }

      set((state) => {
        const currentTyping = state.typingUsersByConv[conversationId] || [];
        
        // Check if user is already in typing list
        const isAlreadyTyping = currentTyping.some(user => user.userId === userId);
        
        if (!isAlreadyTyping) {
          return {
            typingUsersByConv: {
              ...state.typingUsersByConv,
              [conversationId]: [
                ...currentTyping,
                { userId, displayName: displayName || 'Someone' }
              ]
            }
          };
        }
        
        return state;
      });
    };

    const handleTypingStopped = (data: any) => {
      console.log('✋ TypingStopped event received:', data);
      
      // Handle both camelCase and PascalCase from server
      const conversationId = data.conversationId || data.ConversationId;
      const userId = data.userId || data.UserId;
      
      if (!conversationId || !userId) {
        console.warn('⚠️ Invalid typing stopped data:', data);
        return;
      }

      console.log(`✅ User ${userId} stopped typing in conversation ${conversationId}`);

      set((state) => {
        const currentTyping = state.typingUsersByConv[conversationId] || [];
        
        return {
          typingUsersByConv: {
            ...state.typingUsersByConv,
            [conversationId]: currentTyping.filter(user => user.userId !== userId)
          }
        };
      });
    };

    const handleReadReceiptUpdated = (data: any) => {
      console.log('Read receipt updated:', data);
      // TODO: Update read status in UI
    };

    // Register SignalR event handlers
    signalRService.on('MessageCreated', handleMessageCreated);
    signalRService.on('ConversationBump', handleConversationBump);
    signalRService.on('JoinedConversation', handleJoinedConversation);
    signalRService.on('LeftConversation', handleLeftConversation);
    signalRService.on('TypingStarted', handleTypingStarted);
    signalRService.on('TypingStopped', handleTypingStopped);
    signalRService.on('ReadReceiptUpdated', handleReadReceiptUpdated);

    console.log('Subscribed to message events');

    // Return cleanup function
    return () => {
      signalRService.off('MessageCreated', handleMessageCreated);
      signalRService.off('ConversationBump', handleConversationBump);
      signalRService.off('JoinedConversation', handleJoinedConversation);
      signalRService.off('LeftConversation', handleLeftConversation);
      signalRService.off('TypingStarted', handleTypingStarted);
      signalRService.off('TypingStopped', handleTypingStopped);
      signalRService.off('ReadReceiptUpdated', handleReadReceiptUpdated);
      console.log('Unsubscribed from message events');
    };
  },

  /**
   * Open a conversation from a notification toast
   * This handles: joining the conversation, loading messages, and navigating to it
   * Note: Navigation is handled by the caller (typically in AppShell or route component)
   */
  openConversationFromNotification: async (conversationId: ID) => {
    try {
      // Select the conversation (this will join it via SignalR and load messages)
      await get().selectConversation(conversationId);
      
      // Mark as read after opening
      await get().markAsRead(conversationId);
      
      console.log('Opened conversation from notification:', conversationId);
    } catch (error) {
      console.error('Failed to open conversation from notification:', error);
      Toast.error('Failed to open conversation');
    }
  },

  /**
   * Mark a conversation as read from a notification without opening it
   * This updates the unread count and calls the SignalR markRead method
   */
  markAsReadFromNotification: async (conversationId: ID) => {
    try {
      const { messagesByConv } = get();
      
      // Update local unread count immediately for better UX
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      }));

      // If we have messages for this conversation, mark the last one as read
      const messages = messagesByConv[conversationId];
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && signalRService.isConnected()) {
          await signalRService.markRead(conversationId, lastMessage.id);
        }
      }
      
      console.log('Marked conversation as read from notification:', conversationId);
      Toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      Toast.error('Failed to mark as read');
    }
  }
}));
