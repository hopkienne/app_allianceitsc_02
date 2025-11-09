import { useState, useEffect } from 'react'
import { Members } from '../../types'
import { GroupMember, conversationsApi } from '../../lib/api/conversations'
import { XMarkIcon, MagnifyingGlassIcon } from './Icons'
import { cn } from '@workspace/ui/lib/utils'
import Toast from '../../lib/toast'

interface AddMembersDialogProps {
    isOpen: boolean
    onClose: () => void
    conversationId: string
    currentMembers: GroupMember[]
    availableMembers: Members[] // Pre-loaded from useDirectoryStore
    onMembersAdded?: () => void
}

export function AddMembersDialog({
    isOpen,
    onClose,
    conversationId,
    currentMembers,
    availableMembers,
    onMembersAdded,
}: AddMembersDialogProps) {
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
    const [isAdding, setIsAdding] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Get current member IDs for filtering
    const currentMemberIds = new Set(currentMembers.map(m => m.id))

    // Filter out members who are already in the group
    const membersToAdd = availableMembers.filter(m => !currentMemberIds.has(m.id))

    // Filter based on search query
    const filteredMembers = membersToAdd.filter(member =>
        member.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    useEffect(() => {
        if (!isOpen) {
            // Reset state when dialog closes
            setSelectedMemberIds(new Set())
            setSearchQuery('')
        }
    }, [isOpen])

    const toggleMember = (memberId: string) => {
        const newSelected = new Set(selectedMemberIds)
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId)
        } else {
            newSelected.add(memberId)
        }
        setSelectedMemberIds(newSelected)
    }

    const handleAddMembers = async () => {
        if (selectedMemberIds.size === 0) {
            Toast.error('Please select at least one member')
            return
        }

        try {
            setIsAdding(true)
            await conversationsApi.addMembers(conversationId, Array.from(selectedMemberIds))

            Toast.success(`Added ${selectedMemberIds.size} member${selectedMemberIds.size > 1 ? 's' : ''}`)
            onClose()
            onMembersAdded?.()
        } catch (error) {
            console.error('Failed to add members:', error)
            Toast.error('Failed to add members')
        } finally {
            setIsAdding(false)
        }
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
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add Members</h2>
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
                    {/* Search Input */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search members..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Members List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Members</h3>
                            {selectedMemberIds.size > 0 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    {selectedMemberIds.size} selected
                                </span>
                            )}
                        </div>

                        {filteredMembers.length === 0 ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                                {searchQuery
                                    ? 'No members found'
                                    : membersToAdd.length === 0
                                      ? 'All available members are already in the group'
                                      : 'No members available'}
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
                                                {member.isOnline && (
                                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 bg-green-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                                    {member.displayName}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {member.isOnline ? 'Online' : 'Offline'}
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
                        onClick={handleAddMembers}
                        disabled={selectedMemberIds.size === 0 || isAdding}
                        className={cn(
                            'w-full py-2.5 px-4 rounded-lg font-medium transition-colors',
                            selectedMemberIds.size === 0 || isAdding
                                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white',
                        )}
                    >
                        {isAdding ? 'Adding...' : `Add ${selectedMemberIds.size || ''} Member${selectedMemberIds.size !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

