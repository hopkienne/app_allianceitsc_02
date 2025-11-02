import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@workspace/ui/components/Avatar';
import { Button } from '@workspace/ui/components/Button';
import { MessageCircle, Check, X } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface MessageToastProps {
  senderName: string;
  senderAvatar?: string;
  messagePreview: string;
  conversationId: string;
  onOpen: (conversationId: string) => void;
  onMarkRead: (conversationId: string) => void;
  onDismiss: () => void;
}

/**
 * Custom toast component for new message notifications
 * Displays sender info, message preview, and quick actions
 * Following Slack/Teams pattern for message notifications
 */
export function MessageToast({
  senderName,
  senderAvatar,
  messagePreview,
  conversationId,
  onOpen,
  onMarkRead,
  onDismiss,
}: MessageToastProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 pr-3',
        'bg-white dark:bg-gray-800',
        'rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
        'min-w-[340px] max-w-[400px]',
        'cursor-pointer hover:shadow-xl transition-shadow'
      )}
      onClick={() => onOpen(conversationId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(conversationId);
        }
      }}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0 mt-0.5">
        <AvatarImage src={senderAvatar} alt={senderName} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {senderName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Sender Name */}
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {senderName}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mr-1"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message Preview */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {messagePreview}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(conversationId);
            }}
            className="h-7 text-xs px-3"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Open
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(conversationId);
              onDismiss();
            }}
            className="h-7 text-xs px-3"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Mark Read
          </Button>
        </div>
      </div>
    </div>
  );
}
