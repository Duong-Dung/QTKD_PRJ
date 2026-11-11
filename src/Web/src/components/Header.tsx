import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  breadcrumbs?: string[];
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs = ['Quản lý kinh doanh', 'Hợp đồng'],
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-slate-300">/</span>}
            <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-slate-800' : 'hover:text-slate-700'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right User Actions */}
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <button
          title="Thông báo"
          className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
        </button>

        {/* User Card */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm ring-1 ring-blue-200">
            H
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              VAN PHU HIEU
            </div>
            <div className="text-xs text-slate-500 font-medium">Nhân viên Kinh doanh</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </header>
  );
};
