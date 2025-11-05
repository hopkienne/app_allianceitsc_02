import { useState } from 'react';
import { Conversation, User, Members } from '../../types';
import { cn } from '@workspace/ui/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (conversationId: string) => void | Promise<void>;
  otherUser?: User | Members;
  currentUser: User;
}

export function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick,
  onDelete,
  otherUser,
  currentUser
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const displayName = conversation.title || otherUser?.displayName || 'Unknown';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  
  // Format last message
  const lastMessage = conversation.lastMessage;
  const lastMessageText = lastMessage 
    ? `${lastMessage.senderId === currentUser.id ? 'You: ' : ''}${lastMessage.text}` 
    : 'No messages yet';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(conversation.id);
    }
  };

  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <li
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      className={cn(
        'flex items-center p-3 cursor-pointer rounded-lg transition-colors relative group',
        isSelected 
          ? 'bg-blue-500 text-white' 
          : hasUnread 
            ? 'bg-blue-50 dark:bg-slate-700/50 hover:bg-blue-100 dark:hover:bg-slate-700'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
      aria-current={isSelected}
    >
      <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full mr-4" />
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <p className={cn(
            'font-semibold truncate',
            isSelected 
              ? 'text-white' 
              : hasUnread 
                ? 'text-slate-900 dark:text-slate-50 font-extrabold' 
                : 'text-slate-800 dark:text-slate-100'
          )}>
            {displayName}
          </p>
          {hasUnread && (
            <span className={cn(
              'ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0',
              isSelected 
                ? 'bg-white text-blue-600' 
                : 'bg-blue-600 text-white'
            )}>
              {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
        <p className={cn(
          'text-sm truncate',
          isSelected 
            ? 'text-blue-100' 
            : hasUnread 
              ? 'font-bold text-slate-800 dark:text-slate-200' 
              : 'text-slate-500 dark:text-slate-400'
        )}>
          {lastMessageText}
        </p>
      </div>
      
      {/* More Options Button - visible on hover */}
      {isHovered && onDelete && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn(
              'p-2 rounded-full transition-colors',
              isSelected 
                ? 'hover:bg-blue-600' 
                : 'hover:bg-slate-300 dark:hover:bg-slate-600'
            )}
            aria-label="More options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-50">
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="font-medium">Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
