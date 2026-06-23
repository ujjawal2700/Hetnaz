import { useEffect } from 'react';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  isActive?: boolean;
  hasBadge?: boolean;
}

interface FemaleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onItemClick?: (itemId: string) => void;
}

export const FemaleSidebar = ({ isOpen, onClose, items, onItemClick }: FemaleSidebarProps) => {
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
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#2f151e] shadow-2xl z-[9999] transform transition-transform duration-300 ease-out animate-[slideInRight_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 overflow-hidden flex items-center justify-center shadow-sm bg-white">
              <img src="/DilMatelogo.jpg" alt="Dil Mate" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold text-pink-600 dark:text-pink-400">Dil Mate</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-[#342d18] transition-colors active:scale-95"
            aria-label="Close menu"
          >
            <MaterialSymbol name="close" size={24} className="text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col p-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative active:scale-95"
              style={{
                backgroundColor: item.isActive
                  ? 'rgba(244, 192, 37, 0.1)'
                  : 'transparent',
              }}
            >
              <div
                className={`flex items-center justify-center size-12 rounded-xl transition-all duration-200 ${item.isActive
                  ? 'bg-primary text-[#231d10]'
                  : 'bg-gray-100 dark:bg-[#342d18] text-gray-600 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                  }`}
              >
                <MaterialSymbol
                  name={item.icon}
                  filled={item.isActive}
                  size={24}
                />
              </div>
              <div className="flex-1 text-left">
                <span
                  className={`text-base font-medium transition-colors duration-200 ${item.isActive
                    ? 'text-primary'
                    : 'text-gray-900 dark:text-white group-hover:text-primary'
                    }`}
                >
                  {item.label}
                </span>
              </div>
              {item.hasBadge && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
              {item.isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
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

