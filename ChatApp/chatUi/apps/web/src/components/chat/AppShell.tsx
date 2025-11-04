import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import { useDirectoryStore } from '../../stores/useDirectoryStore';
import { signalRService } from '../../lib/signalr/hub';
import { ConversationList } from './ConversationList';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { EmptyState } from './EmptyState';
import { MembersPanel } from './MembersPanel';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@workspace/ui/lib/utils';
import Toast from '../../lib/toast';
import { confirm } from '@workspace/ui/components/ConfirmDialog';

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams({ strict: false });
  
  const { currentUser } = useAuthStore();
  const {
    conversations,
    messagesByConv,
    selectedConvId,
    isLoading,
    isSending,
    messagePagination,
    isLoadingMoreMessages,
    typingUsersByConv,
    loadConversations,
    selectConversation,
    sendMessage,
    addReaction,
    ensureDMWith,
    loadMoreMessages,
    markAsRead,
    deleteConversation
  } = useChatStore();
  
  const { members, isLoading: membersLoading, loadMembers, subscribeToPresence } = useDirectoryStore();
  const { subscribeToMessages } = useChatStore();

  const [showMembers, setShowMembers] = useState(false);
  const [showConversations, setShowConversations] = useState(true);

  // Reconnect to SignalR on mount (handles page refresh)
  useEffect(() => {
    const initializeConnection = async () => {
      if (currentUser && !signalRService.isConnected()) {
        try {
          console.log('Reconnecting to SignalR after page refresh...');
          await signalRService.connect();
          console.log('SignalR reconnected successfully');
          
          // Resubscribe to presence and message events
          subscribeToPresence();
          subscribeToMessages();
        } catch (error) {
          console.error('Failed to reconnect to SignalR:', error);
          Toast.error('Failed to connect to chat server');
        }
      }
    };

    initializeConnection();
  }, [currentUser, subscribeToPresence, subscribeToMessages]);

  useEffect(() => {
    if (currentUser) {
      loadConversations(currentUser.id);
      loadMembers();
      
      // Subscribe to presence updates
      const unsubscribe = subscribeToPresence();
      return unsubscribe;
    }
  }, [currentUser, loadConversations, loadMembers, subscribeToPresence]);

  // Listen for conversation bump events and show toast notifications
  useEffect(() => {
    const handleConversationBump = async (event: CustomEvent) => {
      const { conversationId, senderName, messagePreview, senderId } = event.detail;
      
      // Dynamically import MessageToast to avoid circular dependencies
      const { MessageToast } = await import('./MessageToast');
      
      // Find sender info - Members type doesn't have avatarUrl, so we'll use undefined
      // Avatar will be generated from displayName initial
      const sender = members.find(m => m.id === senderId);
      
      // Show custom toast with actions
      Toast.messageNotification((t) => (
        <MessageToast
          senderName={senderName}
          senderAvatar={undefined} // Members type doesn't include avatar, will use fallback
          messagePreview={messagePreview}
          conversationId={conversationId}
          onOpen={async (convId) => {
            // Dismiss the toast
            Toast.dismiss(t.id);
            // Navigate to conversation
            navigate({ to: `/chat/${convId}` as any });
            // Open and join the conversation
            const { openConversationFromNotification } = useChatStore.getState();
            await openConversationFromNotification(convId);
            // Hide sidebar on mobile
            setShowConversations(false);
          }}
          onMarkRead={async (convId) => {
            // Mark as read without opening
            const { markAsReadFromNotification } = useChatStore.getState();
            await markAsReadFromNotification(convId);
          }}
          onDismiss={() => {
            Toast.dismiss(t.id);
          }}
        />
      ));
    };

    // @ts-ignore - CustomEvent type
    window.addEventListener('chat:conversationBump', handleConversationBump);

    return () => {
      // @ts-ignore - CustomEvent type
      window.removeEventListener('chat:conversationBump', handleConversationBump);
    };
  }, [navigate, members]);

  // Select conversation from URL params
  useEffect(() => {
    const conversationId = (params as any).conversationId;
    if (conversationId && conversationId !== selectedConvId && conversations.length > 0) {
      // Check if conversation exists
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        selectConversation(conversationId);
      }
    } else if (!conversationId && selectedConvId) {
      // Clear selection when navigating back to /chat without a conversationId
      useChatStore.setState({ selectedConvId: null });
    }
  }, [params, conversations, selectedConvId, selectConversation]);

  const selectedConversation = conversations.find(c => c.id === selectedConvId);
  const selectedMessages = selectedConvId ? messagesByConv[selectedConvId] || [] : [];
  
  // Get the other user for DM conversations
  const otherUserId = selectedConversation && !selectedConversation.isGroup
    ? selectedConversation.memberIds.find(id => id !== currentUser?.id)
    : undefined;
  const otherUser = otherUserId ? members.find(m => m.id === otherUserId) : undefined;

  const handleSendMessage = (text: string) => {
    if (currentUser) {
      sendMessage(text, currentUser.id);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (selectedConvId && currentUser) {
      addReaction(selectedConvId, messageId, emoji, currentUser.id);
    }
  };

  const handleComposerFocus = () => {
    if (selectedConvId) {
      markAsRead(selectedConvId);
    }
  };

  const handleStartChat = async (userId: string) => {
    if (currentUser && userId !== currentUser.id) {
      // Find the member to get their display name
      const member = members.find(m => m.id === userId);
      const displayName = member?.displayName;
      
      const conversationId = await ensureDMWith(userId, currentUser.id, displayName);
      
      // Navigate to the conversation URL
      if (conversationId) {
        navigate({ to: `/chat/${conversationId}` as any });
      }
      
      // Hide members panel and show chat panel
      setShowMembers(false);
      setShowConversations(false);
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen w-screen text-slate-800 dark:text-slate-200 antialiased font-sans">
      <main className="flex h-full">
        {/* Sidebar - Conversations */}
        <div className={cn(
          'w-full md:w-[320px] lg:w-[360px] flex-shrink-0 md:flex flex-col',
          selectedConvId ? 'hidden' : 'flex'
        )}>
          <ConversationList
            conversations={conversations}
            selectedConvId={selectedConvId}
            onSelectConversation={(id) => {
              navigate({ to: `/chat/${id}` as any });
              selectConversation(id);
              setShowConversations(false);
              setShowMembers(false);
            }}
            onDeleteConversation={async (id) => {
              const conversation = conversations.find(c => c.id === id);
              const displayName = conversation?.title || 'this conversation';
              
              // Show custom confirmation dialog
              confirm({
                variant: 'destructive',
                title: 'Delete Conversation',
                description: `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
                action: {
                  label: 'Delete',
                  onClick: async () => {
                    await deleteConversation(id);
                    if (selectedConvId === id) {
                      navigate({ to: '/chat' as any });
                    }
                    Toast.success('Conversation deleted successfully');
                  },
                },
                cancel: {
                  label: 'Cancel',
                  onClick: () => {
                    // Just close the dialog
                  }
                }
              });
            }}
            currentUser={currentUser}
            isLoading={isLoading}
            members={members}
            onUserSelect={handleStartChat}
          />
        </div>
        
        {/* Chat Window */}
        <div className={cn(
          'w-full flex-1 md:flex flex-col min-w-0',
          selectedConvId ? 'flex' : 'hidden'
        )}>
          {selectedConvId && selectedConversation ? (
            <>
              <ChatHeader
                user={otherUser}
                title={selectedConversation.title}
                avatarUrl={selectedConversation.avatarUrl}
                onBack={() => {
                  navigate({ to: '/chat' as any });
                }}
              />
              <MessageList
                messages={selectedMessages}
                currentUserId={currentUser.id}
                users={members}
                conversationId={selectedConvId}
                onReaction={handleReaction}
                onLoadMore={() => loadMoreMessages(selectedConvId)}
                hasMore={messagePagination[selectedConvId]?.hasMore || false}
                isLoadingMore={isLoadingMoreMessages}
              />
              <TypingIndicator
                typingUsers={typingUsersByConv[selectedConvId] || []}
                currentUserId={currentUser.id}
              />
              <Composer 
                conversationId={selectedConvId}
                onSend={handleSendMessage} 
                isSending={isSending}
                onFocus={handleComposerFocus}
              />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
        
        {/* Members Panel - Desktop Only */}
        <div className="hidden lg:flex flex-col w-72 flex-shrink-0">
          <aside className="w-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex-col h-full flex">
            <header className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Members</h2>
            </header>
            <MembersPanel
              members={members}
              onStartChat={handleStartChat}
              isLoading={membersLoading}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
