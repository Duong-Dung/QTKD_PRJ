import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react';
import {
  CustomerDto,
  CustomerStatusName,
  PagedResult,
  normalizeCustomerStatus,
} from '../types/customer';
import { ApiError, customerService } from '../services/customerService';
import { CustomerForm } from './CustomerForm';
import { StatusBadge } from './StatusBadge';
import { ToastData } from './Toast';

interface CustomerWorkspaceProps {
  onBreadcrumbChange: (crumbs: string[]) => void;
  onNotify: (toast: ToastData) => void;
}

type WorkspaceView = 'list' | 'create' | 'edit';

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({
  onBreadcrumbChange,
  onNotify,
}) => {
  const [view, setView] = useState<WorkspaceView>('list');
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatusName | ''>('');
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

  const [pagedResult, setPagedResult] = useState<PagedResult<CustomerDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchCustomers = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await customerService.getCustomers(
          {
            searchTerm: appliedSearch,
            status: statusFilter,
            pageIndex,
            pageSize,
          },
          signal
        );
        setPagedResult(result);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const message =
          err instanceof ApiError
            ? err.message
            : 'Không thể tải danh sách khách hàng từ hệ thống.';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedSearch, statusFilter, pageIndex]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(controller.signal);
    return () => controller.abort();
  }, [fetchCustomers]);

  useEffect(() => {
    if (view === 'create') {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', 'Thêm khách hàng mới']);
    } else if (view === 'edit' && editingCustomer) {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', `Cập nhật ${editingCustomer.code}`]);
    } else {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', 'Danh sách khách hàng']);
    }
  }, [view, editingCustomer, onBreadcrumbChange]);

  const existingCodes = useMemo(
    () => (pagedResult?.items ?? []).map((item) => item.code),
    [pagedResult]
  );

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setView('create');
  };

  const handleOpenEdit = (customer: CustomerDto) => {
    setEditingCustomer(customer);
    setView('edit');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageIndex(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    setPageIndex(1);
  };

  const handleFormSuccess = (saved: CustomerDto, formMode: 'create' | 'edit') => {
    setView('list');
    setEditingCustomer(null);
    setPageIndex(1);
    void fetchCustomers();

    onNotify({
      type: 'success',
      title:
        formMode === 'create'
          ? 'Đã tạo hồ sơ khách hàng mới'
          : 'Đã cập nhật hồ sơ khách hàng',
      description: `${saved.code} — ${saved.name}`,
    });
  };

  if (view === 'create') {
    return (
      <CustomerForm
        mode="create"
        existingCodes={existingCodes}
        onCancel={() => setView('list')}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (view === 'edit' && editingCustomer) {
    return (
      <CustomerForm
        mode="edit"
        initialCustomer={editingCustomer}
        existingCodes={existingCodes}
        onCancel={() => {
          setView('list');
          setEditingCustomer(null);
        }}
        onSuccess={handleFormSuccess}
      />
    );
  }

  const items = pagedResult?.items ?? [];
  const totalCount = pagedResult?.totalCount ?? 0;
  const totalPages = pagedResult?.totalPages ?? 0;
  const startItem = totalCount === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const endItem = Math.min(pageIndex * pageSize, totalCount);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Page Title & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] leading-[30px] font-semibold text-[#111827]">
            Quản lý Khách hàng
          </h1>
          <p className="text-sm text-[#4B5563] mt-0.5">
            Tạo mới, cập nhật và quản lý hồ sơ khách hàng doanh nghiệp trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1E3A8A] text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo mã khách hàng, tên công ty hoặc mã số thuế..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CustomerStatusName | '');
              setPageIndex(1);
            }}
            className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Suspended">Tạm ngưng</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#2563EB] text-white text-sm font-medium transition-colors"
          >
            Tìm kiếm
          </button>

          {(appliedSearch || statusFilter) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </form>
      </div>

      {/* API Error State */}
      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 text-sm text-[#DC2626]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Không thể tải dữ liệu khách hàng</p>
              <p className="text-red-700 mt-0.5">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchCustomers()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-semibold text-[#DC2626] hover:bg-red-100/60 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 bg-[#F3F4F6] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-[#111827]">
              {appliedSearch || statusFilter
                ? 'Không tìm thấy khách hàng phù hợp'
                : 'Chưa có hồ sơ khách hàng nào'}
            </h2>
            <p className="text-sm text-[#4B5563] max-w-md mx-auto">
              {appliedSearch || statusFilter
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc trạng thái.'
                : 'Bắt đầu bằng cách thêm khách hàng doanh nghiệp đầu tiên vào hệ thống.'}
            </p>
            <div className="pt-2">
              {appliedSearch || statusFilter ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#111827] hover:bg-[#F3F4F6]"
                >
                  Đặt lại bộ lọc
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1E3A8A] text-white text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm khách hàng đầu tiên</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E7EB] text-xs font-semibold text-[#1E3A8A] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã KH</th>
                    <th className="py-3.5 px-4">Tên khách hàng</th>
                    <th className="py-3.5 px-4">Mã số thuế</th>
                    <th className="py-3.5 px-4">Người đại diện</th>
                    <th className="py-3.5 px-4">Liên hệ</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-sm">
                  {items.map((customer) => {
                    const status = normalizeCustomerStatus(
                      customer.status,
                      customer.statusName
                    );
                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-[#EFF6FF] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#1E3A8A] whitespace-nowrap">
                          {customer.code}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-[#111827] truncate">
                            {customer.name}
                          </div>
                          <div className="text-xs text-[#4B5563] truncate">
                            {customer.address}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#111827] whitespace-nowrap">
                          {customer.taxCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#111827]">
                            {customer.representativeName}
                          </div>
                          {customer.representativeTitle && (
                            <div className="text-xs text-[#4B5563]">
                              {customer.representativeTitle}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#4B5563]">
                          <div>{customer.contactPerson || '—'}</div>
                          <div>
                            {[customer.contactPhone, customer.contactEmail]
                              .filter(Boolean)
                              .join(' • ') || 'Chưa cập nhật'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(customer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1E3A8A] hover:bg-[#DBEAFE] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-t border-[#E5E7EB] bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5563]">
              <div>
                Hiển thị <span className="font-semibold text-[#111827]">{startItem}–{endItem}</span> trên{' '}
                <span className="font-semibold text-[#111827]">{totalCount}</span> khách hàng
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={!pagedResult?.hasPreviousPage}
                  aria-label="Trang trước"
                  className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-[#111827]">
                  Trang {pageIndex} / {Math.max(1, totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => p + 1)}
                  disabled={!pagedResult?.hasNextPage}
                  aria-label="Trang sau"
                  className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
