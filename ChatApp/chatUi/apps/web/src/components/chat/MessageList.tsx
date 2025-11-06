import { useEffect, useRef, useState } from 'react';
import { Message, Members } from '../../types';
import { cn } from '@workspace/ui/lib/utils';
import { formatTime } from '../../lib/utils';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  users: Members[];
  conversationId?: string;
  onReaction?: (messageId: string, emoji: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  sender?: Members;
  showAuthorName: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, sender, showAuthorName }) => {
  const alignment = isOwn ? 'items-end' : 'items-start';
  const bubbleColor = isOwn
    ? 'bg-blue-600 text-white'
    : 'bg-white dark:bg-slate-700 dark:text-slate-200 text-slate-800';
  const bubbleRadius = isOwn
    ? 'rounded-t-2xl rounded-bl-2xl'
    : 'rounded-t-2xl rounded-br-2xl';

  // Check icons for message status
  const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const CheckCheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 13l4 4L15.5 7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 13l4 4L22.5 7" />
    </svg>
  );

  const StatusIcon = ({ status }: { status: string }) => {
    const getStatusInfo = () => {
      switch (status) {
        case 'sent':
          return {
            icon: <CheckIcon />,
            color: 'text-slate-400 dark:text-slate-500',
            tooltip: 'Sent'
          };
        case 'delivered':
          return {
            icon: <CheckCheckIcon />,
            color: 'text-slate-400 dark:text-slate-500',
            tooltip: 'Delivered'
          };
        case 'read':
          return {
            icon: <CheckCheckIcon />,
            color: 'text-blue-500 dark:text-blue-400 font-bold',
            tooltip: 'Read'
          };
        default:
          return null;
      }
    };

    const statusInfo = getStatusInfo();
    if (!statusInfo) return null;

    return (
      <span 
        className={cn('flex items-center relative group', statusInfo.color)}
        title={statusInfo.tooltip}
      >
        {statusInfo.icon}
        {/* Tooltip */}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {statusInfo.tooltip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></span>
        </span>
      </span>
    );
  };

  return (
    <div className={cn('flex flex-col', alignment, 'w-full')}>
      <div className="flex items-end gap-2 max-w-xs md:max-w-md">
        {!isOwn && (
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.displayName || 'U')}&background=random`}
            alt={sender?.displayName || 'User'}
            className="w-6 h-6 rounded-full mb-1"
          />
        )}
        <div className="flex flex-col">
          {showAuthorName && !isOwn && (
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-3 mb-1">
              {sender?.displayName}
            </span>
          )}
          <div className={cn('px-4 py-2', bubbleColor, bubbleRadius, 'shadow-sm')}>
            <p className="text-sm">{message.text}</p>
          </div>
          {/* Show timestamp and read status for own messages */}
          <div className={cn(
            'flex items-center gap-1.5 mt-1 text-xs',
            isOwn ? 'flex-row-reverse text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'
          )}>
            <span className="relative group cursor-default">
              {formatTime(message.createdAt)}
              {/* Time tooltip with full timestamp */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {new Date(message.createdAt).toLocaleString()}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></span>
              </span>
            </span>
            {isOwn && message.status && <StatusIcon status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export function MessageList({ 
  messages, 
  currentUserId, 
  users,
  conversationId,
  onReaction,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousScrollHeight = useRef<number>(0);
  const previousConversationId = useRef<string | undefined>(conversationId);
  const isNearBottom = useRef(true);

  // Reset scroll state when conversation changes
  useEffect(() => {
    if (conversationId !== previousConversationId.current) {
      previousConversationId.current = conversationId;
      setShouldScrollToBottom(true);
      isNearBottom.current = true;
    }
  }, [conversationId]);

  // Scroll to bottom when conversation changes or new messages arrive (if user is near bottom)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      if (shouldScrollToBottom) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
        setShouldScrollToBottom(false);
      } else if (isNearBottom.current) {
        // Auto-scroll to bottom when new messages arrive (if user is already near bottom)
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }
    }
  }, [messages, shouldScrollToBottom]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (scrollRef.current && !shouldScrollToBottom && previousScrollHeight.current > 0) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight.current;
      scrollRef.current.scrollTop = heightDifference;
    }
  }, [messages, shouldScrollToBottom]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    
    // Check if user is near the bottom (within 100px)
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    isNearBottom.current = distanceFromBottom < 100;
    
    // Load more when scrolled to top
    if (target.scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      previousScrollHeight.current = target.scrollHeight;
      onLoadMore();
    }
  };

  const getUser = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900" ref={scrollRef} onScroll={handleScroll}>
      {/* Loading indicator at top */}
      {isLoadingMore && (
        <div className="flex items-start">
          <div className="px-4 py-2 bg-white dark:bg-slate-700 rounded-t-2xl rounded-br-2xl shadow-sm">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}

      {messages.map((msg, index) => {
        const prevMessage = messages[index - 1];
        const showAuthor = !prevMessage || prevMessage.senderId !== msg.senderId;
        const isOwn = msg.senderId === currentUserId;
        const sender = getUser(msg.senderId);

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={isOwn}
            sender={sender}
            showAuthorName={showAuthor}
          />
        );
      })}
    </div>
  );
}
