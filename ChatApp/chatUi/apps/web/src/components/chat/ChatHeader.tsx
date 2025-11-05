import { Members } from '../../types';
import { ArrowLeftIcon, UsersIcon } from './Icons';
import { cn } from '@workspace/ui/lib/utils';

interface ChatHeaderProps {
  user?: Members;
  title?: string;
  avatarUrl?: string;
  onBack?: () => void;
}

export function ChatHeader({ user, title, avatarUrl, onBack }: ChatHeaderProps) {
  const displayName = title || user?.displayName || 'Chat';
  const avatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const subtitle = user ? 'Direct Message' : 'Chat';

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
    </header>
  );
}
