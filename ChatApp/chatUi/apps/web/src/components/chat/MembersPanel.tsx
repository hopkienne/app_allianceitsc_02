import { Members } from '../../types';
import { cn } from '@workspace/ui/lib/utils';

interface MembersPanelProps {
  members: Members[];
  onStartChat: (userId: string) => void;
  isLoading?: boolean;
}

export function MembersPanel({ members, onStartChat, isLoading = false }: MembersPanelProps) {
  return (
    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
      {isLoading ? (
        <div className="p-3 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        members.map((member) => {
          const isOnline = member.isOnline;
          return (
            <li
              key={member.id}
              onClick={() => onStartChat(member.id)}
              className="flex items-center p-3 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              aria-label={`Start chat with ${member.displayName}`}
            >
              <div className="relative">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=random`}
                  alt={member.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <span
                  className={cn(
                    'absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-slate-800',
                    isOnline ? 'bg-green-500' : 'bg-slate-400'
                  )}
                  title={isOnline ? 'Online' : 'Offline'}
                ></span>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="font-semibold truncate text-slate-800 dark:text-slate-100">
                  {member.displayName}
                </p>
                <p className={cn('text-sm', isOnline ? 'text-green-500' : 'text-slate-500 dark:text-slate-400')}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
}
