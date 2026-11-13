import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  FileText,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  Receipt,
  RefreshCw,
  User,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { CustomerDto, normalizeCustomerStatus } from '../types/customer';
import { ApiError, customerService } from '../services/customerService';
import { contractService } from '../services/contractService';
import type { Contract } from '../types/contract';
import { StatusBadge } from './StatusBadge';
import { useNavigate } from 'react-router-dom';

interface CustomerDetailProps {
  customer: CustomerDto;
  onBack: () => void;
  onEdit: (customer: CustomerDto) => void;
  onToggleStatus: (customer: CustomerDto) => void;
}

type DetailTab = 'overview' | 'contracts' | 'pricing' | 'payments' | 'history';

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Thông tin chung' },
  { id: 'contracts', label: 'Hợp đồng' },
  { id: 'pricing', label: 'Bảng giá' },
  { id: 'payments', label: 'Bảng thanh toán' },
  { id: 'history', label: 'Lịch sử' },
];

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatCurrency(val: number, cur = 'VND') {
  return new Intl.NumberFormat('vi-VN').format(val) + (cur === 'VND' ? ' đ' : ` ${cur}`);
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer: initialCustomer,
  onBack,
  onEdit,
  onToggleStatus,
}) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDto>(initialCustomer);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Contracts associated with this customer (Figma Section 3.3.3)
  const [customerContracts, setCustomerContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  useEffect(() => {
    const controller = new AbortController();
    setIsRefreshing(true);
    setRefreshError(null);

    customerService
      .getCustomerById(initialCustomer.id, controller.signal)
      .then((fresh) => {
        setCustomer(fresh);
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        if (err instanceof ApiError) {
          setRefreshError(err.message);
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [initialCustomer.id]);

  // Load contracts when switching to contracts tab or when customer changes
  useEffect(() => {
    if (activeTab === 'contracts') {
      setIsLoadingContracts(true);
      contractService
        .getContracts({ customerId: initialCustomer.id, pageSize: 50 })
        .then((res) => {
          if (res.items && res.items.length > 0) {
            setCustomerContracts(res.items);
          } else {
            // Also attempt search by customer code or name if customerId didn't match
            return contractService.getContracts({ searchTerm: initialCustomer.code, pageSize: 50 });
          }
        })
        .then((fallbackRes) => {
          if (fallbackRes?.items) {
            setCustomerContracts(fallbackRes.items);
          }
        })
        .catch((err) => {
          console.warn('Không thể nạp danh sách hợp đồng theo khách hàng:', err);
        })
        .finally(() => {
          setIsLoadingContracts(false);
        });
    }
  }, [activeTab, initialCustomer.id, initialCustomer.code]);

  const status = normalizeCustomerStatus(customer.status, customer.statusName);
  const isSuspended = status === 'Suspended';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại danh sách"
            className="mt-0.5 p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] leading-[30px] font-semibold text-[#111827]">
                <span className="font-mono text-[#1E3A8A]">{customer.code}</span>
                {' — '}
                {customer.name}
              </h1>
              <StatusBadge status={status} />
              {isRefreshing && (
                <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Đang đồng bộ
                </span>
              )}
            </div>
            <p className="text-sm text-[#4B5563] mt-0.5">
              Mã số thuế:{' '}
              <span className="font-mono font-medium text-[#111827]">{customer.taxCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(customer)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              isSuspended
                ? 'bg-[#16A34A] hover:bg-emerald-700'
                : 'bg-[#D97706] hover:bg-amber-700'
            }`}
          >
            {isSuspended ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kích hoạt lại</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Tạm ngưng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {refreshError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          Không thể làm mới dữ liệu mới nhất từ máy chủ: {refreshError}
        </div>
      )}

      {/* Suspended Notice */}
      {isSuspended && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="text-sm text-amber-950 space-y-1">
            <p className="font-semibold">Khách hàng đang ở trạng thái Tạm ngưng</p>
            <p className="text-xs text-amber-900">
              <span className="font-semibold">Lý do:</span>{' '}
              {customer.suspendedReason || 'Không có ghi chú lý do'}
              {customer.suspendedAt ? ` • Thời điểm: ${formatDateTime(customer.suspendedAt)}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="border-b border-[#E5E7EB] px-6 flex items-center gap-6 overflow-x-auto">
          {DETAIL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'contracts' && customerContracts.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#EFF6FF] text-[#2563EB] text-[11px] rounded-full font-bold">
                    {customerContracts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Tab: Thông tin chung */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Thông tin doanh nghiệp</span>
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-[#4B5563]">Mã khách hàng</dt>
                    <dd className="font-mono font-semibold text-[#111827] mt-0.5">
                      {customer.code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#4B5563]">Tên doanh nghiệp</dt>
                    <dd className="font-medium text-[#111827] mt-0.5">{customer.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#4B5563]">Mã số thuế</dt>
                    <dd className="font-mono font-medium text-[#111827] mt-0.5">
                      {customer.taxCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#4B5563] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Địa chỉ trụ sở</span>
                    </dt>
                    <dd className="text-[#111827] mt-0.5">{customer.address}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[#1E3A8A] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Đại diện &amp; Liên hệ</span>
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-[#4B5563]">Người đại diện pháp luật</dt>
                    <dd className="font-medium text-[#111827] mt-0.5">
                      {customer.representativeName}
                      {customer.representativeTitle ? ` (${customer.representativeTitle})` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#4B5563]">Người liên hệ</dt>
                    <dd className="text-[#111827] mt-0.5">{customer.contactPerson || '—'}</dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs font-medium text-[#4B5563] flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Điện thoại</span>
                      </dt>
                      <dd className="text-[#111827] mt-0.5">{customer.contactPhone || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-[#4B5563] flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </dt>
                      <dd className="text-[#111827] mt-0.5 break-all">
                        {customer.contactEmail || '—'}
                      </dd>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#4B5563]">
                    <div>
                      <span>Ngày tạo: </span>
                      <span className="font-medium text-[#111827]">
                        {formatDateTime(customer.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span>Cập nhật: </span>
                      <span className="font-medium text-[#111827]">
                        {formatDateTime(customer.updatedAt)}
                      </span>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Tab: Hợp đồng (Figma Section 3.3.3 & Yêu cầu 4.1) */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">
                    Hợp đồng đã ký kết &amp; đang xử lý
                  </h3>
                  <p className="text-xs text-[#4B5563]">
                    Theo dõi toàn bộ hồ sơ hợp đồng dịch vụ logistics liên kết với {customer.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/contracts')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo hợp đồng mới</span>
                </button>
              </div>

              {isLoadingContracts ? (
                <div className="py-8 text-center text-xs text-[#9CA3AF]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
                  <span>Đang tải danh sách hợp đồng...</span>
                </div>
              ) : customerContracts.length > 0 ? (
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#1E3A8A] text-white font-semibold">
                        <th className="py-2.5 px-3">Mã HĐ</th>
                        <th className="py-2.5 px-3">Tên hợp đồng</th>
                        <th className="py-2.5 px-3">Thời hạn hiệu lực</th>
                        <th className="py-2.5 px-3 text-right">Giá trị</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {customerContracts.map((c) => (
                        <tr key={c.id} className="hover:bg-[#EFF6FF] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#2563EB]">
                            {c.code}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#111827] max-w-[200px] truncate">
                            {c.title || 'Hợp đồng dịch vụ logistics'}
                          </td>
                          <td className="py-2.5 px-3 text-[#4B5563] whitespace-nowrap">
                            {formatDate(c.effectiveFrom)} – {formatDate(c.effectiveTo)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#111827] whitespace-nowrap">
                            {formatCurrency(c.contractValue, c.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => navigate('/contracts')}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                            >
                              <span>Chi tiết</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center space-y-2 border border-dashed border-[#E5E7EB] rounded-lg">
                  <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                  <p className="text-sm font-semibold text-[#111827]">
                    Chưa có hợp đồng nào với khách hàng này
                  </p>
                  <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
                    Bạn có thể khởi tạo hợp đồng dịch vụ logistics mới ngay bây giờ.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/contracts')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo hợp đồng ngay</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab: Bảng giá */}
          {activeTab === 'pricing' && (
            <div className="py-10 text-center space-y-2">
              <Receipt className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <p className="text-sm font-semibold text-[#111827]">Bảng giá áp dụng</p>
              <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                Phân hệ Bảng giá theo khách hàng sẽ được tích hợp ở Sprint tiếp theo.
              </p>
            </div>
          )}

          {/* Tab: Bảng thanh toán */}
          {activeTab === 'payments' && (
            <div className="py-10 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <p className="text-sm font-semibold text-[#111827]">Bảng thanh toán</p>
              <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                Phân hệ Bảng thanh toán và đối soát công nợ sẽ được tích hợp ở Sprint tiếp theo.
              </p>
            </div>
          )}

          {/* Tab: Lịch sử */}
          {activeTab === 'history' && (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F3F4F6]/70 border border-[#E5E7EB]">
                <Clock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#111827]">Khởi tạo hồ sơ khách hàng</p>
                  <p className="text-xs text-[#4B5563]">
                    Thời điểm: {formatDateTime(customer.createdAt)}
                  </p>
                </div>
              </div>
              {customer.updatedAt && (
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#F3F4F6]/70 border border-[#E5E7EB]">
                  <Clock className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#111827]">Cập nhật thông tin gần nhất</p>
                    <p className="text-xs text-[#4B5563]">
                      Thời điểm: {formatDateTime(customer.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
              {customer.suspendedAt && (
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <PauseCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-950">Tạm ngưng hoạt động</p>
                    <p className="text-xs text-amber-900">
                      Thời điểm: {formatDateTime(customer.suspendedAt)}
                      {customer.suspendedReason ? ` • Lý do: ${customer.suspendedReason}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
