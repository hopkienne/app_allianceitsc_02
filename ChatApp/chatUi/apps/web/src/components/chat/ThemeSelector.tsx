import { useTheme } from '../../hooks/useTheme';
import { cn } from '@workspace/ui/lib/utils';

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const MonitorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-4 h-4" />;
      case 'dark':
        return <MoonIcon className="w-4 h-4" />;
      case 'system':
        return <MonitorIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className={cn(
          'appearance-none bg-slate-100 dark:bg-slate-700 border-0',
          'rounded-lg pl-9 pr-8 py-2 text-sm font-medium cursor-pointer',
          'text-slate-700 dark:text-slate-200',
          'hover:bg-slate-200 dark:hover:bg-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors'
        )}
        aria-label="Select theme"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      
      {/* Icon on the left */}
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-300">
        {getIcon()}
      </div>
      
      {/* Custom dropdown arrow */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
