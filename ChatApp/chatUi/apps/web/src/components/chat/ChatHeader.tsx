import { Members } from '../../types';
import { ArrowLeftIcon, UsersIcon } from './Icons';
import { cn } from '@workspace/ui/lib/utils';

interface ChatHeaderProps {
  user?: Members;
  title?: string;
  avatarUrl?: string;
  onBack?: () => void;
  isGroup?: boolean;
  onInfoClick?: () => void;
}

export function ChatHeader({ user, title, avatarUrl, onBack, isGroup, onInfoClick }: ChatHeaderProps) {
  const displayName = title || user?.displayName || 'Chat';
  const avatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const subtitle = isGroup ? 'Group Chat' : user ? 'Direct Message' : 'Chat';

  return (
    <header className="flex items-center p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
      {onBack && (
        <button onClick={onBack} className="md:hidden mr-3 text-slate-600 dark:text-slate-300">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      )}
      <img src={avatar} alt={displayName} className="w-10 h-10 rounded-full mr-3" />
      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
          {subtitle}
        </p>
      </div>
      
      {/* Info button for group conversations */}
      {isGroup && onInfoClick && (
        <button
          onClick={onInfoClick}
          className="ml-2 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Group info"
          title="Group info"
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
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </button>
      )}
    </header>
  );
}
