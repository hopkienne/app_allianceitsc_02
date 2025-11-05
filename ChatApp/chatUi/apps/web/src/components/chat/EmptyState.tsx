import { ChatBubbleLeftRightIcon } from './Icons';

export function EmptyState() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-center p-4">
      <ChatBubbleLeftRightIcon className="w-24 h-24 text-slate-300 dark:text-slate-600" />
      <h2 className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-300">Select a conversation</h2>
      <p className="mt-1 text-slate-500 dark:text-slate-400 max-w-sm">
        Choose from the list on the left or start a new chat with a member.
      </p>
    </div>
  );
}
