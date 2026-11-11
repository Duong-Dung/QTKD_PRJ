import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  breadcrumbs: string[];
}

export const Header: React.FC<HeaderProps> = ({ breadcrumbs }) => {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#4B5563] min-w-0">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb}-${index}`}>
            {index > 0 && <span className="text-[#9CA3AF]">/</span>}
            <span
              className={`truncate ${
                index === breadcrumbs.length - 1
                  ? 'font-semibold text-[#111827]'
                  : 'text-[#4B5563]'
              }`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <button
          type="button"
          title="Thông báo"
          aria-label="Thông báo"
          className="relative p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB]">
          <div className="w-9 h-9 rounded-full bg-[#DBEAFE] text-[#1E3A8A] font-bold flex items-center justify-center text-sm">
            KD
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-sm font-semibold text-[#111827]">Phòng Kinh doanh</div>
            <div className="text-xs text-[#4B5563]">Nhân viên Kinh doanh</div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#9CA3AF] hidden sm:block" />
        </div>
      </div>
    </header>
  );
};
