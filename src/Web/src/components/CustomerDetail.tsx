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
} from 'lucide-react';
import { CustomerDto, normalizeCustomerStatus } from '../types/customer';
import { ApiError, customerService } from '../services/customerService';
import { StatusBadge } from './StatusBadge';

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

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer: initialCustomer,
  onBack,
  onEdit,
  onToggleStatus,
}) => {
  const [customer, setCustomer] = useState<CustomerDto>(initialCustomer);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

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
                className={`py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
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

          {activeTab === 'contracts' && (
            <div className="py-10 text-center space-y-2">
              <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <p className="text-sm font-semibold text-[#111827]">
                Danh sách hợp đồng theo khách hàng
              </p>
              <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                Dữ liệu hợp đồng của khách hàng sẽ hiển thị tự động sau khi API tìm kiếm hợp
                đồng (TASK-31) được tích hợp vào nhánh develop.
              </p>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="py-10 text-center space-y-2">
              <Receipt className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <p className="text-sm font-semibold text-[#111827]">Bảng giá áp dụng</p>
              <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                Phân hệ Bảng giá theo khách hàng sẽ được tích hợp ở Sprint tiếp theo.
              </p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="py-10 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <p className="text-sm font-semibold text-[#111827]">Bảng thanh toán</p>
              <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                Phân hệ Bảng thanh toán và đối soát công nợ sẽ được tích hợp ở Sprint tiếp theo.
              </p>
            </div>
          )}

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
