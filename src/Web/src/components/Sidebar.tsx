import React from 'react';
import {
  LayoutGrid,
  Users,
  FileText,
  FilePlus2,
  Receipt,
  BarChart3,
  CreditCard,
  CheckSquare,
  TrendingUp,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
    { id: 'customers', label: 'Khách hàng', icon: Users },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText },
    { id: 'addenda', label: 'Phụ lục hợp đồng', icon: FilePlus2 },
    { id: 'pricing', label: 'Bảng giá', icon: Receipt },
    { id: 'production', label: 'Sản lượng thực hiện', icon: BarChart3 },
    { id: 'payments', label: 'Bảng thanh toán', icon: CreditCard },
    { id: 'workflow', label: 'Quy trình phê duyệt', icon: CheckSquare },
    { id: 'reports', label: 'Báo cáo', icon: TrendingUp },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0B192C] text-slate-300 flex flex-col h-screen select-none shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 flex items-center space-x-3">
        <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
        <div>
          <div className="text-white font-extrabold text-lg tracking-wider">ABC</div>
          <div className="text-slate-400 text-xs font-semibold tracking-widest -mt-1">LOGISTICS</div>
        </div>
      </div>

      {/* Workspace Label */}
      <div className="px-6 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Không gian làm việc
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-white border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-3">
        <button className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Trung tâm hỗ trợ</span>
        </button>
        <div className="pt-2 text-[11px] text-slate-500 leading-tight">
          <p className="font-medium text-slate-400">ABC Logistics Workspace</p>
          <p>Phiên bản 1.0</p>
        </div>
      </div>
    </aside>
  );
};
