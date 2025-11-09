import { useState, useEffect } from 'react'
import { conversationsApi, GroupMember } from '../../lib/api/conversations'
import { Members } from '../../types'
import { XMarkIcon, UsersIcon } from './Icons'
import { AddMembersDialog } from './AddMembersDialog'
import { cn } from '@workspace/ui/lib/utils'
import Toast from '../../lib/toast'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { useChatStore } from '../../stores/useChatStore'

interface GroupInfoDialogProps {
    isOpen: boolean
    onClose: () => void
    conversationId: string
    conversationTitle?: string
    currentUserId: string
    availableMembers: Members[]
    onLeaveGroup?: () => void
    onMemberRemoved?: () => void
}

export function GroupInfoDialog({
    isOpen,
    onClose,
    conversationId,
    conversationTitle,
    currentUserId,
    availableMembers,
    onLeaveGroup,
    onMemberRemoved,
}: GroupInfoDialogProps) {
    const [members, setMembers] = useState<GroupMember[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members')
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false)

    // Get store actions for kick and leave
    const kickMember = useChatStore(state => state.kickMember)
    const leaveGroupAction = useChatStore(state => state.leaveGroup)

    // Find if current user is owner
    const currentUserMember = members.find(m => m.id === currentUserId)
    const isCurrentUserOwner = currentUserMember?.isOwner || false

    useEffect(() => {
        if (isOpen) {
            loadMembers()
        }
    }, [isOpen, conversationId])

    const loadMembers = async () => {
        try {
            setIsLoading(true)
            const membersData = await conversationsApi.getGroupMembers(conversationId)
            setMembers(membersData)
        } catch (error) {
            console.error('Failed to load group members:', error)
            Toast.error('Failed to load members')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        confirm({
            variant: 'destructive',
            title: 'Remove Member',
            description: `Are you sure you want to remove ${memberName} from this group?`,
            action: {
                label: 'Remove',
                onClick: async () => {
                    try {
                        // Use kickMember from store which triggers SignalR events
                        await kickMember(conversationId, memberId, memberName)
                        // Reload members list
                        await loadMembers()
                        onMemberRemoved?.()
                    } catch (error) {
                        console.error('Failed to remove member:', error)
                        // Error toast is shown by the store action
                    }
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {},
            },
        })
    }

    const handleLeaveGroup = () => {
        confirm({
            variant: 'destructive',
            title: 'Leave Group',
            description: `Are you sure you want to leave ${conversationTitle || 'this group'}?`,
            action: {
                label: 'Leave',
                onClick: async () => {
                    try {
                        // Use leaveGroup from store which triggers SignalR events and cleanup
                        await leaveGroupAction(conversationId)
                        onClose()
                        onLeaveGroup?.()
                    } catch (error) {
                        console.error('Failed to leave group:', error)
                        // Error toast is shown by the store action
                    }
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {},
            },
        })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

            {/* Dialog */}
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Group Info</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{conversationTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        aria-label="Close dialog"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={cn(
                            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                            activeTab === 'members'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                        )}
                    >
                        Members ({members.length})
                    </button>
                    
                    {/* Add Members Button - Only visible for owners */}
                    {isCurrentUserOwner && (
                        <button
                            onClick={() => setIsAddMembersOpen(true)}
                            className="mr-2 p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Add members"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'members' && (
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : members.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No members found</p>
                            ) : (
                                members.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=random`}
                                            alt={member.displayName}
                                            className="w-10 h-10 rounded-full flex-shrink-0"
                                        />

                                        {/* Member Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                                    {member.displayName}
                                                </p>
                                                {member.isOwner && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {member.addByDisplayName
                                                    ? `Added by ${member.addByDisplayName}`
                                                    : `Joined ${formatDate(member.joinedAt)}`}
                                            </p>
                                        </div>

                                        {/* Actions Menu */}
                                        {isCurrentUserOwner && member.id !== currentUserId && !member.isOwner && (
                                            <div className="relative group">
                                                <button
                                                    onClick={() => handleRemoveMember(member.id, member.displayName)}
                                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    title="Remove member"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M6 18 18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleLeaveGroup}
                        className="w-full py-2.5 px-4 rounded-lg font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        Leave Group
                    </button>
                </div>
            </div>

            {/* Add Members Dialog */}
            <AddMembersDialog
                isOpen={isAddMembersOpen}
                onClose={() => setIsAddMembersOpen(false)}
                conversationId={conversationId}
                currentMembers={members}
                availableMembers={availableMembers}
                onMembersAdded={() => {
                    // Reload members list
                    loadMembers()
                }}
            />
        </div>
    )
}

