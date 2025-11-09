import { useState, useEffect } from 'react'
import { Members } from '../../types'
import { membersApi } from '../../lib/api/members'
import { conversationsApi } from '../../lib/api/conversations'
import { XMarkIcon, MagnifyingGlassIcon } from './Icons'
import { cn } from '@workspace/ui/lib/utils'
import Toast from '../../lib/toast'

interface CreateGroupDialogProps {
    isOpen: boolean
    onClose: () => void
    currentUserId: string
    onGroupCreated?: () => void
}

export function CreateGroupDialog({ isOpen, onClose, currentUserId, onGroupCreated }: CreateGroupDialogProps) {
    const [groupName, setGroupName] = useState('')
    const [members, setMembers] = useState<Members[]>([])
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadMembers()
        } else {
            // Reset state when dialog closes
            setGroupName('')
            setSelectedMemberIds(new Set())
            setSearchQuery('')
        }
    }, [isOpen])

    const loadMembers = async () => {
        try {
            setIsLoading(true)
            const allMembers = await membersApi.getOnlineMembers()
            // Filter out current user
            setMembers(allMembers.filter(m => m.id !== currentUserId))
        } catch (error) {
            console.error('Failed to load members:', error)
            Toast.error('Failed to load members')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMember = (memberId: string) => {
        const newSelected = new Set(selectedMemberIds)
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId)
        } else {
            newSelected.add(memberId)
        }
        setSelectedMemberIds(newSelected)
    }

    const handleCreate = async () => {
        if (selectedMemberIds.size === 0) {
            Toast.error('Please select at least one member')
            return
        }

        try {
            setIsCreating(true)
            const trimmedGroupName = groupName.trim()
            await conversationsApi.createGroup({
                groupName: trimmedGroupName || '',
                memberIds: Array.from(selectedMemberIds),
            })

            Toast.success('Group created successfully')
            onClose()
            onGroupCreated?.()
        } catch (error) {
            console.error('Failed to create group:', error)
        } finally {
            setIsCreating(false)
        }
    }

    // Filter members based on search query
    const filteredMembers = members.filter(member =>
        member.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

            {/* Dialog */}
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Create Group</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        aria-label="Close dialog"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Group Name Input */}
                    <div>
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="Group Name (optional)"
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Members Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Members</h3>
                            {selectedMemberIds.size > 0 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    {selectedMemberIds.size} selected
                                </span>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="mb-3 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search members..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {isLoading ? (
                            <div className="space-y-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                                {searchQuery ? 'No members found' : 'No members available'}
                            </p>
                        ) : (
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {filteredMembers.map(member => {
                                    const isSelected = selectedMemberIds.has(member.id)
                                    return (
                                        <label
                                            key={member.id}
                                            className={cn(
                                                'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                                            )}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=random`}
                                                    alt={member.displayName}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                                    {member.displayName}
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleMember(member.id)}
                                                className="w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleCreate}
                        disabled={selectedMemberIds.size === 0 || isCreating}
                        className={cn(
                            'w-full py-2.5 px-4 rounded-lg font-medium transition-colors',
                            selectedMemberIds.size === 0 || isCreating
                                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white',
                        )}
                    >
                        {isCreating ? 'Creating...' : `Create Chat (${selectedMemberIds.size})`}
                    </button>
                </div>
            </div>
        </div>
    )
}
