import { useState, useEffect } from 'react';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';

interface SubItem {
  id: string;
  label: string;
  path: string;
  isActive?: boolean;
  badgeCount?: number;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  isActive?: boolean;
  hasBadge?: boolean;
  badgeCount?: number;
  subItems?: SubItem[];
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onItemClick?: (itemId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar = ({ isOpen, onClose, items, onItemClick, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['users', 'finance']));

  useEffect(() => {
    // Auto-expand parent if child is active
    items.forEach(item => {
      if (item.subItems?.some(sub => sub.isActive)) {
        setExpandedItems(prev => new Set(prev).add(item.id));
      }
    });
  }, [items]);

  useEffect(() => {
    // Only lock body scroll on mobile when sidebar is open
    const handleResize = () => {
      if (isOpen && window.innerWidth < 1024) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && window.innerWidth < 1024) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  const handleItemClick = (itemId: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      // Toggle expansion
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    } else {
      onItemClick?.(itemId);
      // Only close sidebar on mobile
      if (window.innerWidth < 1024) {
        onClose();
      }
    }
  };

  return (
    <>
      {/* Backdrop - Only on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] animate-[fadeIn_0.2s_ease-out] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Enhanced with Collapse */}
      <div
        className={`
          fixed top-0 h-full bg-[#1d2327] z-[9999] transition-all duration-300 ease-out
          lg:left-0 lg:translate-x-0 lg:shadow-none
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${isOpen ? 'left-0 translate-x-0 shadow-2xl w-64' : 'left-0 -translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2c3338] h-[57px] bg-[#1d2327]">
          <div className={`flex items-center gap-2 transition-opacity duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden shadow-md">
              <img src="/DilMatelogo.jpg" alt="Dil Mate" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold text-white whitespace-nowrap">Dil Mate Admin</span>
          </div>

          {/* Collapse Toggle - Desktop only */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center size-8 rounded hover:bg-[#2c3338] transition-colors active:scale-95"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <MaterialSymbol
                name={isCollapsed ? "chevron_right" : "chevron_left"}
                size={20}
                className="text-gray-400"
              />
            </button>
          )}

          {/* Close button - Mobile only */}
          <button
            onClick={onClose}
            className="flex items-center justify-center size-8 rounded hover:bg-[#2c3338] transition-colors active:scale-95 lg:hidden"
            aria-label="Close menu"
          >
            <MaterialSymbol name="close" size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col py-2 overflow-y-auto max-h-[calc(100vh-110px)] wp-scrollbar">
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const hasSubItems = (item.subItems?.length || 0) > 0;

            return (
              <div key={item.id} className="relative">
                {/* Main Item */}
                <button
                  onClick={() => handleItemClick(item.id, hasSubItems)}
                  className={`flex items-center gap-3 px-4 py-2.5 w-full transition-all duration-150 relative group ${item.isActive && !hasSubItems
                      ? 'bg-[#2c3338] text-[#72aee6] border-l-4 border-[#72aee6]'
                      : 'text-[#c3c4c7] hover:bg-[#2c3338] hover:text-white border-l-4 border-transparent'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <MaterialSymbol
                    name={item.icon}
                    filled={item.isActive && !hasSubItems}
                    size={20}
                    className="flex-shrink-0"
                  />
                  <span className={`flex-1 text-left text-sm font-normal transition-opacity duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>
                    {item.label}
                  </span>
                  {item.hasBadge && (
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#d63638] text-white text-[10px] font-semibold transition-opacity duration-300 ${isCollapsed ? 'lg:absolute lg:top-1 lg:right-1' : ''}`}>
                      {item.badgeCount}
                    </span>
                  )}
                  {hasSubItems && !isCollapsed && (
                    <MaterialSymbol
                      name="expand_more"
                      size={18}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Sub Items - Only show when not collapsed */}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <div className="bg-[#23282d] border-l-4 border-[#2c3338]">
                    {item.subItems!.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          onItemClick?.(subItem.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`flex items-center gap-2 pl-12 pr-4 py-2 w-full text-sm transition-all duration-150 relative ${subItem.isActive
                            ? 'text-[#72aee6] bg-[#1d2327]'
                            : 'text-[#a7aaad] hover:text-[#72aee6] hover:bg-[#1d2327]'
                          }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                        <span className="flex-1 text-left">{subItem.label}</span>
                        {subItem.badgeCount && subItem.badgeCount > 0 && (
                          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#d63638] text-white text-[10px] font-semibold">
                            {subItem.badgeCount}
                          </span>
                        )}
                        {subItem.isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#72aee6]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-[#2c3338] bg-[#1d2327] transition-opacity duration-300 ${isCollapsed ? 'lg:opacity-0' : 'opacity-100'}`}>
          <div className="text-[10px] text-[#787c82] text-center">
            © {new Date().getFullYear()} Dil Mate Admin
          </div>
        </div>
      </div>

      <style>{`
        .wp-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .wp-scrollbar::-webkit-scrollbar-track {
          background: #23282d;
        }
        .wp-scrollbar::-webkit-scrollbar-thumb {
          background: #3c434a;
          border-radius: 6px;
        }
        .wp-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #50575e;
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
