import { UsersIcon } from './Icons'

interface GroupCreatedToastProps {
    groupName: string
    creatorName: string
    memberCount: number
    onDismiss: () => void
}

export function GroupCreatedToast({ groupName, creatorName, memberCount, onDismiss }: GroupCreatedToastProps) {
    return (
        <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[320px] max-w-[400px]">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            New Group Created
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{creatorName}</span> added
                            you to{' '}
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                                {groupName || 'a new group'}
                            </span>
                        </p>
                        {memberCount > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {memberCount} {memberCount === 1 ? 'member' : 'members'}
                            </p>
                        )}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        aria-label="Dismiss"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

