import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  ChevronDown,
  Clock,
  ShieldCheck,
  UserCheck,
  FileEdit,
  FilePlus2,
  RotateCcw,
  Ban,
  Printer,
  Calendar,
  DollarSign,
  Building2,
  FileCheck2,
  HelpCircle,
  X,
  ExternalLink,
  Save,
  ArrowRight,
} from 'lucide-react';
import type { Contract, Customer, Attachment, ContractStatus } from '../types/contract';
import { StatusBadge } from './StatusBadge';

interface ContractFormProps {
  mode: 'create' | 'detail' | 'edit';
  contract?: Contract | null;
  customers: Customer[];
  onBack: () => void;
  onSave: (contractData: Partial<Contract>, action: 'save_draft' | 'submit_approval') => void;
  onApprove?: (contractId: string) => void;
  onReject?: (contractId: string, reason: string) => void;
  onRequestRevision?: (contractId: string, reason: string) => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  mode,
  contract,
  customers,
  onBack,
  onSave,
  onApprove,
  onReject,
  onRequestRevision,
}) => {
  // Trạng thái cho phép chỉnh sửa: Mới tạo HOẶC đang ở Draft / RevisionRequested
  const isStatusEditable = mode === 'create' || mode === 'edit' || contract?.status === 'Draft' || contract?.status === 'RevisionRequested';

  // Chế độ chỉnh sửa (nếu là create hoặc edit -> luôn true; nếu là detail -> bật khi bấm "Chỉnh sửa hồ sơ")
  const [isEditing, setIsEditing] = useState<boolean>(mode === 'create' || mode === 'edit');

  // Stepper state: Bước 1 -> Bước 2 -> Bước 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [code, setCode] = useState(
    contract?.code ||
      (mode === 'create' ? `HĐ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` : '')
  );
  const [title, setTitle] = useState(contract?.title || '');
  const [contractType, setContractType] = useState(contract?.contractType || 'Dịch vụ cảng');
  const [selectedCustomerId, setSelectedCustomerId] = useState(contract?.customerId || '');
  const [effectiveFrom, setEffectiveFrom] = useState(contract?.effectiveFrom ? contract.effectiveFrom.split('T')[0] : '');
  const [effectiveTo, setEffectiveTo] = useState(contract?.effectiveTo ? contract.effectiveTo.split('T')[0] : '');
  const [contractValue, setContractValue] = useState<number>(contract?.contractValue || 0);
  const [currency, setCurrency] = useState(contract?.currency || 'VND');

  // Step 2 Fields
  const [paymentTermDays, setPaymentTermDays] = useState<string>(String(contract?.paymentTermDays || '30 ngày'));
  const [paymentCycle, setPaymentCycle] = useState<string>(contract?.paymentCycle || 'Hàng tháng');
  const [paymentTerms, setPaymentTerms] = useState(
    contract?.paymentTerms || 'Thanh toán chuyển khoản định kỳ trong vòng 30 ngày kể từ ngày nhận đủ chứng từ hóa đơn.'
  );
  const [serviceTerms, setServiceTerms] = useState(
    contract?.serviceTerms ||
      'Bên B cung cấp dịch vụ logistics, bốc dỡ hàng hóa và lưu bãi cảng theo tiêu chuẩn chất lượng cam kết; Bên A có nghĩa vụ thanh toán chi phí và giải phóng phương tiện đúng hạn.'
  );

  // Step 3 Fields: Attachments
  const [attachments, setAttachments] = useState<Attachment[]>(contract?.attachments || []);

  // UI States
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Modals
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState<{
    type: 'reject' | 'revision';
    title: string;
  } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Tab state
  const [detailTab, setDetailTab] = useState<'info' | 'workflow' | 'annexes' | 'files' | 'history'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ hóa khi contract prop thay đổi từ ngoài vào
  useEffect(() => {
    if (contract) {
      setCode(contract.code || '');
      setTitle(contract.title || '');
      setContractType(contract.contractType || 'Dịch vụ cảng');
      setSelectedCustomerId(contract.customerId || '');
      setEffectiveFrom(contract.effectiveFrom ? contract.effectiveFrom.split('T')[0] : '');
      setEffectiveTo(contract.effectiveTo ? contract.effectiveTo.split('T')[0] : '');
      setContractValue(contract.contractValue || 0);
      setCurrency(contract.currency || 'VND');
      if (contract.paymentTerms) setPaymentTerms(contract.paymentTerms);
      if (contract.serviceTerms) setServiceTerms(contract.serviceTerms);
      if (contract.paymentTermDays) setPaymentTermDays(String(contract.paymentTermDays));
      if (contract.paymentCycle) setPaymentCycle(contract.paymentCycle);
      if (contract.attachments) setAttachments(contract.attachments);
    }
  }, [contract]);

  // Kiểm tra khách hàng có đang hoạt động (hỗ trợ cả 'Active', 1, và statusName)
  const isCustomerActive = (c?: Customer | null) => {
    if (!c) return false;
    const s = String(c.status || (c as any).statusName || '').toLowerCase();
    return s === 'active' || (c.status as any) === 1;
  };

  const activeCustomers = useMemo(() => {
    return customers.filter(isCustomerActive);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return activeCustomers;
    const q = customerSearch.toLowerCase();
    return activeCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.taxCode.includes(q)
    );
  }, [activeCustomers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Validation rules (CTR-02)
  const hasActiveCustomer = Boolean(selectedCustomer && isCustomerActive(selectedCustomer));
  const hasValidDates = Boolean(
    effectiveFrom && effectiveTo && new Date(effectiveFrom) <= new Date(effectiveTo)
  );
  const hasAttachments = attachments.length > 0;
  const canSubmitApproval = hasActiveCustomer && hasValidDates && hasAttachments && contractValue >= 0 && title.trim() !== '';

  const formatCurrency = (val: number, cur = 'VND') => {
    return new Intl.NumberFormat('vi-VN').format(val) + (cur === 'VND' ? ' đ' : ` ${cur}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles: Attachment[] = Array.from(e.target.files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      isMainDocument: attachments.length === 0 && idx === 0,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      rawFile: file,
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (detailFileInputRef.current) detailFileInputRef.current.value = '';
  };

  const handleToggleMainDoc = (id: string) => {
    if (!isStatusEditable) return;
    setAttachments((prev) =>
      prev.map((att) => ({
        ...att,
        isMainDocument: att.id === id,
      }))
    );
  };

  const handleDeleteAttachment = (id: string) => {
    if (!isStatusEditable) return;
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isMainDocument)) {
        filtered[0].isMainDocument = true;
      }
      return filtered;
    });
  };

  // Step 1 Validation & Proceed
  const handleProceedStep1 = () => {
    setStep1Error(null);
    if (!title.trim()) {
      setStep1Error('Vui lòng nhập tên hợp đồng.');
      return;
    }
    if (!hasActiveCustomer) {
      setStep1Error('Vui lòng chọn một khách hàng đang hoạt động.');
      return;
    }
    if (!effectiveFrom || !effectiveTo) {
      setStep1Error('Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc hiệu lực.');
      return;
    }
    if (new Date(effectiveFrom) > new Date(effectiveTo)) {
      setStep1Error('Ngày bắt đầu hiệu lực không được lớn hơn ngày kết thúc.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Proceed
  const handleProceedStep2 = () => {
    setStep2Error(null);
    if (!paymentTerms.trim()) {
      setStep2Error('Vui lòng nhập điều khoản thanh toán.');
      return;
    }
    if (!serviceTerms.trim()) {
      setStep2Error('Vui lòng nhập điều khoản dịch vụ & cam kết.');
      return;
    }
    setCurrentStep(3);
  };

  // Submit Handler
  const handleSaveDraft = () => {
    if (!title.trim()) {
      setGeneralError('Vui lòng nhập tên hợp đồng trước khi lưu nháp.');
      return;
    }
    const payload: Partial<Contract> = {
      code,
      title,
      contractType,
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || contract?.customerName || 'Khách hàng',
      customerTaxCode: selectedCustomer?.taxCode || contract?.customerTaxCode || '',
      effectiveFrom,
      effectiveTo,
      contractValue,
      currency,
      paymentTerms: `${paymentTermDays} | ${paymentCycle}. ${paymentTerms}`,
      paymentTermDays,
      paymentCycle,
      serviceTerms,
      attachments,
    };
    onSave(payload, 'save_draft');
    setIsEditing(false);
  };

  const handleConfirmSubmitApproval = () => {
    setIsSubmitting(true);
    const payload: Partial<Contract> = {
      code,
      title,
      contractType,
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || contract?.customerName || 'Khách hàng',
      customerTaxCode: selectedCustomer?.taxCode || contract?.customerTaxCode || '',
      effectiveFrom,
      effectiveTo,
      contractValue,
      currency,
      paymentTerms: `${paymentTermDays} | ${paymentCycle}. ${paymentTerms}`,
      paymentTermDays,
      paymentCycle,
      serviceTerms,
      attachments,
    };
    onSave(payload, 'submit_approval');
    setShowSubmitConfirmModal(false);
    setIsEditing(false);
  };

  // =========================================================================
  // VIEW MODE: CHI TIẾT HỢP ĐỒNG (khi mode === 'detail' và isEditing === false)
  // =========================================================================
  if (mode === 'detail' && contract && !isEditing) {
    const isDraft = contract.status === 'Draft';
    const isRevision = contract.status === 'RevisionRequested';
    const isUnderReview =
      contract.status === 'UnderReview' ||
      contract.status === 'Submitted' ||
      contract.status === 'PendingApproval';
    const isApproved = contract.status === 'Approved' || contract.status === 'Active';
    const isRejected = contract.status === 'Rejected';

    const currentAssignee =
      contract.currentAssignee ||
      (isUnderReview
        ? 'Pháp chế – Lê C (Chuyên viên rà soát)'
        : isDraft
        ? 'Chuyên viên Kinh doanh (Bản nháp)'
        : contract.ownerName || 'Hệ thống');

    return (
      <div className="flex-1 flex flex-col space-y-6">
        {/* Hidden File Input for Direct Upload */}
        <input
          ref={detailFileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.docx,.doc,.xlsx,.xls"
        />

        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại danh sách hợp đồng</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9CA3AF]">Mã hồ sơ:</span>
            <span className="font-mono text-xs font-bold text-[#1E3A8A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
              {contract.code}
            </span>
          </div>
        </div>

        {/* Contract Header Banner */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-[#111827] leading-tight">
                  {contract.title || contract.code}
                </h1>
                <StatusBadge status={contract.status} />
              </div>
              <p className="text-xs text-[#4B5563] mt-1.5 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-[#111827]">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  {contract.customerName}
                </span>
                <span>•</span>
                <span>
                  Loại HĐ: <strong>{contract.contractType || 'Dịch vụ cảng'}</strong>
                </span>
                <span>•</span>
                <span>
                  Thời hạn: <strong>{contract.effectiveFrom}</strong> đến{' '}
                  <strong>{contract.effectiveTo}</strong>
                </span>
              </p>
            </div>

            {/* Action Buttons governed by status (Figma Section 3.4.3) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {(isDraft || isRevision) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setCurrentStep(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-all"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi trình duyệt</span>
                  </button>
                </>
              )}

              {isUnderReview && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove?.(contract.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Phê duyệt hợp đồng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowReasonModal({
                        type: 'revision',
                        title: 'Yêu cầu điều chỉnh hồ sơ hợp đồng',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-xs font-semibold text-[#D97706] hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yêu cầu sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowReasonModal({
                        type: 'reject',
                        title: 'Từ chối phê duyệt hợp đồng',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-300 bg-rose-50 text-xs font-semibold text-[#DC2626] hover:bg-rose-100 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                </>
              )}

              {isApproved && (
                <>
                  <button
                    type="button"
                    onClick={() => alert('Khởi tạo phụ lục hợp đồng mới liên kết với ' + contract.code)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-all"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Tạo phụ lục</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In / Xuất PDF</span>
                  </button>
                </>
              )}

              {isRejected && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setCurrentStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tạo bản chỉnh sửa (Revision)</span>
                </button>
              )}
            </div>
          </div>

          {/* Assignee Banner */}
          <div className="mt-4 pt-3.5 border-t border-[#E5E7EB] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#9CA3AF]">Cán bộ đang phụ trách xử lý:</span>
              <span className="font-semibold text-[#1E3A8A] bg-[#EFF6FF] px-2.5 py-1 rounded border border-[#DBEAFE] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                {currentAssignee}
              </span>
            </div>

            <div className="text-[11px] text-[#9CA3AF]">
              Khởi tạo ngày: <span className="text-[#4B5563] font-medium">{contract.createdAt || 'Hôm nay'}</span>
            </div>
          </div>
        </div>

        {/* Detail Tabs Bar */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="border-b border-[#E5E7EB] px-6 flex items-center gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setDetailTab('info')}
              className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                detailTab === 'info'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              Thông tin chung
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('workflow')}
              className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                detailTab === 'workflow'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <span>Tiến độ phê duyệt</span>
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('annexes')}
              className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                detailTab === 'annexes'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              Phụ lục hợp đồng
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('files')}
              className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                detailTab === 'files'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <span>Tệp đính kèm</span>
              <span className="px-1.5 py-0.2 bg-[#F3F4F6] text-[10px] rounded font-bold text-[#4B5563]">
                {attachments.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('history')}
              className={`py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                detailTab === 'history'
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              Lịch sử thay đổi
            </button>
          </div>

          <div className="p-6">
            {/* Tab 1: Thông tin chung */}
            {detailTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                  {/* Cột trái: Đối tác & Thời hạn */}
                  <div className="space-y-5">
                    <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] space-y-3">
                      <h3 className="font-bold text-[#1E3A8A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Thông tin đối tác khách hàng
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[#9CA3AF]">Tên doanh nghiệp:</span>
                          <p className="font-semibold text-sm text-[#111827] mt-0.5">
                            {contract.customerName}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF]">Mã số thuế:</span>
                          <p className="font-mono font-medium text-[#111827]">
                            {contract.customerTaxCode || '0314892011'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] space-y-3">
                      <h3 className="font-bold text-[#1E3A8A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Thời hạn &amp; Giá trị hợp đồng
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[#9CA3AF]">Ngày bắt đầu:</span>
                          <p className="font-medium text-[#111827] mt-0.5">{contract.effectiveFrom}</p>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF]">Ngày kết thúc:</span>
                          <p className="font-medium text-[#111827] mt-0.5">{contract.effectiveTo}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-[#E5E7EB]">
                          <span className="text-[#9CA3AF]">Tổng giá trị hợp đồng:</span>
                          <p className="font-bold text-lg text-[#16A34A] mt-0.5">
                            {formatCurrency(contract.contractValue, contract.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Điều khoản thanh toán & Dịch vụ */}
                  <div className="space-y-5">
                    <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] space-y-3">
                      <h3 className="font-bold text-[#1E3A8A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        Điều khoản thanh toán
                      </h3>
                      <p className="text-[#111827] leading-relaxed">
                        {contract.paymentTerms || 'Thanh toán chuyển khoản định kỳ 30 ngày.'}
                      </p>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] space-y-3">
                      <h3 className="font-bold text-[#1E3A8A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Điều khoản dịch vụ &amp; Cam kết
                      </h3>
                      <p className="text-[#111827] leading-relaxed whitespace-pre-line">
                        {contract.serviceTerms || 'Cam kết chất lượng vận tải và an toàn bốc dỡ cảng biển.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phần TỆP ĐÍNH KÈM HIỂN THỊ TRỰC TIẾP TRÊN TAB THÔNG TIN CHUNG */}
                <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#1E3A8A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                      Hồ sơ &amp; Tệp đính kèm ({attachments.length} tài liệu)
                    </h3>

                    {isStatusEditable && (
                      <button
                        type="button"
                        onClick={() => detailFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#2563EB] rounded-lg text-xs font-semibold text-[#2563EB] transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Tải tệp lên</span>
                      </button>
                    )}
                  </div>

                  {attachments.length > 0 ? (
                    <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
                      {attachments.map((file) => (
                        <div key={file.id} className="p-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-[#111827]">{file.fileName}</p>
                              <span className="text-[10px] text-[#9CA3AF]">
                                {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {file.uploadedAt || 'Vừa tải lên'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {file.isMainDocument && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                                TÀI LIỆU CHÍNH
                              </span>
                            )}
                            <a
                              href={`/api/v1/contracts/${contract.id}/attachments/${file.id}`}
                              download={file.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-[#2563EB] hover:underline px-2 py-1 flex items-center gap-1"
                            >
                              <span>Tải về</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {isStatusEditable && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(file.id)}
                                className="p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                                title="Xóa tệp"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center border-2 border-dashed border-[#DBEAFE] rounded-lg bg-white space-y-2">
                      <UploadCloud className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                      <p className="text-xs font-semibold text-[#111827]">
                        Chưa có tệp đính kèm nào được tải lên cho hợp đồng này
                      </p>
                      {isStatusEditable ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => detailFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors mt-1"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Bấm để chọn tệp tải lên ngay (PDF, DOCX)</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#9CA3AF]">
                          Hồ sơ không có tệp đính kèm nào kèm theo.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Tiến độ phê duyệt */}
            {detailTab === 'workflow' && (
              <div className="max-w-2xl mx-auto py-4">
                <h3 className="text-sm font-bold text-[#111827] mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  Tiến trình phê duyệt đa cấp (Kinh doanh → Pháp chế → Ban Giám đốc)
                </h3>

                <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E7EB]">
                  {/* Step 1: Kinh doanh */}
                  <div className="relative">
                    <span className="absolute -left-8 top-0 w-7 h-7 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      ✓
                    </span>
                    <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#111827]">
                          1. Bộ phận Kinh doanh – Khởi tạo &amp; Gửi trình duyệt
                        </span>
                        <span className="text-[11px] font-medium text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded">
                          Đã hoàn thành
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1.5">
                        Người thực hiện: <strong>{contract.ownerName || 'Chuyên viên Kinh doanh'}</strong> • {contract.createdAt || '08:30'}
                      </p>
                      <p className="text-xs text-[#111827] mt-2 p-2.5 rounded bg-[#F8FAFC] border border-[#E5E7EB]">
                        "Đã hoàn thiện thông tin pháp nhân khách hàng, bảng giá dịch vụ thỏa thuận và đính kèm dự thảo hợp đồng."
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Pháp chế */}
                  <div className="relative">
                    <span
                      className={`absolute -left-8 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        isApproved
                          ? 'bg-[#16A34A] text-white'
                          : isUnderReview
                          ? 'bg-[#2563EB] text-white animate-pulse'
                          : isRevision
                          ? 'bg-[#D97706] text-white'
                          : isRejected
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-white border-2 border-[#9CA3AF] text-[#9CA3AF]'
                      }`}
                    >
                      {isApproved ? '✓' : isUnderReview ? '◐' : isRevision ? '!' : '2'}
                    </span>
                    <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#111827]">
                          2. Ban Pháp chế – Rà soát điều khoản &amp; Rủi ro pháp lý
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isApproved
                              ? 'bg-emerald-50 text-[#16A34A]'
                              : isUnderReview
                              ? 'bg-cyan-50 text-[#0891B2]'
                              : isRevision
                              ? 'bg-amber-50 text-[#D97706]'
                              : 'bg-[#F3F4F6] text-[#4B5563]'
                          }`}
                        >
                          {isApproved
                            ? 'Đã duyệt rà soát'
                            : isUnderReview
                            ? 'Đang thụ lý rà soát'
                            : isRevision
                            ? 'Yêu cầu chỉnh sửa'
                            : 'Chờ chuyển bước'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1.5">
                        Người phụ trách: <strong>Pháp chế – Lê C</strong>
                      </p>
                      {isUnderReview && (
                        <p className="text-xs text-[#0891B2] mt-2 p-2.5 rounded bg-cyan-50/50 border border-cyan-200">
                          Đang tiến hành đối chiếu thẩm quyền ký kết và kiểm tra quy định bảo lãnh thanh toán.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Ban Giám đốc */}
                  <div className="relative">
                    <span
                      className={`absolute -left-8 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        isApproved
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-white border-2 border-[#9CA3AF] text-[#9CA3AF]'
                      }`}
                    >
                      {isApproved ? '✓' : '3'}
                    </span>
                    <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#111827]">
                          3. Ban Giám đốc – Phê duyệt &amp; Ký ban hành
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isApproved
                              ? 'bg-emerald-50 text-[#16A34A]'
                              : 'bg-[#F3F4F6] text-[#4B5563]'
                          }`}
                        >
                          {isApproved ? 'Đã ký phê duyệt' : 'Chờ hoàn tất bước 2'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1.5">
                        Thẩm quyền: <strong>Trần Giám Đốc (TGĐ)</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Phụ lục hợp đồng */}
            {detailTab === 'annexes' && (
              <div className="py-8 text-center space-y-3">
                <FilePlus2 className="w-10 h-10 text-[#9CA3AF] mx-auto" />
                <p className="text-sm font-semibold text-[#111827]">Phụ lục hợp đồng</p>
                <p className="text-xs text-[#4B5563] max-w-md mx-auto">
                  Hợp đồng chưa phát sinh phụ lục bổ sung hoặc điều chỉnh đơn giá.
                </p>
                {isApproved && (
                  <button
                    type="button"
                    onClick={() => alert('Chức năng tạo phụ lục đã sẵn sàng!')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-all mt-2"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Tạo phụ lục đầu tiên</span>
                  </button>
                )}
              </div>
            )}

            {/* Tab 4: Tệp đính kèm */}
            {detailTab === 'files' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      Danh mục hồ sơ đính kèm ({attachments.length} tệp)
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      Bản thảo hợp đồng, phụ lục kỹ thuật, và hồ sơ năng lực pháp lý đối tác.
                    </p>
                  </div>

                  {isStatusEditable && (
                    <button
                      type="button"
                      onClick={() => detailFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Tải thêm tài liệu</span>
                    </button>
                  )}
                </div>

                {isStatusEditable && (
                  <div
                    onClick={() => detailFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#DBEAFE] hover:border-[#2563EB] bg-[#EFF6FF]/40 rounded-xl p-5 text-center cursor-pointer transition-colors"
                  >
                    <UploadCloud className="w-7 h-7 text-[#2563EB] mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-[#1E3A8A]">
                      Kéo thả tệp hoặc <span className="underline text-[#2563EB]">chọn từ máy tính</span> để thêm vào hồ sơ
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      Hỗ trợ PDF, DOCX, XLSX (tối đa 10 MB)
                    </p>
                  </div>
                )}

                <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
                  {attachments.length > 0 ? (
                    attachments.map((file) => (
                      <div key={file.id} className="p-3.5 flex items-center justify-between hover:bg-[#F8FAFC]">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[#2563EB] shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-[#111827]">{file.fileName}</p>
                            <p className="text-[11px] text-[#9CA3AF]">
                              {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB • Tải lên: {file.uploadedAt || 'Hôm nay'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {file.isMainDocument ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                              TÀI LIỆU CHÍNH
                            </span>
                          ) : (
                            isStatusEditable && (
                              <button
                                type="button"
                                onClick={() => handleToggleMainDoc(file.id)}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                              >
                                Đặt làm tệp chính
                              </button>
                            )
                          )}
                          <a
                            href={`/api/v1/contracts/${contract.id}/attachments/${file.id}`}
                            download={file.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-[#2563EB] hover:underline px-2 py-1 flex items-center gap-1"
                          >
                            <span>Tải về</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {isStatusEditable && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(file.id)}
                              className="p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                              title="Xóa tệp"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-[#9CA3AF]">
                      Chưa có tệp đính kèm nào được tải lên cho hợp đồng này.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: Lịch sử thay đổi */}
            {detailTab === 'history' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#111827]">Khởi tạo hồ sơ hợp đồng</p>
                    <p className="text-[11px] text-[#4B5563] mt-0.5">
                      Thực hiện bởi: {contract.ownerName || 'Kinh doanh'} • Thời điểm: {contract.createdAt || 'Hôm nay'}
                    </p>
                  </div>
                </div>
                {contract.status !== 'Draft' && (
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-start gap-3">
                    <Send className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111827]">Gửi trình duyệt hợp đồng sang Ban Pháp chế</p>
                      <p className="text-[11px] text-[#4B5563] mt-0.5">
                        Chuyển đổi trạng thái: Draft → UnderReview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal nhập lý do Từ chối / Yêu cầu chỉnh sửa (APR-03) */}
        {showReasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111827]">{showReasonModal.title}</h3>
                <button
                  type="button"
                  onClick={() => setShowReasonModal(null)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#111827]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                  Lý do chi tiết <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Vui lòng nêu rõ lý do hoặc điều khoản cần chỉnh sửa bổ sung (bắt buộc theo quy định APR-03)..."
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReasonModal(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!reasonText.trim()}
                  onClick={() => {
                    if (showReasonModal.type === 'reject') {
                      onReject?.(contract.id, reasonText);
                    } else {
                      onRequestRevision?.(contract.id, reasonText);
                    }
                    setShowReasonModal(null);
                    setReasonText('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
                >
                  Xác nhận gửi ý kiến
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // EDIT / CREATE MODE: WIZARD 3 BƯỚC ĐẦY ĐỦ
  // Cho phép chỉnh sửa toàn diện tất cả các thông tin và quản lý tệp đính kèm
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (mode === 'detail') {
              setIsEditing(false); // Quay lại xem chi tiết
            } else {
              onBack(); // Quay lại danh sách
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Hợp đồng</span>
          <span className="text-[#9CA3AF]">/</span>
          <span className="text-[#111827]">
            {mode === 'create' ? 'Tạo hợp đồng mới' : `Chỉnh sửa hợp đồng: ${code}`}
          </span>
        </button>

        {mode === 'detail' && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
          >
            <span>Hủy chỉnh sửa (Xem chi tiết)</span>
          </button>
        )}
      </div>

      {/* Stepper Header (Figma Section 3.4.2) */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {/* Step 1 */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentStep(1)}
          >
            <span
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                currentStep > 1
                  ? 'bg-[#16A34A] text-white'
                  : currentStep === 1
                  ? 'bg-[#2563EB] text-white ring-4 ring-[#DBEAFE]'
                  : 'bg-[#F3F4F6] text-[#4B5563]'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span
              className={`text-xs font-semibold ${
                currentStep === 1
                  ? 'text-[#2563EB]'
                  : currentStep > 1
                  ? 'text-[#16A34A]'
                  : 'text-[#9CA3AF]'
              }`}
            >
              Thông tin chung
            </span>
          </div>

          <div className="flex-1 h-0.5 mx-4 bg-[#E5E7EB]" />

          {/* Step 2 */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (title.trim() && hasActiveCustomer) setCurrentStep(2);
            }}
          >
            <span
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                currentStep > 2
                  ? 'bg-[#16A34A] text-white'
                  : currentStep === 2
                  ? 'bg-[#2563EB] text-white ring-4 ring-[#DBEAFE]'
                  : 'bg-[#F3F4F6] text-[#4B5563]'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span
              className={`text-xs font-semibold ${
                currentStep === 2
                  ? 'text-[#2563EB]'
                  : currentStep > 2
                  ? 'text-[#16A34A]'
                  : 'text-[#9CA3AF]'
              }`}
            >
              Điều khoản
            </span>
          </div>

          <div className="flex-1 h-0.5 mx-4 bg-[#E5E7EB]" />

          {/* Step 3 */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (title.trim() && hasActiveCustomer) setCurrentStep(3);
            }}
          >
            <span
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                currentStep === 3
                  ? 'bg-[#2563EB] text-white ring-4 ring-[#DBEAFE]'
                  : 'bg-[#F3F4F6] text-[#4B5563]'
              }`}
            >
              3
            </span>
            <span
              className={`text-xs font-semibold ${
                currentStep === 3 ? 'text-[#2563EB]' : 'text-[#9CA3AF]'
              }`}
            >
              Đính kèm &amp; gửi
            </span>
          </div>
        </div>
      </div>

      {/* Error alert boxes */}
      {step1Error && currentStep === 1 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{step1Error}</span>
        </div>
      )}
      {step2Error && currentStep === 2 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{step2Error}</span>
        </div>
      )}
      {generalError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
        {/* STEP 1: Thông tin chung */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">
                Bước 1 – Thông tin hợp đồng &amp; Pháp nhân đối tác
              </h2>
              <p className="text-xs text-[#4B5563] mt-0.5">
                Cập nhật thông tin cơ bản của hồ sơ. Khách hàng phải ở trạng thái Đang hoạt động để ký kết.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Số hợp đồng */}
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Số hợp đồng (Mã HĐ) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: HĐ-2026-0007"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs font-mono font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {/* Loại hợp đồng */}
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Loại hợp đồng <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value="Dịch vụ cảng">Dịch vụ cảng biển</option>
                  <option value="Vận chuyển hàng hóa">Vận chuyển hàng hóa</option>
                  <option value="Kho bãi & lưu kho">Kho bãi &amp; lưu kho bãi</option>
                  <option value="Dịch vụ logistics tích hợp">Dịch vụ logistics tích hợp trọn gói</option>
                </select>
              </div>

              {/* Tên hợp đồng */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Tên hợp đồng <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên hợp đồng (ví dụ: Hợp đồng dịch vụ logistics tổng hợp - Cty Nam Á 2026)"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {/* Khách hàng Dropdown with Search */}
              <div className="sm:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Khách hàng đối tác <span className="text-[#DC2626]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs text-left flex items-center justify-between bg-white hover:border-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  {selectedCustomer ? (
                    <span className="font-medium text-[#111827]">
                      {selectedCustomer.name} ({selectedCustomer.code}) — MST: {selectedCustomer.taxCode}
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF]">
                      {contract?.customerName ? `${contract.customerName} (MST: ${contract.customerTaxCode || '—'})` : 'Chọn khách hàng đang hoạt động...'}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                </button>

                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E5E7EB] shadow-xl z-30 p-2 text-xs animate-fadeIn">
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm tên công ty, mã KH hoặc MST..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#2563EB]"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E7EB]">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setIsCustomerDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-[#EFF6FF] cursor-pointer rounded-lg flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-[#111827]">{c.name}</p>
                              <p className="text-[11px] text-[#4B5563]">
                                Mã: {c.code} • MST: {c.taxCode}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                              Đang hoạt động
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-center text-[#9CA3AF]">
                          Không có khách hàng hoạt động phù hợp
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hiệu lực từ ngày - đến ngày */}
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Hiệu lực từ ngày <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Hiệu lực đến ngày <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {/* Giá trị hợp đồng & Tiền tệ */}
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Giá trị hợp đồng <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={contractValue || ''}
                  onChange={(e) => setContractValue(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Đơn vị tiền tệ <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value="VND">VND (Việt Nam Đồng)</option>
                  <option value="USD">USD (Đô la Mỹ)</option>
                </select>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'detail') setIsEditing(false);
                  else onBack();
                }}
                className="px-4 py-2 border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                {mode === 'detail' ? 'Hủy chỉnh sửa' : 'Hủy'}
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] text-xs font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu nháp</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedStep1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white rounded-lg shadow-sm transition-all"
                >
                  <span>Tiếp theo: Điều khoản</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Điều khoản */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">
                Bước 2 – Điều khoản thanh toán &amp; Cam kết dịch vụ
              </h2>
              <p className="text-xs text-[#4B5563] mt-0.5">
                Xác lập kỳ hạn thanh toán, chu kỳ đối soát và quy định chất lượng logistics cam kết.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Hạn thanh toán */}
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Hạn thanh toán <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value="15 ngày">15 ngày kể từ ngày xuất hóa đơn</option>
                  <option value="30 ngày">30 ngày kể từ ngày xuất hóa đơn</option>
                  <option value="45 ngày">45 ngày kể từ ngày xuất hóa đơn</option>
                  <option value="60 ngày">60 ngày kể từ ngày xuất hóa đơn</option>
                </select>
              </div>

              {/* Kỳ thanh toán */}
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Kỳ thanh toán <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={paymentCycle}
                  onChange={(e) => setPaymentCycle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value="Hàng tháng">Hàng tháng (Định kỳ ngày 25)</option>
                  <option value="Theo đợt">Theo từng đợt giao nhận hàng</option>
                  <option value="Khi phát sinh">Thanh toán ngay khi phát sinh dịch vụ</option>
                </select>
              </div>

              {/* Ghi chú thanh toán */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Ghi chú điều khoản thanh toán &amp; tài khoản thụ hưởng
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Nhập ghi chú điều khoản thanh toán..."
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              {/* Điều khoản dịch vụ */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                  Nội dung điều khoản dịch vụ logistics <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  rows={5}
                  value={serviceTerms}
                  onChange={(e) => setServiceTerms(e.target.value)}
                  placeholder="Nêu rõ nghĩa vụ hai bên, quy định bốc dỡ, lưu bãi cảng và điều khoản miễn trừ..."
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quay lại bước 1</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] text-xs font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu nháp</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedStep2}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white rounded-lg shadow-sm transition-all"
                >
                  <span>Tiếp theo: Đính kèm tệp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Đính kèm & xem lại (Figma Section 3.4.2 Contract/Create-Step3) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wider">
                Bước 3 – Tệp đính kèm &amp; Tóm tắt hồ sơ trình duyệt
              </h2>
              <p className="text-xs text-[#4B5563] mt-0.5">
                Tải lên bản thảo hợp đồng đã ký nháy (PDF, DOCX) và kiểm tra lại toàn bộ thông tin trước khi chuyển cấp rà soát.
              </p>
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                Tệp hồ sơ đính kèm <span className="text-[#DC2626]">*</span> (yêu cầu ít nhất 1 tệp văn bản khi gửi duyệt)
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DBEAFE] hover:border-[#2563EB] bg-[#EFF6FF]/40 hover:bg-[#EFF6FF]/70 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-[#2563EB] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#1E3A8A]">
                  Kéo thả tệp vào đây hoặc <span className="text-[#2563EB] underline">Chọn tệp từ máy tính</span>
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  Hỗ trợ định dạng PDF, DOCX, XLSX – dung lượng tối đa 10 MB mỗi tệp
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls"
                />
              </div>

              {/* Uploaded Files Table */}
              {attachments.length > 0 && (
                <div className="mt-4 border border-[#E5E7EB] rounded-lg overflow-hidden divide-y divide-[#E5E7EB]">
                  {attachments.map((file) => (
                    <div key={file.id} className="p-3 flex items-center justify-between hover:bg-[#F8FAFC]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-[#111827]">{file.fileName}</p>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {file.uploadedAt || 'Hôm nay'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleMainDoc(file.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            file.isMainDocument
                              ? 'bg-[#16A34A] text-white'
                              : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
                          }`}
                        >
                          {file.isMainDocument ? '✓ Tệp chính' : 'Đặt làm tệp chính'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file.id)}
                          className="p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                          title="Xóa tệp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tóm tắt hồ sơ (Figma Section 3.4.2) */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2.5">
              <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                Tóm tắt thông tin hồ sơ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#9CA3AF]">Khách hàng: </span>
                  <strong className="text-[#111827]">
                    {selectedCustomer?.name || contract?.customerName || 'Chưa chọn'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#9CA3AF]">Mã HĐ: </span>
                  <strong className="font-mono text-[#111827]">{code}</strong>
                </div>
                <div>
                  <span className="text-[#9CA3AF]">Thời hạn hiệu lực: </span>
                  <strong className="text-[#111827]">
                    {effectiveFrom || '—'} đến {effectiveTo || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#9CA3AF]">Tổng giá trị: </span>
                  <strong className="text-[#16A34A]">{formatCurrency(contractValue, currency)}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#9CA3AF]">Điều khoản: </span>
                  <span className="text-[#111827]">
                    {paymentTermDays}, {paymentCycle}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quay lại bước 2</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E5E7EB] text-xs font-semibold text-[#1E3A8A] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{mode === 'detail' ? 'Lưu thay đổi' : 'Lưu nháp'}</span>
                </button>

                <div className="relative group">
                  <button
                    type="button"
                    disabled={!canSubmitApproval || isSubmitting}
                    onClick={() => setShowSubmitConfirmModal(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-lg shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Đang gửi...' : 'Gửi trình duyệt'}</span>
                  </button>

                  {!canSubmitApproval && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-50">
                      Chỉ gửi duyệt khi chọn khách hàng đang hoạt động, ngày hiệu lực hợp lệ và có ít nhất 1 tệp đính kèm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal (Figma Frame Contract/Submit-Confirm #11) */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] space-y-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto font-bold">
              <Send className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#111827]">
                Xác nhận gửi trình duyệt hợp đồng?
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Hồ sơ hợp đồng <strong>{code}</strong> sẽ được chuyển sang trạng thái{' '}
                <strong className="text-[#2563EB]">Đang rà soát (Under Review)</strong> và phân công cho Ban Pháp chế xử lý. Sau khi gửi, hồ sơ sẽ được khóa chỉnh sửa trực tiếp.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs text-[#4B5563] space-y-1">
              <p>
                • Khách hàng:{' '}
                <strong className="text-[#111827]">
                  {selectedCustomer?.name || contract?.customerName}
                </strong>
              </p>
              <p>
                • Giá trị:{' '}
                <strong className="text-[#16A34A]">{formatCurrency(contractValue, currency)}</strong>
              </p>
              <p>
                • Tệp đính kèm: <strong className="text-[#111827]">{attachments.length} tài liệu</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmitApproval}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
              >
                {isSubmitting ? 'Đang gửi trình duyệt...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
