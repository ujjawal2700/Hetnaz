import { useState, useRef } from 'react';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';


interface SearchBarProps {
  placeholder?: string;
  title?: string;
  showLogo?: boolean;
  onSearch?: (query: string) => void;
  onFilterToggle?: () => void;
  variant?: 'default' | 'full';
  titleColor?: 'gradient' | 'black';
}

export const SearchBar = ({ 
  placeholder = 'Search...',
  title,
  showLogo = true,
  onSearch,
  onFilterToggle,
  variant = 'default',
  titleColor = 'gradient'
}: SearchBarProps) => {

  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(variant === 'full');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const toggleExpand = () => {
    if (variant === 'full') return;
    
    if (isExpanded) {
      setQuery('');
      onSearch?.('');
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  return (
    <div className={`relative px-4 flex items-center justify-between gap-2 w-full max-w-full overflow-hidden ${variant === 'full' ? 'px-0 py-1.5 min-h-[52px]' : 'py-2 min-h-[70px]'}`}>
      {/* 1. Mobile-only Expanded Search Overlay */}
      {variant !== 'full' && (
        <div 
          className={`flex items-center skeuo-inset p-1 rounded-2xl bg-white/95 dark:bg-[#1a0f14]/95 backdrop-blur-md border border-white/30 dark:border-white/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] absolute inset-y-2 z-30 ${
            isExpanded 
              ? 'left-4 right-[70px] opacity-100 pr-14' 
              : 'left-[calc(100%-124px)] right-[70px] opacity-0 pointer-events-none overflow-hidden'
          }`}
        >
          <div className="pl-4 text-primary shrink-0">
            <MaterialSymbol name="search" size={20} filled />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            className="flex-1 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 px-2 text-[14px] font-bold"
            placeholder={placeholder}
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); onSearch?.(''); inputRef.current?.focus(); }}
              className="px-2 text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <MaterialSymbol name="cancel" size={16} filled />
            </button>
          )}
        </div>
      )}

      {/* 2. Brand Section (Logo & Title) */}
      {variant !== 'full' && (
        <div className="shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            {showLogo && (
              <img 
                src="/DilMate.png" 
                alt="Logo" 
                className={`h-14 w-14 object-contain shrink-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isExpanded ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'
                }`}
              />
            )}
            <span className={`font-black tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              !showLogo ? 'text-3xl pl-2' : 'text-2xl'
            } ${
              isExpanded ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'
            } ${
              titleColor === 'black' 
                ? 'text-slate-900 dark:text-white' 
                : 'bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent'
            }`}>
              {title || 'Dil Mate'}
            </span>
          </div>
        </div>
      )}

      {/* 3. Action Section (Full-width search OR Toggle Button) */}
      <div className={`relative h-[54px] flex items-center transition-all duration-500 ease-in-out ${
        variant === 'full' ? 'w-full ml-0' : 'flex-1 justify-end'
      }`}>
        {/* Full-width variant for search-focused pages (Chat List) */}
        {variant === 'full' && (
          <div className="flex items-center skeuo-inset p-1 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/5 w-full static opacity-100 visible">
            <div className="pl-4 text-primary shrink-0">
              <MaterialSymbol name="search" size={20} filled />
            </div>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              className="flex-1 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 px-2 text-[14px] font-bold"
              placeholder={placeholder}
            />
            {query && (
              <button 
                onClick={() => { setQuery(''); onSearch?.(''); }}
                className="px-2 text-gray-400 hover:text-primary transition-colors shrink-0"
              >
                <MaterialSymbol name="cancel" size={16} filled />
              </button>
            )}
          </div>
        )}

        {/* Search Toggle Button for Discovery pages */}
        {variant !== 'full' && (
          <button
            onClick={toggleExpand}
            className={`skeuo-button h-[54px] w-[54px] rounded-2xl flex items-center justify-center transition-all active:scale-95 z-40`}
            aria-label={isExpanded ? "Close search" : "Search"}
          >
            <MaterialSymbol 
              name={isExpanded ? "close" : "search"} 
              size={24} 
              className={isExpanded ? "text-primary" : "text-gray-500"} 
            />
          </button>
        )}
      </div>

      {/* 4. Persistence Filter Button */}
      {onFilterToggle && (
        <button
          onClick={onFilterToggle}
          className="skeuo-button h-[54px] w-[54px] rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0 group z-40"
          aria-label="Toggle filters"
        >
          <MaterialSymbol 
            name="tune" 
            size={24} 
            className="text-gray-500 group-hover:text-primary transition-colors" 
          />
        </button>
      )}
    </div>
  );
};
