import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';

interface AdminTopNavbarProps {
  onMenuClick: () => void;
}

export const AdminTopNavbar = ({ onMenuClick }: AdminTopNavbarProps) => {
  return (
    <div className="sticky top-0 z-40 bg-[#23282d] border-b border-[#3c434a] shadow-md lg:ml-64">
      <div className="flex items-center justify-between px-5 h-[57px]">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu - Only on mobile */}
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center size-10 rounded hover:bg-[#32373c] transition-all active:scale-95 text-[#c3c4c7] hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <MaterialSymbol name="menu" size={24} />
          </button>

          <div>
            <span className="text-lg font-semibold text-white">Dil Mate</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center size-9 rounded hover:bg-[#32373c] transition-all"
            title="View Site"
          >
            <MaterialSymbol name="public" size={20} className="text-[#c3c4c7] hover:text-white" />
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-[#32373c] transition-all"
            title="Account"
          >
            <MaterialSymbol name="account_circle" size={24} className="text-[#c3c4c7]" />
            <span className="text-sm text-[#c3c4c7] hidden sm:inline">Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
