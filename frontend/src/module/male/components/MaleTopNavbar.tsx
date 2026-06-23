import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useGlobalState } from '../../../core/context/GlobalStateContext';

interface MaleTopNavbarProps {
  title?: string;
}

export const MaleTopNavbar = ({ title }: MaleTopNavbarProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useGlobalState();

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-pink-50/95 via-rose-50/95 to-pink-50/95 dark:from-[#1a0f14]/95 dark:via-[#2d1a24]/95 dark:to-[#1a0f14]/95 backdrop-blur-lg border-b border-pink-200/50 dark:border-pink-900/30 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto w-full">
        {/* Logo or Title */}
        {title ? (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img src="/DilMate.png" alt="Dil Mate" className="w-14 h-14 object-cover rounded-3xl shadow-sm border border-white/40 dark:border-white/5" />
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent drop-shadow-sm uppercase">Dil Mate</span>
          </div>
        )}

        {/* Notifications Icon (Replaced Hamburger) */}
        <button
          onClick={() => navigate('/male/notifications')}
          className="relative flex items-center justify-center size-12 rounded-2xl hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-all active:scale-90"
          aria-label="Notifications"
        >
          <MaterialSymbol name="notifications" size={28} className="text-pink-700 dark:text-pink-300" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-white dark:border-[#2d1a24] shadow-md animate-in zoom-in-50 duration-200">
              {unreadCount > 10 ? '10+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

