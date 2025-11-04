import React from 'react';

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
      clipRule="evenodd"
    />
  </svg>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM5.25 9.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zM15 9.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zM3 13.5a.75.75 0 00-.75.75v.75a3 3 0 003 3h3a3 3 0 003-3v-.75a.75.75 0 00-.75-.75h-7.5a.75.75 0 00-.75.75zM12.75 13.5a.75.75 0 00-.75.75v.75a3 3 0 003 3h3a3 3 0 003-3v-.75a.75.75 0 00-.75-.75h-7.5a.75.75 0 00-.75.75z" />
  </svg>
);

export const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72.372a11.25 11.25 0 0 1-5.58 0l-3.72-.372A2.007 2.007 0 0 1 3 14.894V10.608c0-.97.616-1.813 1.5-2.097m16.5 0c.225-.083.45-.174.675-.274m-17.85 0c.225.083.45.174.675.274m16.5 0v.216c0 .213-.024.423-.068.624m-17.85 0v.216c0 .213.024.423.068.624m16.5 0a8.966 8.966 0 0 1-1.144 3.253m-15.212 0A8.966 8.966 0 0 0 4.5 12.251m15 0a8.963 8.963 0 0 1-4.252 5.513m-6.496 0A8.963 8.963 0 0 0 6 12.251m7.5-3.75h.008v.008H12v-.008Zm-3.75 0h.008v.008H8.25v-.008Zm7.5 0h.008v.008h-.008v-.008Zm-3.75 0h.008v.008h-.008v-.008Z" />
  </svg>
);

export const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.15 48.902 48.902 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z"
      clipRule="evenodd"
    />
  </svg>
);
