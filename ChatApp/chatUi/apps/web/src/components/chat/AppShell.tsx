import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '../../stores/useAuthStore'
import { useChatStore } from '../../stores/useChatStore'
import { useDirectoryStore } from '../../stores/useDirectoryStore'
import { signalRService } from '../../lib/signalr/hub'
import { ConversationList } from './ConversationList'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { EmptyState } from './EmptyState'
import { MembersPanel } from './MembersPanel'
import { TypingIndicator } from './TypingIndicator'
import { GroupInfoDialog } from './GroupInfoDialog'
import { cn } from '@workspace/ui/lib/utils'
import Toast from '../../lib/toast'
import { confirm } from '@workspace/ui/components/ConfirmDialog'

export function AppShell() {
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams({ strict: false })

    const { currentUser } = useAuthStore()
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
        deleteConversation,
    } = useChatStore()

    const { members, isLoading: membersLoading, loadMembers, subscribeToPresence } = useDirectoryStore()
    const { subscribeToMessages } = useChatStore()

    const [showMembers, setShowMembers] = useState(false)
    const [showConversations, setShowConversations] = useState(true)
    const [recentlyCreatedGroups, setRecentlyCreatedGroups] = useState<Set<string>>(new Set())
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false)

    // Reconnect to SignalR on mount (handles page refresh)
    useEffect(() => {
        const initializeConnection = async () => {
            if (currentUser && !signalRService.isConnected()) {
                try {
                    console.log('Reconnecting to SignalR after page refresh...')
                    await signalRService.connect()
                    console.log('SignalR reconnected successfully')

                    // Resubscribe to presence and message events
                    subscribeToPresence()
                    subscribeToMessages()
                } catch (error) {
                    console.error('Failed to reconnect to SignalR:', error)
                    Toast.error('Failed to connect to chat server')
                }
            }
        }

        initializeConnection()
    }, [currentUser, subscribeToPresence, subscribeToMessages])

    useEffect(() => {
        if (currentUser) {
            loadConversations(currentUser.id)
            loadMembers()

            // Subscribe to presence updates
            const unsubscribe = subscribeToPresence()
            return unsubscribe
        }
    }, [currentUser, loadConversations, loadMembers, subscribeToPresence])

    // Listen for conversation bump events and show toast notifications
    useEffect(() => {
        const handleConversationBump = async (event: CustomEvent) => {
            const { conversationId, senderName, messagePreview, senderId } = event.detail

            // Skip showing MessageToast if this is a recently created group
            // (GroupCreated event already showed a custom toast)
            if (recentlyCreatedGroups.has(conversationId)) {
                console.log('Skipping bump notification for recently created group:', conversationId)
                return
            }

            // Dynamically import MessageToast to avoid circular dependencies
            const { MessageToast } = await import('./MessageToast')

            // Find sender info - Members type doesn't have avatarUrl, so we'll use undefined
            // Avatar will be generated from displayName initial
            const sender = members.find(m => m.id === senderId)

            // Show custom toast with actions
            Toast.messageNotification(t => (
                <MessageToast
                    senderName={senderName}
                    senderAvatar={undefined} // Members type doesn't include avatar, will use fallback
                    messagePreview={messagePreview}
                    conversationId={conversationId}
                    onOpen={async convId => {
                        // Dismiss the toast
                        Toast.dismiss(t.id)
                        // Navigate to conversation
                        navigate({ to: `/chat/${convId}` as any })
                        // Open and join the conversation
                        const { openConversationFromNotification } = useChatStore.getState()
                        await openConversationFromNotification(convId)
                        // Hide sidebar on mobile
                        setShowConversations(false)
                    }}
                    onMarkRead={async convId => {
                        // Mark as read without opening
                        const { markAsReadFromNotification } = useChatStore.getState()
                        await markAsReadFromNotification(convId)
                    }}
                    onDismiss={() => {
                        Toast.dismiss(t.id)
                    }}
                />
            ))
        }

        // @ts-ignore - CustomEvent type
        window.addEventListener('chat:conversationBump', handleConversationBump)

        return () => {
            // @ts-ignore - CustomEvent type
            window.removeEventListener('chat:conversationBump', handleConversationBump)
        }
    }, [navigate, members, recentlyCreatedGroups])

    // Listen for GroupCreated SignalR event
    useEffect(() => {
        if (!currentUser) return

        const handleGroupCreated = async (notification: any) => {
            console.log('GroupCreated event received:', notification)

            // Only show toast if current user is in the group but not the creator
            if (notification.memberIds?.includes(currentUser.id) && notification.createdByUserId !== currentUser.id) {
                const creatorMember = members.find(m => m.id === notification.createdByUserId)
                const creatorName = creatorMember?.displayName || 'Someone'
                const groupName = notification.groupName || ''
                const memberCount = notification.memberIds?.length || 0

                // Dynamically import GroupCreatedToast
                const { GroupCreatedToast } = await import('./GroupCreatedToast')

                // Add to recently created groups to skip bump notifications
                setRecentlyCreatedGroups(prev => new Set(prev).add(notification.conversationId))

                // Remove from set after 3 seconds to allow future bump notifications
                setTimeout(() => {
                    setRecentlyCreatedGroups(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(notification.conversationId)
                        return newSet
                    })
                }, 3000)

                // Show custom toast notification
                Toast.messageNotification(
                    t => (
                        <GroupCreatedToast
                            groupName={groupName}
                            creatorName={creatorName}
                            memberCount={memberCount}
                            onDismiss={() => Toast.dismiss(t.id)}
                        />
                    ),
                    {
                        duration: 5000,
                    },
                )

                // Reload conversations to show the new group
                loadConversations(currentUser.id)
            }
        }

        // Subscribe to GroupCreated event
        signalRService.onGroupCreated(handleGroupCreated)

        return () => {
            // Unsubscribe when component unmounts
            signalRService.offGroupCreated(handleGroupCreated)
        }
    }, [currentUser, members, loadConversations])

    // Listen for AddedToGroup SignalR event (when current user is added to a group)
    useEffect(() => {
        if (!currentUser) return

        const handleAddedToGroup = async (notification: any) => {
            console.log('AddedToGroup event received:', notification)

            const addedByMember = members.find(m => m.id === notification.addedByUserId)
            const addedByName = addedByMember?.displayName || 'Someone'
            const groupName = notification.groupName || ''

            // Dynamically import GroupCreatedToast (reuse for consistency)
            const { GroupCreatedToast } = await import('./GroupCreatedToast')

            // Show custom toast notification
            Toast.messageNotification(
                t => (
                    <GroupCreatedToast
                        groupName={groupName}
                        creatorName={addedByName}
                        memberCount={0} // We don't have member count in this notification
                        onDismiss={() => Toast.dismiss(t.id)}
                    />
                ),
                {
                    duration: 5000,
                },
            )

            // Reload conversations to show the new group
            loadConversations(currentUser.id)
        }

        // Subscribe to AddedToGroup event
        signalRService.onAddedToGroup(handleAddedToGroup)

        return () => {
            // Unsubscribe when component unmounts
            signalRService.offAddedToGroup(handleAddedToGroup)
        }
    }, [currentUser, members, loadConversations])

    // Listen for MembersAddedToGroup SignalR event (when new members are added to a group you're in)
    useEffect(() => {
        if (!currentUser) return

        const handleMembersAddedToGroup = (notification: any) => {
            console.log('MembersAddedToGroup event received:', notification)

            const { conversationId, newMembers, addedByDisplayName, groupName } = notification

            // Extract member names from newMembers array
            // Backend sends newMembers as array of objects with displayName property
            const memberNames = Array.isArray(newMembers)
                ? newMembers.map((m: any) => m.displayName || m.DisplayName).filter(Boolean)
                : []

            if (memberNames.length === 0) {
                console.warn('No member names found in MembersAddedToGroup notification')
                return
            }

            // Check if we're currently viewing this conversation
            if (selectedConvId === conversationId) {
                // Add system message to the chat via store
                const systemMessage = {
                    id: `system-${Date.now()}`,
                    conversationId,
                    senderId: 'system',
                    text: `${addedByDisplayName} added ${memberNames.join(', ')} to the group`,
                    createdAt: new Date().toISOString(),
                    isSystem: true,
                }

                // Use the store's setState to add the system message
                useChatStore.setState(state => {
                    const messages = state.messagesByConv[conversationId] || []
                    return {
                        messagesByConv: {
                            ...state.messagesByConv,
                            [conversationId]: [...messages, systemMessage],
                        },
                    }
                })
            } else {
                // Show a subtle toast notification
                Toast.info(`${addedByDisplayName} added ${memberNames.join(', ')} to ${groupName}`)
            }
        }

        // Subscribe to MembersAddedToGroup event
        signalRService.onMembersAddedToGroup(handleMembersAddedToGroup)

        return () => {
            // Unsubscribe when component unmounts
            signalRService.offMembersAddedToGroup(handleMembersAddedToGroup)
        }
    }, [currentUser, selectedConvId])

    // Listen for custom event: Member Kicked from Group
    useEffect(() => {
        const handleMemberKicked = async (event: Event) => {
            const customEvent = event as CustomEvent
            const { groupName, message } = customEvent.detail

            // Dynamically import MemberEventToast
            const { MemberEventToast } = await import('./MemberEventToast')

            // Show custom toast notification
            Toast.messageNotification(
                t => (
                    <MemberEventToast
                        message={message}
                        conversationName={groupName}
                        variant="removed"
                        onDismiss={() => Toast.dismiss(t.id)}
                    />
                ),
                {
                    duration: 5000,
                },
            )
        }

        window.addEventListener('chat:memberKicked', handleMemberKicked)

        return () => {
            window.removeEventListener('chat:memberKicked', handleMemberKicked)
        }
    }, [])

    // Listen for custom event: Member Left Group
    useEffect(() => {
        const handleMemberLeft = async (event: Event) => {
            const customEvent = event as CustomEvent
            const { groupName, message } = customEvent.detail

            // Dynamically import MemberEventToast
            const { MemberEventToast } = await import('./MemberEventToast')

            // Show custom toast notification
            Toast.messageNotification(t => (
                <MemberEventToast
                    message={message}
                    conversationName={groupName}
                    variant="left"
                    onDismiss={() => Toast.dismiss(t.id)}
                />
            ))
        }

        window.addEventListener('chat:memberLeft', handleMemberLeft)

        return () => {
            window.removeEventListener('chat:memberLeft', handleMemberLeft)
        }
    }, [])

    // Select conversation from URL params
    useEffect(() => {
        const conversationId = (params as any).conversationId
        if (conversationId && conversationId !== selectedConvId && conversations.length > 0) {
            // Check if conversation exists
            const conversation = conversations.find(c => c.id === conversationId)
            if (conversation) {
                selectConversation(conversationId)
            }
        } else if (!conversationId && selectedConvId) {
            // Clear selection when navigating back to /chat without a conversationId
            useChatStore.setState({ selectedConvId: null })
        }
    }, [params, conversations, selectedConvId, selectConversation])

    const selectedConversation = conversations.find(c => c.id === selectedConvId)
    const selectedMessages = selectedConvId ? messagesByConv[selectedConvId] || [] : []

    // Get the other user for DM conversations
    const otherUserId =
        selectedConversation && !selectedConversation.isGroup
            ? selectedConversation.memberIds.find(id => id !== currentUser?.id)
            : undefined
    const otherUser = otherUserId ? members.find(m => m.id === otherUserId) : undefined

    const handleSendMessage = (text: string) => {
        if (currentUser) {
            sendMessage(text, currentUser.id)
        }
    }

    const handleReaction = (messageId: string, emoji: string) => {
        if (selectedConvId && currentUser) {
            addReaction(selectedConvId, messageId, emoji, currentUser.id)
        }
    }

    const handleComposerFocus = () => {
        if (selectedConvId) {
            markAsRead(selectedConvId)
        }
    }

    const handleStartChat = async (userId: string) => {
        if (currentUser && userId !== currentUser.id) {
            // Find the member to get their display name
            const member = members.find(m => m.id === userId)
            const displayName = member?.displayName

            const conversationId = await ensureDMWith(userId, currentUser.id, displayName)

            // Navigate to the conversation URL
            if (conversationId) {
                navigate({ to: `/chat/${conversationId}` as any })
            }

            // Hide members panel and show chat panel
            setShowMembers(false)
            setShowConversations(false)
        }
    }

    if (!currentUser) {
        return <div>Loading...</div>
    }

    return (
        <div className="h-screen w-screen text-slate-800 dark:text-slate-200 antialiased font-sans">
            <main className="flex h-full">
                {/* Sidebar - Conversations */}
                <div
                    className={cn(
                        'w-full md:w-[320px] lg:w-[360px] flex-shrink-0 md:flex flex-col',
                        selectedConvId ? 'hidden' : 'flex',
                    )}
                >
                    <ConversationList
                        conversations={conversations}
                        selectedConvId={selectedConvId}
                        onSelectConversation={id => {
                            navigate({ to: `/chat/${id}` as any })
                            selectConversation(id)
                            setShowConversations(false)
                            setShowMembers(false)
                        }}
                        onDeleteConversation={async id => {
                            const conversation = conversations.find(c => c.id === id)
                            const displayName = conversation?.title || 'this conversation'

                            // Show custom confirmation dialog
                            confirm({
                                variant: 'destructive',
                                title: 'Delete Conversation',
                                description: `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
                                action: {
                                    label: 'Delete',
                                    onClick: async () => {
                                        await deleteConversation(id)
                                        if (selectedConvId === id) {
                                            navigate({ to: '/chat' as any })
                                        }
                                        Toast.success('Conversation deleted successfully')
                                    },
                                },
                                cancel: {
                                    label: 'Cancel',
                                    onClick: () => {
                                        // Just close the dialog
                                    },
                                },
                            })
                        }}
                        currentUser={currentUser}
                        isLoading={isLoading}
                        members={members}
                        onUserSelect={handleStartChat}
                        onGroupCreated={() => loadConversations(currentUser.id)}
                    />
                </div>

                {/* Chat Window */}
                <div className={cn('w-full flex-1 md:flex flex-col min-w-0', selectedConvId ? 'flex' : 'hidden')}>
                    {selectedConvId && selectedConversation ? (
                        <>
                            <ChatHeader
                                user={otherUser}
                                title={selectedConversation.title}
                                avatarUrl={selectedConversation.avatarUrl}
                                isGroup={selectedConversation.isGroup}
                                onBack={() => {
                                    navigate({ to: '/chat' as any })
                                }}
                                onInfoClick={selectedConversation.isGroup ? () => setIsGroupInfoOpen(true) : undefined}
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
                        <MembersPanel members={members} onStartChat={handleStartChat} isLoading={membersLoading} />
                    </aside>
                </div>
            </main>

            {/* Group Info Dialog */}
            {selectedConvId && selectedConversation?.isGroup && (
                <GroupInfoDialog
                    isOpen={isGroupInfoOpen}
                    onClose={() => setIsGroupInfoOpen(false)}
                    conversationId={selectedConvId}
                    conversationTitle={selectedConversation.title}
                    currentUserId={currentUser.id}
                    availableMembers={members}
                    onLeaveGroup={() => {
                        // Navigate back to chat list and reload conversations
                        navigate({ to: '/chat' as any })
                        loadConversations(currentUser.id)
                    }}
                    onMemberRemoved={() => {
                        // Optionally refresh conversation or show updated member count
                        console.log('Member removed, you may want to refresh the conversation')
                    }}
                />
            )}
        </div>
    )
}
