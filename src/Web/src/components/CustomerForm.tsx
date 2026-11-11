import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  CustomerDto,
  CustomerFieldErrors,
  CustomerFieldName,
  CustomerFormValues,
  CustomerStatusName,
  toCustomerStatusCode,
} from '../types/customer';
import { ApiError, customerService } from '../services/customerService';
import {
  CUSTOMER_CODE_REGEX,
  TAX_CODE_REGEX,
  createEmptyCustomerFormValues,
  customerDtoToFormValues,
  suggestNextCustomerCode,
  validateCustomerForm,
} from '../utils/customerValidation';
import { StatusBadge } from './StatusBadge';

interface CustomerFormProps {
  mode: 'create' | 'edit';
  initialCustomer?: CustomerDto | null;
  existingCodes?: string[];
  onCancel: () => void;
  onSuccess: (customer: CustomerDto, mode: 'create' | 'edit') => void;
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  rightAction,
  children,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#4B5563]">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {rightAction}
    </div>
    {children}
    {error ? (
      <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-[#DC2626]">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${htmlFor}-hint`} className="text-xs text-[#9CA3AF]">
          {hint}
        </p>
      )
    )}
  </div>
);

function getInputClassName(hasError: boolean, disabled = false, extra = ''): string {
  const base =
    'w-full rounded-lg border px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-colors focus:outline-none focus:ring-2';
  const stateClass = disabled
    ? 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] cursor-not-allowed'
    : hasError
      ? 'bg-white border-[#DC2626] focus:border-[#DC2626] focus:ring-red-100'
      : 'bg-white border-[#E5E7EB] focus:border-[#2563EB] focus:ring-blue-100';

  return `${base} ${stateClass} ${extra}`.trim();
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  mode,
  initialCustomer = null,
  existingCodes = [],
  onCancel,
  onSuccess,
}) => {
  const initialSnapshot = useMemo<CustomerFormValues>(() => {
    if (mode === 'edit' && initialCustomer) {
      return customerDtoToFormValues(initialCustomer);
    }
    return createEmptyCustomerFormValues();
  }, [mode, initialCustomer]);

  const [values, setValues] = useState<CustomerFormValues>(initialSnapshot);
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<CustomerFieldName, boolean>>>(
    {}
  );
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    setValues(initialSnapshot);
    setFieldErrors({});
    setTouchedFields({});
    setGeneralError(null);
    setShowDiscardConfirm(false);
  }, [initialSnapshot]);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialSnapshot),
    [values, initialSnapshot]
  );

  const checklist = useMemo(() => {
    const codeValid = mode === 'edit' || CUSTOMER_CODE_REGEX.test(values.code.trim());
    const nameValid = values.name.trim().length > 0 && values.name.trim().length <= 200;
    const taxCodeValid = TAX_CODE_REGEX.test(values.taxCode.trim());
    const addressValid = values.address.trim().length > 0 && values.address.trim().length <= 500;
    const repValid =
      values.representativeName.trim().length > 0 && values.representativeName.trim().length <= 150;

    return [
      { label: 'Mã khách hàng hợp lệ (3–20 ký tự)', ok: codeValid },
      { label: 'Tên doanh nghiệp đầy đủ', ok: nameValid },
      { label: 'Mã số thuế chuẩn 10 hoặc 13 số', ok: taxCodeValid },
      { label: 'Địa chỉ trụ sở chính', ok: addressValid },
      { label: 'Người đại diện pháp luật', ok: repValid },
    ];
  }, [values, mode]);

  const handleFieldChange = (field: CustomerFieldName, nextValue: string) => {
    const nextValues = { ...values, [field]: nextValue };
    setValues(nextValues);
    setGeneralError(null);

    if (touchedFields[field] || fieldErrors[field]) {
      const nextErrors = validateCustomerForm(nextValues, mode);
      setFieldErrors((prev) => ({
        ...prev,
        [field]: nextErrors[field],
      }));
    }
  };

  const handleFieldBlur = (field: CustomerFieldName) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const nextErrors = validateCustomerForm(values, mode);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: nextErrors[field],
    }));
  };

  const handleStatusSelect = (status: CustomerStatusName) => {
    setValues((prev) => ({
      ...prev,
      status,
      suspendedReason: status === 'Active' ? '' : prev.suspendedReason,
    }));
    setFieldErrors((prev) => ({ ...prev, suspendedReason: undefined }));
    setGeneralError(null);
  };

  const handleSuggestCode = () => {
    if (mode !== 'create' || isSubmitting) return;
    const suggested = suggestNextCustomerCode(existingCodes);
    handleFieldChange('code', suggested);
  };

  const handleReset = () => {
    if (isSubmitting) return;
    setValues(initialSnapshot);
    setFieldErrors({});
    setTouchedFields({});
    setGeneralError(null);
  };

  const handleRequestCancel = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateCustomerForm(values, mode);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setTouchedFields({
        code: true,
        name: true,
        taxCode: true,
        address: true,
        representativeName: true,
        representativeTitle: true,
        contactPerson: true,
        contactPhone: true,
        contactEmail: true,
        suspendedReason: true,
      });
      setGeneralError('Vui lòng kiểm tra và hoàn thiện các trường thông tin còn thiếu hoặc chưa hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const optionalValue = (val: string): string | null => {
        const trimmed = val.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      if (mode === 'create') {
        const created = await customerService.createCustomer({
          code: values.code.trim(),
          name: values.name.trim(),
          taxCode: values.taxCode.trim(),
          address: values.address.trim(),
          representativeName: values.representativeName.trim(),
          representativeTitle: optionalValue(values.representativeTitle),
          contactPerson: optionalValue(values.contactPerson),
          contactPhone: optionalValue(values.contactPhone),
          contactEmail: optionalValue(values.contactEmail),
        });
        onSuccess(created, 'create');
        return;
      }

      if (!initialCustomer) {
        setGeneralError('Không tìm thấy thông tin khách hàng cần cập nhật.');
        return;
      }

      let saved = await customerService.updateCustomer(initialCustomer.id, {
        name: values.name.trim(),
        taxCode: values.taxCode.trim(),
        address: values.address.trim(),
        representativeName: values.representativeName.trim(),
        representativeTitle: optionalValue(values.representativeTitle),
        contactPerson: optionalValue(values.contactPerson),
        contactPhone: optionalValue(values.contactPhone),
        contactEmail: optionalValue(values.contactEmail),
      });

      const statusChanged = values.status !== initialSnapshot.status;
      const reasonChanged =
        values.status === 'Suspended' &&
        values.suspendedReason.trim() !== initialSnapshot.suspendedReason.trim();

      if (statusChanged || reasonChanged) {
        saved = await customerService.updateCustomerStatus(initialCustomer.id, {
          status: toCustomerStatusCode(values.status),
          reason: values.status === 'Suspended' ? optionalValue(values.suspendedReason) : null,
        });
      }

      onSuccess(saved, 'edit');
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        if (Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
        }
      } else {
        setGeneralError('Đã xảy ra lỗi không mong muốn khi lưu hồ sơ khách hàng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      {/* Top Page Title & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleRequestCancel}
            disabled={isSubmitting}
            aria-label="Quay lại danh sách"
            className="mt-0.5 p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] leading-[30px] font-semibold text-[#111827]">
                {mode === 'create'
                  ? 'Thêm khách hàng mới'
                  : `Cập nhật khách hàng: ${initialCustomer?.code ?? ''}`}
              </h1>
              {mode === 'edit' && <StatusBadge status={values.status} />}
            </div>
            <p className="text-sm text-[#4B5563] mt-0.5">
              {mode === 'create'
                ? 'Khai báo thông tin doanh nghiệp, mã số thuế và người đại diện pháp luật.'
                : 'Chỉnh sửa thông tin hồ sơ doanh nghiệp và trạng thái hợp tác.'}
            </p>
          </div>
        </div>
      </div>

      {/* General / Server Error Banner */}
      {generalError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3 text-sm text-[#DC2626]"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Không thể lưu thông tin khách hàng</p>
            <p className="mt-0.5 text-red-700">{generalError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Form Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Thông tin doanh nghiệp */}
            <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2.5 bg-slate-50/70">
                <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#111827]">
                    01. Thông tin định danh &amp; Doanh nghiệp
                  </h2>
                  <p className="text-xs text-[#4B5563]">
                    Mã khách hàng và mã số thuế là duy nhất trên toàn hệ thống
                  </p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  label="Mã khách hàng"
                  htmlFor="customer-code"
                  required
                  error={fieldErrors.code}
                  hint={
                    mode === 'edit'
                      ? 'Mã khách hàng không thể thay đổi sau khi khởi tạo.'
                      : '3–20 ký tự gồm chữ, số, dấu gạch ngang (-) hoặc gạch dưới (_).'
                  }
                  rightAction={
                    mode === 'create' ? (
                      <button
                        type="button"
                        onClick={handleSuggestCode}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1E3A8A] transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gợi ý mã</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9CA3AF]">
                        <Lock className="w-3 h-3" />
                        <span>Cố định</span>
                      </span>
                    )
                  }
                >
                  <input
                    id="customer-code"
                    name="code"
                    type="text"
                    value={values.code}
                    onChange={(e) => handleFieldChange('code', e.target.value)}
                    onBlur={() => handleFieldBlur('code')}
                    disabled={mode === 'edit' || isSubmitting}
                    maxLength={20}
                    placeholder="VD: KH-001"
                    aria-invalid={Boolean(fieldErrors.code)}
                    aria-describedby={
                      fieldErrors.code ? 'customer-code-error' : 'customer-code-hint'
                    }
                    className={getInputClassName(
                      Boolean(fieldErrors.code),
                      mode === 'edit' || isSubmitting,
                      'font-mono tracking-wide'
                    )}
                  />
                </FormField>

                <FormField
                  label="Mã số thuế"
                  htmlFor="customer-taxCode"
                  required
                  error={fieldErrors.taxCode}
                  hint="10 chữ số hoặc 13 chữ số có dấu gạch ngang (VD: 0312345678-001)."
                >
                  <input
                    id="customer-taxCode"
                    name="taxCode"
                    type="text"
                    value={values.taxCode}
                    onChange={(e) => handleFieldChange('taxCode', e.target.value)}
                    onBlur={() => handleFieldBlur('taxCode')}
                    disabled={isSubmitting}
                    maxLength={14}
                    placeholder="VD: 0101234567 hoặc 0101234567-001"
                    aria-invalid={Boolean(fieldErrors.taxCode)}
                    aria-describedby={
                      fieldErrors.taxCode ? 'customer-taxCode-error' : 'customer-taxCode-hint'
                    }
                    className={getInputClassName(
                      Boolean(fieldErrors.taxCode),
                      isSubmitting,
                      'font-mono tracking-wide'
                    )}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField
                    label="Tên khách hàng / Doanh nghiệp"
                    htmlFor="customer-name"
                    required
                    error={fieldErrors.name}
                    rightAction={
                      <span className="text-[11px] text-[#9CA3AF]">
                        {values.name.length}/200
                      </span>
                    }
                  >
                    <input
                      id="customer-name"
                      name="name"
                      type="text"
                      value={values.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      disabled={isSubmitting}
                      maxLength={200}
                      placeholder="VD: Công ty Cổ phần Logistics Cảng Sài Gòn"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
                      className={getInputClassName(Boolean(fieldErrors.name), isSubmitting)}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField
                    label="Địa chỉ trụ sở"
                    htmlFor="customer-address"
                    required
                    error={fieldErrors.address}
                    rightAction={
                      <span className="text-[11px] text-[#9CA3AF]">
                        {values.address.length}/500
                      </span>
                    }
                  >
                    <textarea
                      id="customer-address"
                      name="address"
                      rows={2}
                      value={values.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onBlur={() => handleFieldBlur('address')}
                      disabled={isSubmitting}
                      maxLength={500}
                      placeholder="Nhập đầy đủ số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      aria-invalid={Boolean(fieldErrors.address)}
                      aria-describedby={
                        fieldErrors.address ? 'customer-address-error' : undefined
                      }
                      className={getInputClassName(Boolean(fieldErrors.address), isSubmitting)}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <span className="block text-xs font-semibold text-[#4B5563] mb-2">
                    Trạng thái hoạt động
                  </span>
                  {mode === 'create' ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6]/60 px-3.5 py-2.5">
                      <StatusBadge status="Active" />
                      <span className="text-xs text-[#4B5563]">
                        Khách hàng mới tạo được kích hoạt ở trạng thái Hoạt động.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[#111827]">
                          <input
                            type="radio"
                            name="customer-status"
                            value="Active"
                            checked={values.status === 'Active'}
                            onChange={() => handleStatusSelect('Active')}
                            disabled={isSubmitting}
                            className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span>Hoạt động</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[#111827]">
                          <input
                            type="radio"
                            name="customer-status"
                            value="Suspended"
                            checked={values.status === 'Suspended'}
                            onChange={() => handleStatusSelect('Suspended')}
                            disabled={isSubmitting}
                            className="h-4 w-4 text-[#D97706] focus:ring-[#D97706]"
                          />
                          <span>Tạm ngưng</span>
                        </label>
                      </div>

                      {values.status === 'Suspended' && (
                        <FormField
                          label="Lý do tạm ngưng"
                          htmlFor="customer-suspendedReason"
                          error={fieldErrors.suspendedReason}
                          hint="Khách hàng bị tạm ngưng sẽ không thể chọn khi tạo hợp đồng mới."
                        >
                          <input
                            id="customer-suspendedReason"
                            name="suspendedReason"
                            type="text"
                            value={values.suspendedReason}
                            onChange={(e) => handleFieldChange('suspendedReason', e.target.value)}
                            onBlur={() => handleFieldBlur('suspendedReason')}
                            disabled={isSubmitting}
                            maxLength={500}
                            placeholder="VD: Quá hạn thanh toán công nợ hoặc tạm dừng hợp tác"
                            className={getInputClassName(
                              Boolean(fieldErrors.suspendedReason),
                              isSubmitting
                            )}
                          />
                        </FormField>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Người đại diện & Liên hệ */}
            <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2.5 bg-slate-50/70">
                <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E3A8A] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#111827]">
                    02. Người đại diện &amp; Thông tin liên hệ
                  </h2>
                  <p className="text-xs text-[#4B5563]">
                    Thông tin người ký hợp đồng và đầu mối liên hệ nghiệp vụ
                  </p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  label="Người đại diện pháp luật"
                  htmlFor="customer-representativeName"
                  required
                  error={fieldErrors.representativeName}
                >
                  <input
                    id="customer-representativeName"
                    name="representativeName"
                    type="text"
                    value={values.representativeName}
                    onChange={(e) => handleFieldChange('representativeName', e.target.value)}
                    onBlur={() => handleFieldBlur('representativeName')}
                    disabled={isSubmitting}
                    maxLength={150}
                    placeholder="VD: Nguyễn Văn A"
                    aria-invalid={Boolean(fieldErrors.representativeName)}
                    aria-describedby={
                      fieldErrors.representativeName
                        ? 'customer-representativeName-error'
                        : undefined
                    }
                    className={getInputClassName(
                      Boolean(fieldErrors.representativeName),
                      isSubmitting
                    )}
                  />
                </FormField>

                <FormField
                  label="Chức vụ người đại diện"
                  htmlFor="customer-representativeTitle"
                  error={fieldErrors.representativeTitle}
                >
                  <input
                    id="customer-representativeTitle"
                    name="representativeTitle"
                    type="text"
                    value={values.representativeTitle}
                    onChange={(e) => handleFieldChange('representativeTitle', e.target.value)}
                    onBlur={() => handleFieldBlur('representativeTitle')}
                    disabled={isSubmitting}
                    maxLength={100}
                    placeholder="VD: Tổng Giám đốc"
                    aria-invalid={Boolean(fieldErrors.representativeTitle)}
                    className={getInputClassName(
                      Boolean(fieldErrors.representativeTitle),
                      isSubmitting
                    )}
                  />
                </FormField>

                <FormField
                  label="Người liên hệ"
                  htmlFor="customer-contactPerson"
                  error={fieldErrors.contactPerson}
                >
                  <input
                    id="customer-contactPerson"
                    name="contactPerson"
                    type="text"
                    value={values.contactPerson}
                    onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                    onBlur={() => handleFieldBlur('contactPerson')}
                    disabled={isSubmitting}
                    maxLength={150}
                    placeholder="VD: Trần Thị B (Phòng Xuất nhập khẩu)"
                    aria-invalid={Boolean(fieldErrors.contactPerson)}
                    className={getInputClassName(
                      Boolean(fieldErrors.contactPerson),
                      isSubmitting
                    )}
                  />
                </FormField>

                <FormField
                  label="Số điện thoại liên hệ"
                  htmlFor="customer-contactPhone"
                  error={fieldErrors.contactPhone}
                  hint="Từ 8–20 ký tự, cho phép số, dấu +, khoảng trắng hoặc dấu gạch ngang."
                >
                  <input
                    id="customer-contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={values.contactPhone}
                    onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                    onBlur={() => handleFieldBlur('contactPhone')}
                    disabled={isSubmitting}
                    maxLength={20}
                    placeholder="VD: 0901234567"
                    aria-invalid={Boolean(fieldErrors.contactPhone)}
                    aria-describedby={
                      fieldErrors.contactPhone
                        ? 'customer-contactPhone-error'
                        : 'customer-contactPhone-hint'
                    }
                    className={getInputClassName(
                      Boolean(fieldErrors.contactPhone),
                      isSubmitting
                    )}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField
                    label="Email liên hệ"
                    htmlFor="customer-contactEmail"
                    error={fieldErrors.contactEmail}
                  >
                    <input
                      id="customer-contactEmail"
                      name="contactEmail"
                      type="email"
                      value={values.contactEmail}
                      onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                      onBlur={() => handleFieldBlur('contactEmail')}
                      disabled={isSubmitting}
                      maxLength={150}
                      placeholder="VD: lienhe@doanhnghiep.vn"
                      aria-invalid={Boolean(fieldErrors.contactEmail)}
                      aria-describedby={
                        fieldErrors.contactEmail ? 'customer-contactEmail-error' : undefined
                      }
                      className={getInputClassName(
                        Boolean(fieldErrors.contactEmail),
                        isSubmitting
                      )}
                    />
                  </FormField>
                </div>
              </div>
            </section>
          </div>

          {/* Right 4 Columns: Live Preview & Validation Checklist */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#111827]">Tóm tắt hồ sơ</h3>
                <StatusBadge status={values.status} />
              </div>

              <div className="rounded-lg bg-[#F3F4F6]/80 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Mã KH:</span>
                  <span className="font-mono font-semibold text-[#1E3A8A]">
                    {values.code.trim() || '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">MST:</span>
                  <span className="font-mono font-medium text-[#111827]">
                    {values.taxCode.trim() || '—'}
                  </span>
                </div>
                <div className="pt-1 border-t border-[#E5E7EB]">
                  <span className="text-[#4B5563] block">Tên doanh nghiệp:</span>
                  <span className="font-semibold text-[#111827] break-words">
                    {values.name.trim() || 'Chưa nhập tên doanh nghiệp'}
                  </span>
                </div>
                <div>
                  <span className="text-[#4B5563] block">Đại diện:</span>
                  <span className="font-medium text-[#111827]">
                    {values.representativeName.trim() || '—'}
                    {values.representativeTitle.trim()
                      ? ` (${values.representativeTitle.trim()})`
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#111827]">
                Điều kiện hợp lệ bắt buộc
              </h3>
              <ul className="space-y-2.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-xs">
                    {item.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-0.5" />
                    )}
                    <span className={item.ok ? 'text-[#111827] font-medium' : 'text-[#4B5563]'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 lg:left-60 right-0 z-10 bg-white/95 backdrop-blur border-t border-[#E5E7EB] px-6 lg:px-8 py-3.5">
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#4B5563]">
              Các trường có dấu <span className="text-[#DC2626] font-semibold">*</span> là bắt buộc.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequestCancel}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors disabled:opacity-50"
              >
                Hủy
              </button>

              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting || !isDirty}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm mới</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1E3A8A] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {mode === 'create' ? 'Lưu khách hàng' : 'Cập nhật khách hàng'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Unsaved Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-modal-title"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl border border-[#E5E7EB] max-w-md w-full p-6 space-y-4">
            <h3 id="discard-modal-title" className="text-lg font-semibold text-[#111827]">
              Hủy bỏ các thay đổi chưa lưu?
            </h3>
            <p className="text-sm text-[#4B5563]">
              Bạn đã chỉnh sửa thông tin trên biểu mẫu nhưng chưa lưu. Nếu rời khỏi màn hình này, các thay đổi sẽ bị mất.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6]"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-sm font-semibold text-white"
              >
                Hủy thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
