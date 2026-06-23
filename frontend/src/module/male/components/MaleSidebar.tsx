import { useEffect } from 'react';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  isActive?: boolean;
  hasBadge?: boolean;
}

interface MaleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onItemClick?: (itemId: string) => void;
}

export const MaleSidebar = ({ isOpen, onClose, items, onItemClick }: MaleSidebarProps) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (itemId: string) => {
    onItemClick?.(itemId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-white via-pink-50/30 to-white dark:from-[#1a0f14] dark:via-[#2d1a24] dark:to-[#1a0f14] shadow-2xl z-[9999] transform transition-transform duration-300 ease-out animate-[slideInRight_0.3s_ease-out] border-l border-pink-200/50 dark:border-pink-900/30">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-pink-200/50 dark:border-pink-900/30 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-[#2d1a24] dark:to-[#3d2530]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shadow-md overflow-hidden bg-white">
              <img src="/DilMatelogo.jpg" alt="Dil Mate" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">Dil Mate</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-xl hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <MaterialSymbol name="close" size={24} className="text-pink-700 dark:text-pink-300" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col p-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative active:scale-95 mb-1 ${item.isActive
                ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 shadow-md'
                : 'hover:bg-pink-50/50 dark:hover:bg-pink-900/10'
                }`}
            >
              <div
                className={`flex items-center justify-center size-12 rounded-xl transition-all duration-200 shadow-sm ${item.isActive
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg'
                  : 'bg-pink-100/50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 group-hover:bg-gradient-to-br group-hover:from-pink-400 group-hover:to-rose-400 group-hover:text-white'
                  }`}
              >
                <MaterialSymbol
                  name={item.icon}
                  filled={item.isActive}
                  size={24}
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span
                  className={`text-base font-medium transition-colors duration-200 truncate block ${item.isActive
                    ? 'text-pink-700 dark:text-pink-300'
                    : 'text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400'
                    }`}
                >
                  {item.label}
                </span>
              </div>
              {item.hasBadge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-md">
                  !
                </span>
              )}
              {item.isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-gradient-to-b from-pink-500 to-rose-500 rounded-r-full shadow-sm" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-pink-200/50 dark:border-pink-900/30 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-[#2d1a24]/50 dark:to-[#3d2530]/50">
          <div className="text-xs text-pink-600/70 dark:text-pink-400/70 text-center font-medium">
            Dil Mate © {new Date().getFullYear()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

