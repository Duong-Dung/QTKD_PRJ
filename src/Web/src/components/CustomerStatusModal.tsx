import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, PauseCircle, X } from 'lucide-react';
import {
  CustomerDto,
  normalizeCustomerStatus,
  toCustomerStatusCode,
} from '../types/customer';
import { ApiError, customerService } from '../services/customerService';

interface CustomerStatusModalProps {
  customer: CustomerDto | null;
  onClose: () => void;
  onSuccess: (updated: CustomerDto) => void;
}

export const CustomerStatusModal: React.FC<CustomerStatusModalProps> = ({
  customer,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReason('');
    setReasonError(null);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [customer]);

  if (!customer) return null;

  const currentStatus = normalizeCustomerStatus(customer.status, customer.statusName);
  const isSuspending = currentStatus === 'Active';
  const targetStatus = isSuspending ? 'Suspended' : 'Active';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedReason = reason.trim();
    if (isSuspending && trimmedReason.length > 500) {
      setReasonError('Lý do tạm ngưng không được vượt quá 500 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setReasonError(null);
    setSubmitError(null);

    try {
      const updated = await customerService.updateCustomerStatus(customer.id, {
        status: toCustomerStatusCode(targetStatus),
        reason: isSuspending ? trimmedReason || null : null,
      });
      onSuccess(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        if (err.fieldErrors.suspendedReason) {
          setReasonError(err.fieldErrors.suspendedReason);
        }
      } else {
        setSubmitError('Không thể cập nhật trạng thái khách hàng. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isSuspending
                  ? 'bg-amber-50 text-[#D97706]'
                  : 'bg-emerald-50 text-[#16A34A]'
              }`}
            >
              {isSuspending ? (
                <PauseCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 id="status-modal-title" className="text-base font-semibold text-[#111827]">
                {isSuspending ? 'Tạm ngưng khách hàng' : 'Kích hoạt lại khách hàng'}
              </h2>
              <p className="text-xs text-[#4B5563]">
                <span className="font-mono font-semibold text-[#1E3A8A]">{customer.code}</span>
                {' — '}
                {customer.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-[#DC2626]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {isSuspending ? (
            <>
              <div className="rounded-lg bg-amber-50/80 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">
                Sau khi chuyển sang trạng thái <strong>Tạm ngưng</strong>, khách hàng này sẽ
                không thể được chọn để khởi tạo hợp đồng dịch vụ mới.
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="suspend-reason-input"
                    className="block text-xs font-semibold text-[#4B5563]"
                  >
                    Lý do tạm ngưng
                  </label>
                  <span className="text-[11px] text-[#9CA3AF]">{reason.length}/500</span>
                </div>
                <textarea
                  id="suspend-reason-input"
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setReasonError(null);
                  }}
                  disabled={isSubmitting}
                  maxLength={500}
                  placeholder="VD: Quá hạn thanh toán công nợ hoặc tạm ngừng hợp tác theo yêu cầu..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 ${
                    reasonError
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-100'
                      : 'border-[#E5E7EB] focus:border-[#2563EB] focus:ring-blue-100'
                  }`}
                />
                {reasonError && (
                  <p role="alert" className="text-xs font-medium text-[#DC2626]">
                    {reasonError}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Khách hàng sẽ được chuyển về trạng thái{' '}
                <strong className="text-[#16A34A]">Hoạt động</strong> và có thể tiếp tục sử
                dụng để lập hợp đồng mới.
              </p>
              {customer.suspendedReason && (
                <div className="rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] px-3.5 py-2.5 text-xs text-[#4B5563]">
                  <span className="font-semibold text-[#111827]">Lý do tạm ngưng trước đó:</span>{' '}
                  {customer.suspendedReason}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                isSuspending
                  ? 'bg-[#D97706] hover:bg-amber-700'
                  : 'bg-[#16A34A] hover:bg-emerald-700'
              }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Đang xử lý...'
                  : isSuspending
                    ? 'Xác nhận tạm ngưng'
                    : 'Xác nhận kích hoạt'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
