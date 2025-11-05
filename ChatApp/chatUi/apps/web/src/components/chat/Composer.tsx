import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { SendIcon } from './Icons';
import { signalRService } from '../../lib/signalr/hub';

interface ComposerProps {
  conversationId?: string;
  onSend: (text: string) => void;
  isSending?: boolean;
  onFocus?: () => void;
}

export function Composer({ conversationId, onSend, isSending = false, onFocus }: ComposerProps) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send typing stopped when component unmounts
      if (isTypingRef.current && conversationId) {
        signalRService.typingStopped(conversationId).catch(console.error);
      }
    };
  }, [conversationId]);

  const handleTypingStarted = async () => {
    if (!conversationId || !signalRService.isConnected()) {
      console.log('⚠️ Cannot send typing started: conversationId or connection missing');
      return;
    }

    // Only send typing started if not already typing
    if (!isTypingRef.current) {
      try {
        console.log('📤 Sending TypingStarted to server:', conversationId);
        await signalRService.typingStarted(conversationId);
        isTypingRef.current = true;
        console.log('✅ TypingStarted sent successfully');
      } catch (error) {
        console.error('❌ Failed to send typing started:', error);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to automatically stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Auto-stopping typing (3s timeout)');
      handleTypingStopped();
    }, 3000);
  };

  const handleTypingStopped = async () => {
    if (!conversationId || !signalRService.isConnected()) return;

    if (isTypingRef.current) {
      try {
        console.log('📤 Sending TypingStopped to server:', conversationId);
        await signalRService.typingStopped(conversationId);
        isTypingRef.current = false;
        console.log('✅ TypingStopped sent successfully');
      } catch (error) {
        console.error('❌ Failed to send typing stopped:', error);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleInputFocus = () => {
    // Call parent's onFocus handler (for mark as read)
    onFocus?.();
  };

  const handleInputBlur = () => {
    // Stop typing when input loses focus
    handleTypingStopped();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Trigger typing started when user types
    if (newValue.length > 0) {
      handleTypingStarted();
    } else {
      // If message is empty, stop typing
      handleTypingStopped();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      onSend(message.trim());
      setMessage('');
      // Stop typing when message is sent
      handleTypingStopped();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Type a message..."
          className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full py-2 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 dark:text-slate-200"
          rows={1}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          className="bg-blue-600 text-white rounded-full p-2 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
