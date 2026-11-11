import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  UploadCloud,
  FileText,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { Contract, Customer, Attachment } from '../types/contract';

interface ContractFormProps {
  mode: 'create' | 'detail';
  contract?: Contract | null;
  customers: Customer[];
  onBack: () => void;
  onSave: (contractData: Partial<Contract>, action: 'save_draft' | 'submit_approval') => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  mode,
  contract,
  customers,
  onBack,
  onSave,
}) => {
  // Trạng thái cho phép chỉnh sửa: Mới tạo HOẶC đang ở Draft / RevisionRequested
  const isEditable = mode === 'create' || contract?.status === 'Draft' || contract?.status === 'RevisionRequested';

  // Form Fields
  const [code, setCode] = useState(contract?.code || (mode === 'create' ? 'HĐ-2026-025' : ''));
  const [title, setTitle] = useState(contract?.title || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(contract?.customerId || '');
  const [effectiveFrom, setEffectiveFrom] = useState(contract?.effectiveFrom || '');
  const [effectiveTo, setEffectiveTo] = useState(contract?.effectiveTo || '');
  const [contractValue, setContractValue] = useState<number>(contract?.contractValue || 0);
  const [currency, setCurrency] = useState(contract?.currency || 'VND');
  const [paymentTerms, setPaymentTerms] = useState(contract?.paymentTerms || '');
  const [serviceTerms, setServiceTerms] = useState(contract?.serviceTerms || '');
  const [attachments, setAttachments] = useState<Attachment[]>(contract?.attachments || []);

  // UI States
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Danh sách khách hàng chỉ lấy những khách hàng Active
  const activeCustomers = useMemo(() => {
    return customers.filter((c) => c.status === 'Active');
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return activeCustomers;
    const q = customerSearch.toLowerCase();
    return activeCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.taxCode.includes(q)
    );
  }, [activeCustomers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Kiểm tra điều kiện gửi duyệt
  const hasActiveCustomer = Boolean(selectedCustomer && selectedCustomer.status === 'Active');
  const hasValidDates = Boolean(
    effectiveFrom && effectiveTo && new Date(effectiveFrom) <= new Date(effectiveTo)
  );
  const hasMainDocument = Boolean(attachments.some((a) => a.isMainDocument));
  const canSubmitApproval = hasActiveCustomer && hasValidDates && hasMainDocument && contractValue >= 0;

  // Xử lý tải tệp mẫu
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles: Attachment[] = Array.from(e.target.files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      isMainDocument: attachments.length === 0 && idx === 0, // Tự động đánh dấu file đầu tiên là chính nếu chưa có
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleMainDoc = (id: string) => {
    if (!isEditable) return;
    setAttachments((prev) =>
      prev.map((att) => ({
        ...att,
        isMainDocument: att.id === id,
      }))
    );
  };

  const handleDeleteAttachment = (id: string) => {
    if (!isEditable) return;
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      // Nếu file bị xóa là file chính và còn file khác, chuyển file đầu tiên thành chính
      if (filtered.length > 0 && !filtered.some((a) => a.isMainDocument)) {
        filtered[0].isMainDocument = true;
      }
      return filtered;
    });
  };

  // Format số tiền VND
  const handleValueChange = (valStr: string) => {
    const rawVal = valStr.replace(/\D/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    setContractValue(num);
  };

  // Submit Handler
  const handleSubmit = (action: 'save_draft' | 'submit_approval') => {
    setErrorMessage(null);

    // Validate chung
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên hợp đồng.');
      return;
    }

    if (action === 'submit_approval') {
      if (!hasActiveCustomer) {
        setErrorMessage('Vui lòng chọn khách hàng đang hoạt động để gửi duyệt.');
        return;
      }
      if (!hasValidDates) {
        setErrorMessage('Thời gian hiệu lực không hợp lệ (Ngày bắt đầu phải trước hoặc bằng ngày kết thúc).');
        return;
      }
      if (!hasMainDocument) {
        setErrorMessage('Vui lòng chọn ít nhất một tệp đính kèm làm tài liệu chính trước khi gửi duyệt.');
        return;
      }
      if (contractValue < 0) {
        setErrorMessage('Giá trị hợp đồng không được âm.');
        return;
      }
    }

    const payload: Partial<Contract> = {
      code,
      title,
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || 'Khách hàng',
      customerTaxCode: selectedCustomer?.taxCode || '',
      effectiveFrom,
      effectiveTo,
      contractValue,
      currency,
      paymentTerms,
      serviceTerms,
      attachments,
    };

    onSave(payload, action);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
      {/* Top Header / Breadcrumb */}
      <div className="p-8 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-2 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Hợp đồng</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800">
            {mode === 'create' ? 'Tạo hợp đồng' : 'Chi tiết hợp đồng'}
          </span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === 'create' ? 'Tạo hợp đồng' : `Chi tiết hợp đồng: ${code}`}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'create'
                ? 'Khởi tạo hồ sơ và gửi phê duyệt hợp đồng với khách hàng.'
                : 'Hồ sơ hợp đồng đang ở trạng thái Bản nháp. Bạn có thể tiếp tục cập nhật thông tin và gửi phê duyệt.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/80 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
              {contract?.status === 'Approved'
                ? 'Đã phê duyệt'
                : contract?.status === 'PendingApproval'
                ? 'Chờ duyệt'
                : contract?.status === 'RevisionRequested'
                ? 'Yêu cầu chỉnh sửa'
                : 'Bản nháp'}
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-400">* Thông tin bắt buộc khi gửi duyệt</div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mx-8 mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Form Body */}
      <div className="p-8 pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        {/* Left Column: 4 Sections (Col-span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 01: Thông tin chung */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center space-x-3">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                01
              </span>
              <h2 className="text-base font-bold text-slate-900">Thông tin chung</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mã hợp đồng
                </label>
                <input
                  type="text"
                  value={code}
                  disabled={!isEditable}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: HĐ-2026-001"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên hợp đồng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  disabled={!isEditable}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên hợp đồng"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Khách hàng Dropdown with Search */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Khách hàng <span className="text-rose-500">*</span>
              </label>

              {isEditable ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    {selectedCustomer ? (
                      <span className="font-medium text-slate-800">
                        {selectedCustomer.name} ({selectedCustomer.code})
                      </span>
                    ) : (
                      <span className="text-slate-400">Chọn khách hàng đang hoạt động</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown Menu Box */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-30 p-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative mb-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Tìm tên khách hàng hoặc mã khách hàng..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {filteredCustomers.length} Khách hàng đang hoạt động
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {filteredCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setIsCustomerDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              selectedCustomerId === cust.id
                                ? 'bg-blue-50 text-blue-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-900">{cust.name}</div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {cust.code} - MST: {cust.taxCode}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium">
                  {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.code})` : '—'}
                </div>
              )}
            </div>
          </div>

          {/* Section 02: Thời gian và giá trị */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center space-x-3">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                02
              </span>
              <h2 className="text-base font-bold text-slate-900">Thời gian và giá trị</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ngày bắt đầu hiệu lực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  disabled={!isEditable}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ngày kết thúc hiệu lực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveTo}
                  disabled={!isEditable}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Giá trị hợp đồng
                </label>
                <input
                  type="text"
                  value={contractValue.toLocaleString('vi-VN')}
                  disabled={!isEditable}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 text-right font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Đơn vị tiền tệ
                </label>
                <select
                  value={currency}
                  disabled={!isEditable}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Ngày bắt đầu không sau ngày kết thúc. Giá trị hợp đồng ≥ 0.
            </div>
          </div>

          {/* Section 03: Điều khoản */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center space-x-3">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                03
              </span>
              <h2 className="text-base font-bold text-slate-900">Điều khoản</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Điều khoản thanh toán
                </label>
                <textarea
                  rows={4}
                  value={paymentTerms}
                  disabled={!isEditable}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Nhập thời hạn, hình thức thanh toán..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Điều khoản dịch vụ
                </label>
                <textarea
                  rows={4}
                  value={serviceTerms}
                  disabled={!isEditable}
                  onChange={(e) => setServiceTerms(e.target.value)}
                  placeholder="Nhập phạm vi và cam kết dịch vụ..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 04: Tệp đính kèm */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center space-x-3">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                04
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Tệp đính kèm</h2>
                <p className="text-xs text-slate-500">
                  Chọn một tệp làm tài liệu chính trước khi gửi duyệt.
                </p>
              </div>
            </div>

            {/* Dropzone Upload */}
            {isEditable && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-blue-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-slate-700">
                  Kéo thả tệp vào đây hoặc{' '}
                  <span className="text-blue-600 hover:underline">Chọn tệp</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  PDF, DOC, DOCX, XLS, XLSX • Tối đa 20 MB / tệp
                </div>
              </div>
            )}

            {/* Uploaded File List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">{att.fileName}</div>
                        <div className="text-slate-400 text-[11px]">
                          {(att.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {att.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {/* Checkbox / Radio Tệp chính */}
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="main_doc"
                          checked={att.isMainDocument}
                          disabled={!isEditable}
                          onChange={() => handleToggleMainDoc(att.id)}
                          className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`font-medium ${
                            att.isMainDocument ? 'text-blue-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          Tệp chính
                        </span>
                      </label>

                      {/* Xóa tệp */}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa tệp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cards (Col-span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Hồ sơ hợp đồng */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Hồ sơ hợp đồng
            </h3>

            <div>
              <div className="text-xs text-slate-500">Người phụ trách</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {contract?.ownerName || 'VAN PHU HIEU'}
              </div>
              <div className="text-[11px] text-slate-400">Tự động theo tài khoản đăng nhập</div>
            </div>

            <div className="pt-2">
              <div className="text-xs text-slate-500">Trạng thái hồ sơ</div>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                  {contract?.status === 'Approved'
                    ? 'Đã phê duyệt'
                    : contract?.status === 'PendingApproval'
                    ? 'Chờ duyệt'
                    : contract?.status === 'RevisionRequested'
                    ? 'Yêu cầu chỉnh sửa'
                    : 'Bản nháp'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Điều kiện gửi duyệt */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Điều kiện gửi duyệt</span>
            </div>

            <p className="text-xs text-slate-500">Vui lòng kiểm tra trước khi gửi:</p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasActiveCustomer ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                  }`}
                >
                  {hasActiveCustomer && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={hasActiveCustomer ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                  Khách hàng đang hoạt động
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasValidDates ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                  }`}
                >
                  {hasValidDates && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={hasValidDates ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                  Thời gian hiệu lực hợp lệ
                </span>
              </div>

              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    hasMainDocument ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                  }`}
                >
                  {hasMainDocument && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={hasMainDocument ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                  Có tệp chính được đánh dấu
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
              Lưu bản nháp để hoàn thiện sau.
            </div>

            <div className="p-3 bg-blue-50/60 rounded-lg text-[11px] text-slate-600 space-y-1 leading-relaxed">
              <div className="font-semibold text-blue-900">Lưu ý phê duyệt:</div>
              <p>
                Gửi duyệt sẽ chuyển hồ sơ sang trạng thái <strong>Chờ duyệt</strong>, không tự động phê duyệt.
              </p>
              <p>Chỉ được chỉnh sửa khi ở <strong>Bản nháp</strong> hoặc <strong>Yêu cầu chỉnh sửa</strong>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-40 shadow-lg">
        <div className="text-xs text-slate-500">
          {mode === 'create'
            ? 'Hồ sơ chưa được lưu'
            : `Đã lưu bản nháp: ${contract?.updatedAt ? new Date(contract.updatedAt).toLocaleTimeString('vi-VN') : 'Hôm nay'}`}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-colors"
          >
            {isEditable ? 'Hủy' : 'Quay lại'}
          </button>

          {isEditable && (
            <>
              <button
                type="button"
                onClick={() => handleSubmit('save_draft')}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-lg text-sm transition-colors"
              >
                {mode === 'create' ? 'Lưu bản nháp' : 'Cập nhật bản nháp'}
              </button>

              <button
                type="button"
                disabled={!canSubmitApproval}
                onClick={() => handleSubmit('submit_approval')}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-all shadow-sm shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Gửi duyệt</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
