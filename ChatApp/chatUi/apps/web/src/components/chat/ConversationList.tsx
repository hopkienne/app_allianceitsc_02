import { useState, useEffect } from 'react';
import { Conversation, User, Members } from '../../types';
import { ConversationItem } from './ConversationItem';
import { ChatBubbleLeftRightIcon, UsersIcon } from './Icons';
import { ThemeSelector } from './ThemeSelector';
import { cn } from '@workspace/ui/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<void>;
  currentUser: User;
  isLoading?: boolean;
  members: Members[];
  onUserSelect: (userId: string) => void;
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold transition-colors focus:outline-none',
      isActive
        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
    )}
    aria-selected={isActive}
    role="tab"
  >
    {icon}
    {children}
  </button>
);

const MemberListItem: React.FC<{ member: Members; onSelect: (userId: string) => void }> = ({ member, onSelect }) => {
  const isOnline = member.isOnline;
  return (
    <li
      onClick={() => onSelect(member.id)}
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
        <p className="font-semibold truncate text-slate-800 dark:text-slate-100">{member.displayName}</p>
        <p className={cn('text-sm', isOnline ? 'text-green-500' : 'text-slate-500 dark:text-slate-400')}>
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </li>
  );
};

export function ConversationList({
  conversations,
  selectedConvId,
  onSelectConversation,
  onDeleteConversation,
  currentUser,
  isLoading = false,
  members,
  onUserSelect
}: ConversationListProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'members'>('chats');

  const handleUserSelect = (userId: string) => {
    onUserSelect(userId);
    setActiveTab('chats');
  };

  const conversationListContent = (
    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
      {isLoading ? (
        <div className="p-3 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          No conversations yet
        </div>
      ) : (
        conversations.map((convo) => {
          const otherUserId = convo.memberIds.find(id => id !== currentUser.id);
          const otherUser = members.find(m => m.id === otherUserId);

          return (
            <ConversationItem
              key={convo.id}
              conversation={convo}
              isSelected={convo.id === selectedConvId}
              onClick={() => onSelectConversation(convo.id)}
              onDelete={onDeleteConversation}
              otherUser={otherUser}
              currentUser={currentUser}
            />
          );
        })
      )}
    </ul>
  );

  const membersListContent = (
    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
      {members.filter(m => m.id !== currentUser.id).map((member) => (
        <MemberListItem
          key={member.id}
          member={member}
          onSelect={handleUserSelect}
        />
      ))}
    </ul>
  );

  return (
    <aside className="h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 px-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">ChatApp</h1>
          <ThemeSelector />
        </div>
        <h2 className="hidden lg:block text-lg font-semibold text-slate-700 dark:text-slate-200 px-1">Chats</h2>
      </header>
      
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-700" role="tablist">
        <TabButton 
          isActive={activeTab === 'chats'} 
          onClick={() => setActiveTab('chats')} 
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
        >
          Chats
        </TabButton>
        <TabButton 
          isActive={activeTab === 'members'} 
          onClick={() => setActiveTab('members')} 
          icon={<UsersIcon className="w-5 h-5" />}
        >
          Members
        </TabButton>
      </div>
      
      <div className="hidden lg:flex flex-col flex-1 overflow-y-auto">
        {conversationListContent}
      </div>

      <div className="lg:hidden flex flex-col flex-1 overflow-y-auto">
        {activeTab === 'chats' ? conversationListContent : membersListContent}
      </div>
    </aside>
  );
}
