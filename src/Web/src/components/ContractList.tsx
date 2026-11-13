import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  FileEdit,
  Send,
  Trash2,
  FilePlus2,
  RotateCw,
  Ban,
  Building2,
  Calendar,
  DollarSign,
  Filter,
} from 'lucide-react';
import type { Contract, ContractStatus } from '../types/contract';
import { StatusBadge } from './StatusBadge';

interface ContractListProps {
  contracts: Contract[];
  onOpenCreate: () => void;
  onOpenDetail: (contract: Contract) => void;
  onOpenEdit?: (contract: Contract) => void;
  toastMessage?: { title: string; desc: string } | null;
  onCloseToast?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
  toastMessage,
  onCloseToast,
  isLoading,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'Draft' | 'PendingApproval' | 'Approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Row Action Menu State
  const [activeMenuContractId, setActiveMenuContractId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuContractId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Thống kê số lượng theo Figma Section 3.4.1
  const stats = useMemo(() => {
    const total = contracts.length;
    const draft = contracts.filter((c) => c.status === 'Draft').length;
    const pending = contracts.filter(
      (c) => c.status === 'PendingApproval' || c.status === 'Submitted' || c.status === 'UnderReview'
    ).length;
    const approved = contracts.filter(
      (c) => c.status === 'Approved' || c.status === 'Active'
    ).length;
    return { total, draft, pending, approved };
  }, [contracts]);

  // Bộ lọc dữ liệu
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Lọc theo Tab
      if (activeTab === 'Draft' && contract.status !== 'Draft') return false;
      if (
        activeTab === 'PendingApproval' &&
        contract.status !== 'PendingApproval' &&
        contract.status !== 'Submitted' &&
        contract.status !== 'UnderReview'
      )
        return false;
      if (
        activeTab === 'Approved' &&
        contract.status !== 'Approved' &&
        contract.status !== 'Active'
      )
        return false;

      // Lọc theo Dropdown Trạng thái
      if (statusFilter !== 'all' && contract.status !== statusFilter) {
        return false;
      }

      // Lọc theo Loại hợp đồng
      if (typeFilter !== 'all' && contract.contractType && contract.contractType !== typeFilter) {
        return false;
      }

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = contract.code?.toLowerCase().includes(q);
        const matchTitle = contract.title?.toLowerCase().includes(q);
        const matchCustomer = contract.customerName?.toLowerCase().includes(q);
        const matchTax = contract.customerTaxCode?.includes(q);
        if (!matchCode && !matchTitle && !matchCustomer && !matchTax) return false;
      }
      return true;
    });
  }, [contracts, activeTab, statusFilter, typeFilter, searchQuery]);

  // Phân trang
  const totalPages = Math.ceil(filteredContracts.length / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (val: number, cur = 'VND') => {
    return new Intl.NumberFormat('vi-VN').format(val) + (cur === 'VND' ? ' đ' : ` ${cur}`);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Page Header (Figma Section 3.4.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] mt-1">Quản lý hợp đồng</h1>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#4B5563] bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg shadow-sm transition-all"
              title="Làm mới dữ liệu từ Database"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Đang đồng bộ...' : 'Làm mới'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo hợp đồng</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards (Figma Section 3.4.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng hợp đồng */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm hover:border-[#DBEAFE] transition-colors">
          <div className="text-xs font-medium text-[#4B5563]">Tổng hợp đồng</div>
          <div className="text-2xl font-bold text-[#1E3A8A] mt-1.5">
            {stats.total.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-1">Tất cả hồ sơ trong hệ thống</div>
        </div>

        {/* Card 2: Bản nháp */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#9CA3AF]" />
          <div className="text-xs font-medium text-[#4B5563]">Bản nháp</div>
          <div className="text-2xl font-bold text-[#4B5563] mt-1.5">
            {stats.draft.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-1">Đang hoàn thiện thông tin</div>
        </div>

        {/* Card 3: Chờ duyệt */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D97706]" />
          <div className="text-xs font-medium text-[#4B5563]">Chờ phê duyệt</div>
          <div className="text-2xl font-bold text-[#D97706] mt-1.5">
            {stats.pending.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-1">Đã chuyển sang các cấp rà soát</div>
        </div>

        {/* Card 4: Đã phê duyệt / Có hiệu lực */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#16A34A]" />
          <div className="text-xs font-medium text-[#4B5563]">Đã duyệt / Hiệu lực</div>
          <div className="text-2xl font-bold text-[#16A34A] mt-1.5">
            {stats.approved.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-[#9CA3AF] mt-1">Hồ sơ đã được ký duyệt chính thức</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Tabs Bar */}
        <div className="border-b border-[#E5E7EB] px-6 flex items-center gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Tất cả hợp đồng ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('Draft');
              setCurrentPage(1);
            }}
            className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'Draft'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Bản nháp ({stats.draft})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('PendingApproval');
              setCurrentPage(1);
            }}
            className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'PendingApproval'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Chờ duyệt ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('Approved');
              setCurrentPage(1);
            }}
            className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'Approved'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Đã phê duyệt ({stats.approved})
          </button>
        </div>

        {/* Filter and Search Bar (Figma Section 2.5: Search + Filter chip + Reset) */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex flex-1 items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã hợp đồng, tên hợp đồng hoặc khách hàng..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>

            {/* Trạng thái Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-medium text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Draft">Bản nháp</option>
              <option value="Submitted">Đã gửi (Trình duyệt)</option>
              <option value="UnderReview">Đang rà soát</option>
              <option value="RevisionRequested">Yêu cầu chỉnh sửa</option>
              <option value="Approved">Đã phê duyệt</option>
              <option value="Active">Có hiệu lực</option>
              <option value="Rejected">Từ chối</option>
            </select>

            {/* Loại hợp đồng Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="hidden sm:block px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-medium text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            >
              <option value="all">Tất cả loại dịch vụ</option>
              <option value="Dịch vụ cảng">Dịch vụ cảng</option>
              <option value="Vận chuyển hàng hóa">Vận chuyển hàng hóa</option>
              <option value="Kho bãi & lưu kho">Kho bãi & lưu kho</option>
              <option value="Dịch vụ logistics tích hợp">Logistics tích hợp</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-[#2563EB] hover:underline self-end md:self-auto"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Data Table (Figma Section 3.4.1 Contract/List) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E3A8A] text-white text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 font-semibold">Mã HĐ</th>
                <th className="py-3 px-4 font-semibold">Tên hợp đồng / Loại</th>
                <th className="py-3 px-4 font-semibold">Khách hàng</th>
                <th className="py-3 px-4 font-semibold">Hiệu lực</th>
                <th className="py-3 px-4 font-semibold text-right">Giá trị</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold">Đang xử lý</th>
                <th className="py-3 px-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs">
              {paginatedContracts.length > 0 ? (
                paginatedContracts.map((contract) => {
                  const assignee =
                    contract.currentAssignee ||
                    (contract.status === 'UnderReview'
                      ? 'Pháp chế – Lê C'
                      : contract.status === 'PendingApproval'
                      ? 'Ban Giám đốc'
                      : contract.status === 'Draft'
                      ? '—'
                      : contract.ownerName || '—');

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-[#EFF6FF] transition-colors group cursor-pointer"
                      onClick={() => onOpenDetail(contract)}
                    >
                      {/* Mã HĐ */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#2563EB] whitespace-nowrap">
                        <span className="hover:underline">{contract.code}</span>
                      </td>

                      {/* Tên hợp đồng / Loại */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="font-semibold text-[#111827] truncate group-hover:text-[#2563EB] transition-colors">
                          {contract.title || 'Hợp đồng dịch vụ logistics'}
                        </p>
                        <span className="text-[11px] text-[#4B5563]">
                          {contract.contractType || 'Dịch vụ cảng & logistics'}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-medium text-[#111827] truncate">
                          {contract.customerName}
                        </p>
                        {contract.customerTaxCode && (
                          <p className="font-mono text-[10px] text-[#4B5563]">
                            MST: {contract.customerTaxCode}
                          </p>
                        )}
                      </td>

                      {/* Thời gian hiệu lực */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#4B5563]">
                        {formatDate(contract.effectiveFrom)} – {formatDate(contract.effectiveTo)}
                      </td>

                      {/* Giá trị hợp đồng */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-right text-[#111827]">
                        {formatCurrency(contract.contractValue, contract.currency)}
                      </td>

                      {/* Trạng thái (Universal StatusBadge) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={contract.status} />
                      </td>

                      {/* Đang xử lý (Figma Section 3.4.1) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#4B5563]">
                        {assignee !== '—' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1E3A8A] border border-[#DBEAFE]">
                            {assignee}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>

                      {/* Thao tác (Row actions) */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuContractId(
                                activeMenuContractId === contract.id ? null : contract.id
                              )
                            }
                            className="p-1 rounded-md text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB]/50 transition-colors"
                            aria-label="Tùy chọn thao tác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuContractId === contract.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-30 text-xs animate-fadeIn text-left"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuContractId(null);
                                  onOpenDetail(contract);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[#111827] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem chi tiết</span>
                              </button>

                              {(contract.status === 'Draft' ||
                                contract.status === 'RevisionRequested') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuContractId(null);
                                    if (onOpenEdit) {
                                      onOpenEdit(contract);
                                    } else {
                                      onOpenDetail(contract);
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[#111827] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Chỉnh sửa hồ sơ</span>
                                </button>
                              )}

                              {(contract.status === 'Approved' || contract.status === 'Active') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuContractId(null);
                                    onOpenDetail(contract);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[#111827] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                                >
                                  <FilePlus2 className="w-3.5 h-3.5" />
                                  <span>Tạo phụ lục</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm font-semibold text-[#111827]">
                        Không tìm thấy hợp đồng phù hợp
                      </p>
                      <p className="text-xs text-[#4B5563] max-w-sm">
                        Thử điều chỉnh lại từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563] bg-white">
          <span>
            Hiển thị{' '}
            <strong className="text-[#111827]">
              {filteredContracts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredContracts.length)}
            </strong>{' '}
            trên <strong className="text-[#111827]">{filteredContracts.length}</strong> hợp đồng
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed text-[#4B5563]"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-[28px] h-7 rounded text-xs font-semibold border transition-colors ${
                  currentPage === page
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed text-[#4B5563]"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
