import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useGlobalState } from '../../../core/context/GlobalStateContext';

export const FemaleTopNavbar = () => {
  const navigate = useNavigate();
  const { unreadCount } = useGlobalState();

  return (
    <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#221e10]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 overflow-hidden flex items-center justify-center shadow-sm bg-white">
            <img src="/DilMatelogo.jpg" alt="Dil Mate" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold text-pink-600 dark:text-pink-400">Dil Mate</span>
        </div>

        {/* Notifications Icon (Replaced Hamburger) */}
        <button
          onClick={() => navigate('/female/notifications')}
          className="relative flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-[#342d18] transition-colors active:scale-95"
          aria-label="Notifications"
        >
          <MaterialSymbol name="notifications" size={24} className="text-gray-900 dark:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white border-2 border-white dark:border-[#221e10] shadow-sm animate-in zoom-in-50 duration-200">
              {unreadCount > 10 ? '10+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

