import React, { useState, useMemo } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Contract, ContractStatus } from '../types/contract';

interface ContractListProps {
  contracts: Contract[];
  onOpenCreate: () => void;
  onOpenDetail: (contract: Contract) => void;
  toastMessage?: { title: string; desc: string } | null;
  onCloseToast?: () => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  onOpenCreate,
  onOpenDetail,
  toastMessage,
  onCloseToast,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'Draft' | 'PendingApproval' | 'Approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Thống kê số lượng
  const stats = useMemo(() => {
    const total = contracts.length;
    const draft = contracts.filter((c) => c.status === 'Draft').length;
    const pending = contracts.filter((c) => c.status === 'PendingApproval').length;
    const approved = contracts.filter((c) => c.status === 'Approved').length;
    return { total, draft, pending, approved };
  }, [contracts]);

  // Bộ lọc dữ liệu
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Lọc theo Tab
      if (activeTab !== 'all' && contract.status !== activeTab) {
        return false;
      }
      // Lọc theo Dropdown Trạng thái
      if (statusFilter !== 'all' && contract.status !== statusFilter) {
        return false;
      }
      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = contract.code.toLowerCase().includes(q);
        const matchTitle = contract.title.toLowerCase().includes(q);
        const matchCustomer = contract.customerName.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchCustomer) return false;
      }
      return true;
    });
  }, [contracts, activeTab, statusFilter, searchQuery]);

  // Phân trang
  const totalPages = Math.ceil(filteredContracts.length / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const renderStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            Bản nháp
          </span>
        );
      case 'PendingApproval':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            Chờ duyệt
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Đã phê duyệt
          </span>
        );
      case 'RevisionRequested':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            Yêu cầu chỉnh sửa
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto relative">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
            Quản lý hợp đồng
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Hợp đồng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tập trung hồ sơ, theo dõi trạng thái và tiến trình phê duyệt.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo hợp đồng</span>
        </button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Tổng hợp đồng */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Tổng hợp đồng</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.total.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400 mt-2">Tất cả hồ sơ trong hệ thống</div>
        </div>

        {/* Card 2: Bản nháp */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400" />
          <div className="text-xs font-medium text-slate-500">Bản nháp</div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">
            {stats.draft.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400 mt-2">Đang hoàn thiện thông tin</div>
        </div>

        {/* Card 3: Chờ duyệt */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
          <div className="text-xs font-medium text-slate-500">Chờ duyệt</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {stats.pending.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400 mt-2">Đã gửi quy trình phê duyệt</div>
        </div>

        {/* Card 4: Đã phê duyệt */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
          <div className="text-xs font-medium text-slate-500">Đã phê duyệt</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.approved.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-400 mt-2">Hồ sơ đã được xác nhận</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
        {/* Tabs Bar */}
        <div className="border-b border-slate-200 px-6 flex items-center space-x-8">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả hợp đồng
          </button>
          <button
            onClick={() => {
              setActiveTab('Draft');
              setCurrentPage(1);
            }}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'Draft'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bản nháp
          </button>
          <button
            onClick={() => {
              setActiveTab('PendingApproval');
              setCurrentPage(1);
            }}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'PendingApproval'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => {
              setActiveTab('Approved');
              setCurrentPage(1);
            }}
            className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'Approved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đã phê duyệt
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex flex-1 items-center space-x-3 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã hợp đồng, tên hợp đồng hoặc khách hàng"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Draft">Bản nháp</option>
              <option value="PendingApproval">Chờ duyệt</option>
              <option value="Approved">Đã phê duyệt</option>
              <option value="RevisionRequested">Yêu cầu chỉnh sửa</option>
            </select>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Hiển thị {paginatedContracts.length} / {filteredContracts.length} hợp đồng
          </div>
        </div>

        {/* Contracts Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Mã hợp đồng</th>
                <th className="py-3.5 px-6">Tên hợp đồng / Khách hàng</th>
                <th className="py-3.5 px-6">Thời gian hiệu lực</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6">Người phụ trách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Không tìm thấy hợp đồng nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => onOpenDetail(contract)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-4 px-6 font-semibold text-blue-600 group-hover:underline">
                      {contract.code}
                    </td>

                    {/* Title & Customer */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{contract.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{contract.customerName}</div>
                    </td>

                    {/* Effective range */}
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {formatDate(contract.effectiveFrom)} – {formatDate(contract.effectiveTo)}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">{renderStatusBadge(contract.status)}</td>

                    {/* Owner */}
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {contract.ownerName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị {paginatedContracts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredContracts.length)} trên {filteredContracts.length} hợp đồng
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-50 border border-blue-500 text-blue-600 font-bold'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Note under table */}
      <div className="mt-4 text-xs text-slate-400">
        Chỉ hồ sơ Bản nháp và Yêu cầu chỉnh sửa được phép chỉnh sửa.
      </div>

      {/* Bottom Footer Info */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
        <div>ABC Logistics - Quản lý kinh doanh</div>
      </div>

      {/* Toast Notification Banner (Bottom Right) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xl flex items-start space-x-3 z-50 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-bold text-emerald-900">{toastMessage.title}</h4>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              {toastMessage.desc}
            </p>
          </div>
          {onCloseToast && (
            <button
              onClick={onCloseToast}
              className="text-emerald-500 hover:text-emerald-800 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};
