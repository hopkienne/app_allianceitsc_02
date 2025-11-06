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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && conversationId) {
        signalRService.typingStopped(conversationId).catch(console.error);
      }
    };
  }, [conversationId]);

  const handleTypingStarted = async () => {
    if (!conversationId || !signalRService.isConnected()) {
      return;
    }
    if (!isTypingRef.current) {
      try {
        await signalRService.typingStarted(conversationId);
        isTypingRef.current = true;
      } catch (error) {
      }
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStopped();
    }, 3000);
  };

  const handleTypingStopped = async () => {
    if (!conversationId || !signalRService.isConnected()) return;

    if (isTypingRef.current) {
      try {
        await signalRService.typingStopped(conversationId);
        isTypingRef.current = false;
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
    onFocus?.();
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const relatedTarget = e.relatedTarget as HTMLButtonElement;
    if (relatedTarget?.type === 'submit') return;
    handleTypingStopped();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    if (newValue.length > 0) handleTypingStarted();
    else handleTypingStopped();
  };

  // —— Tách logic gửi để dùng chung cho Enter và Submit
  const send = () => {
    const text = message.trim();
    if (!text || isSending) return;

    onSend(text);
    setMessage('');

    // Refocus chắc chắn sau khi state cập nhật
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus({ preventScroll: true });
        // đưa caret về cuối (ở đây là vị trí 0 vì đã clear)
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });

    // dừng trạng thái typing
    handleTypingStopped();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoFocus
          placeholder="Type a message..."
          className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full py-2 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 dark:text-slate-200"
          rows={1}
        />
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          className="bg-blue-600 text-white rounded-full p-2 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
