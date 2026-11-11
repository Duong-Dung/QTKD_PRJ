import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreVertical,
  PauseCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  CustomerDto,
  CustomerStatusName,
  PagedResult,
  normalizeCustomerStatus,
} from '../types/customer';
import { ApiError, customerService } from '../services/customerService';
import { CustomerDetail } from './CustomerDetail';
import { CustomerForm } from './CustomerForm';
import { CustomerStatusModal } from './CustomerStatusModal';
import { StatusBadge } from './StatusBadge';
import { ToastData } from './Toast';

interface CustomerWorkspaceProps {
  onBreadcrumbChange: (crumbs: string[]) => void;
  onNotify: (toast: ToastData) => void;
}

type WorkspaceView = 'list' | 'create' | 'edit' | 'detail';

interface MenuState {
  customer: CustomerDto;
  top: number;
  right: number;
}

function getVisiblePages(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: 5 }, (_, idx) => start + idx);
}

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({
  onBreadcrumbChange,
  onNotify,
}) => {
  const [view, setView] = useState<WorkspaceView>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);
  const [statusModalCustomer, setStatusModalCustomer] = useState<CustomerDto | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatusName | ''>('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    [appliedSearch, statusFilter, pageIndex, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(controller.signal);
    return () => controller.abort();
  }, [fetchCustomers]);

  // Debounced live search when typing
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === appliedSearch) return;
    const timer = window.setTimeout(() => {
      setPageIndex(1);
      setAppliedSearch(trimmed);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, appliedSearch]);

  // Close row action menu on outside click, Escape, or scroll
  useEffect(() => {
    if (!openMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    const handleScroll = () => setOpenMenu(null);

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenu]);

  useEffect(() => {
    if (view === 'create') {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', 'Thêm khách hàng mới']);
    } else if (view === 'edit' && selectedCustomer) {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', `Cập nhật ${selectedCustomer.code}`]);
    } else if (view === 'detail' && selectedCustomer) {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', `${selectedCustomer.code} — ${selectedCustomer.name}`]);
    } else {
      onBreadcrumbChange(['Trang chủ', 'Khách hàng', 'Danh sách khách hàng']);
    }
  }, [view, selectedCustomer, onBreadcrumbChange]);

  const existingCodes = useMemo(
    () => (pagedResult?.items ?? []).map((item) => item.code),
    [pagedResult]
  );

  const handleOpenCreate = () => {
    setOpenMenu(null);
    setSelectedCustomer(null);
    setView('create');
  };

  const handleOpenEdit = (customer: CustomerDto) => {
    setOpenMenu(null);
    setSelectedCustomer(customer);
    setView('edit');
  };

  const handleOpenDetail = (customer: CustomerDto) => {
    setOpenMenu(null);
    setSelectedCustomer(customer);
    setView('detail');
  };

  const handleOpenStatusModal = (customer: CustomerDto) => {
    setOpenMenu(null);
    setStatusModalCustomer(customer);
  };

  const handleToggleRowMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    customer: CustomerDto
  ) => {
    if (openMenu?.customer.id === customer.id) {
      setOpenMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedMenuHeight = 148;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < estimatedMenuHeight
        ? Math.max(8, rect.top - estimatedMenuHeight - 4)
        : rect.bottom + 4;
    const right = Math.max(8, window.innerWidth - rect.right);

    setOpenMenu({ customer, top, right });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageIndex(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPageIndex(1);
    setAppliedSearch('');
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    setPageIndex(1);
  };

  const handleFormSuccess = (saved: CustomerDto, formMode: 'create' | 'edit') => {
    setView('list');
    setSelectedCustomer(null);
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

  const handleStatusModalSuccess = (updated: CustomerDto) => {
    const newStatus = normalizeCustomerStatus(updated.status, updated.statusName);
    setStatusModalCustomer(null);

    if (selectedCustomer?.id === updated.id) {
      setSelectedCustomer(updated);
    }

    void fetchCustomers();

    onNotify({
      type: 'success',
      title:
        newStatus === 'Suspended'
          ? 'Đã tạm ngưng khách hàng'
          : 'Đã kích hoạt lại khách hàng',
      description: `${updated.code} — ${updated.name}`,
    });
  };

  const renderFormOrDetail = () => {
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

    if (view === 'edit' && selectedCustomer) {
      return (
        <CustomerForm
          mode="edit"
          initialCustomer={selectedCustomer}
          existingCodes={existingCodes}
          onCancel={() => {
            setView('list');
            setSelectedCustomer(null);
          }}
          onSuccess={handleFormSuccess}
        />
      );
    }

    if (view === 'detail' && selectedCustomer) {
      return (
        <CustomerDetail
          customer={selectedCustomer}
          onBack={() => {
            setView('list');
            setSelectedCustomer(null);
          }}
          onEdit={handleOpenEdit}
          onToggleStatus={handleOpenStatusModal}
        />
      );
    }

    return null;
  };

  const subView = renderFormOrDetail();
  if (subView) {
    return (
      <>
        {subView}
        <CustomerStatusModal
          customer={statusModalCustomer}
          onClose={() => setStatusModalCustomer(null)}
          onSuccess={handleStatusModalSuccess}
        />
      </>
    );
  }

  const items = pagedResult?.items ?? [];
  const totalCount = pagedResult?.totalCount ?? 0;
  const totalPages = pagedResult?.totalPages ?? 0;
  const startItem = totalCount === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const endItem = Math.min(pageIndex * pageSize, totalCount);
  const visiblePages = getVisiblePages(pageIndex, totalPages);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Page Title & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] leading-[30px] font-semibold text-[#111827]">
            Khách hàng
          </h1>
          <p className="text-sm text-[#4B5563] mt-0.5">
            Tra cứu, cập nhật hồ sơ và quản lý trạng thái hợp tác của khách hàng doanh nghiệp.
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
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 space-y-3">
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
              placeholder="Tìm mã khách hàng, tên công ty hoặc mã số thuế..."
              aria-label="Tìm kiếm khách hàng"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
          <div className="p-6 space-y-3" aria-label="Đang tải dữ liệu">
            {[1, 2, 3, 4, 5].map((row) => (
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
                : 'Chưa có khách hàng. Thêm khách hàng đầu tiên'}
            </h2>
            <p className="text-sm text-[#4B5563] max-w-md mx-auto">
              {appliedSearch || statusFilter
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc trạng thái.'
                : 'Bắt đầu bằng cách tạo hồ sơ khách hàng doanh nghiệp đầu tiên.'}
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
                    <th className="py-3.5 px-4">MST</th>
                    <th className="py-3.5 px-4">Người đại diện</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right w-20">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-sm">
                  {items.map((customer) => {
                    const status = normalizeCustomerStatus(
                      customer.status,
                      customer.statusName
                    );
                    const isMenuOpen = openMenu?.customer.id === customer.id;

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-[#EFF6FF] transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(customer)}
                            className="font-mono font-semibold text-[#2563EB] hover:text-[#1E3A8A] hover:underline"
                          >
                            {customer.code}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(customer)}
                            className="text-left group block max-w-full"
                          >
                            <div className="font-semibold text-[#111827] group-hover:text-[#2563EB] truncate">
                              {customer.name}
                            </div>
                            <div className="text-xs text-[#4B5563] truncate">
                              {customer.address}
                            </div>
                          </button>
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <StatusBadge status={status} />
                            {status === 'Suspended' && customer.suspendedReason && (
                              <div
                                className="text-[11px] text-[#4B5563] max-w-[180px] truncate"
                                title={customer.suspendedReason}
                              >
                                {customer.suspendedReason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleToggleRowMenu(e, customer)}
                            aria-label={`Thao tác cho ${customer.code}`}
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                            className="p-1.5 rounded-lg border border-transparent hover:border-[#E5E7EB] hover:bg-white text-[#4B5563] hover:text-[#111827] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
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
              <div className="flex items-center gap-4">
                <span>
                  Hiển thị{' '}
                  <span className="font-semibold text-[#111827]">
                    {startItem}–{endItem}
                  </span>{' '}
                  / <span className="font-semibold text-[#111827]">{totalCount}</span> khách hàng
                </span>

                <label className="inline-flex items-center gap-1.5">
                  <span>Hiển thị:</span>
                  <select
                    aria-label="Số dòng mỗi trang"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageIndex(1);
                    }}
                    className="rounded border border-[#E5E7EB] bg-white px-2 py-1 text-xs text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  disabled={!pagedResult?.hasPreviousPage}
                  aria-label="Trang trước"
                  className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {visiblePages.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPageIndex(pageNum)}
                    aria-current={pageNum === pageIndex ? 'page' : undefined}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-colors ${
                      pageNum === pageIndex
                        ? 'bg-[#2563EB] text-white'
                        : 'border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

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

      {/* Fixed-position Row Action Menu (prevents overflow-x clipping on small row counts) */}
      {openMenu && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: openMenu.top, right: openMenu.right }}
          className="fixed z-40 w-48 rounded-xl bg-white shadow-lg border border-[#E5E7EB] py-1.5 text-sm"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleOpenDetail(openMenu.customer)}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[#111827] hover:bg-[#EFF6FF] transition-colors"
          >
            <Eye className="w-4 h-4 text-[#4B5563]" />
            <span>Xem chi tiết</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleOpenEdit(openMenu.customer)}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[#111827] hover:bg-[#EFF6FF] transition-colors"
          >
            <Edit3 className="w-4 h-4 text-[#4B5563]" />
            <span>Chỉnh sửa</span>
          </button>

          <div className="my-1 border-t border-[#E5E7EB]" />

          {normalizeCustomerStatus(openMenu.customer.status, openMenu.customer.statusName) ===
          'Active' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleOpenStatusModal(openMenu.customer)}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[#D97706] hover:bg-amber-50 font-medium transition-colors"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Tạm ngưng</span>
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleOpenStatusModal(openMenu.customer)}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-[#16A34A] hover:bg-emerald-50 font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kích hoạt lại</span>
            </button>
          )}
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      <CustomerStatusModal
        customer={statusModalCustomer}
        onClose={() => setStatusModalCustomer(null)}
        onSuccess={handleStatusModalSuccess}
      />
    </div>
  );
};
