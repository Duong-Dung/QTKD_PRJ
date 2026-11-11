import React from 'react';
import {
  BarChart3,
  Bell,
  CheckSquare,
  CreditCard,
  FilePlus2,
  FileText,
  HelpCircle,
  LayoutGrid,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SIDEBAR_MENU_ITEMS: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
  { id: 'customers', label: 'Khách hàng', icon: Users },
  { id: 'contracts', label: 'Hợp đồng', icon: FileText },
  { id: 'addenda', label: 'Phụ lục', icon: FilePlus2 },
  { id: 'pricing', label: 'Bảng giá', icon: Receipt },
  { id: 'production', label: 'Sản lượng', icon: BarChart3 },
  { id: 'payments', label: 'Thanh toán', icon: CreditCard },
  { id: 'workflow', label: 'Phê duyệt', icon: CheckSquare },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'admin', label: 'Quản trị', icon: Settings },
];

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside className="w-60 bg-[#0B192C] text-slate-300 flex flex-col h-screen sticky top-0 select-none shrink-0 border-r border-slate-800">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-1.5 h-7 bg-[#2563EB] rounded-full" />
        <div>
          <div className="text-white font-bold text-base tracking-wider leading-none">
            ABC QTKD
          </div>
          <div className="text-slate-400 text-[11px] font-semibold tracking-widest mt-1">
            LOGISTICS &amp; CẢNG
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Nghiệp vụ chính
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Menu điều hướng">
        {SIDEBAR_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2563EB]/20 text-white border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Hỗ trợ nội bộ</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Công ty Cổ phần ABC • v1.0
        </p>
      </div>
    </aside>
  );
};
