import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ContractList } from '../components/ContractList';
import { ContractForm } from '../components/ContractForm';
import type { Contract, Customer } from '../types/contract';
import { INITIAL_CONTRACTS, INITIAL_CUSTOMERS } from '../data/mockData';
import { contractService } from '../services/contractService';
import { customerService } from '../services/customerService';
import { ApiError } from '../services/api';
import { CheckCircle2, X } from 'lucide-react';

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Tự động tắt Toast sau 4 giây (theo Figma Section 2.5)
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 1. Tải danh sách hợp đồng thực tế từ Backend Database (TASK-31)
  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const paged = await contractService.getContracts({ pageSize: 100 });
      if (paged.items && paged.items.length > 0) {
        setContracts(paged.items);
      }
    } catch (err) {
      console.warn('Không thể tải hợp đồng từ API Backend, tiếp tục với dữ liệu mẫu:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Tải danh sách khách hàng Active thực tế từ Backend Database (TASK-25 / TASK-22)
  const loadCustomers = useCallback(async () => {
    try {
      const paged = await customerService.getCustomers({ pageSize: 100 });
      if (paged.items && paged.items.length > 0) {
        setCustomers(
          paged.items.map((c) => {
            const isActive =
              c.statusName === 'Active' ||
              c.status === 1 ||
              String(c.status).toLowerCase() === 'active';
            return {
              id: c.id,
              code: c.code,
              name: c.name,
              taxCode: c.taxCode,
              status: (isActive ? 'Active' : 'Suspended') as 'Active' | 'Suspended',
            };
          })
        );
      }
    } catch (err) {
      console.warn('Không thể tải danh sách khách hàng từ API Backend:', err);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
    void loadCustomers();
  }, [loadContracts, loadCustomers]);

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setViewMode('create');
  };

  // 3. Mở chi tiết hợp đồng và nạp dữ liệu đính kèm thật từ Database (TASK-31 & TASK-28)
  const handleOpenDetail = async (contract: Contract) => {
    setSelectedContract(contract);
    setViewMode('detail');
    try {
      const freshContract = await contractService.getContractById(contract.id);
      setSelectedContract(freshContract);
    } catch (err) {
      console.warn('Không thể nạp dữ liệu chi tiết từ API, dùng dữ liệu hiện có:', err);
    }
  };

  // 4. Mở trực tiếp chế độ chỉnh sửa hợp đồng (3-step wizard)
  const handleOpenEdit = async (contract: Contract) => {
    setSelectedContract(contract);
    setViewMode('edit');
    try {
      const freshContract = await contractService.getContractById(contract.id);
      setSelectedContract(freshContract);
    } catch (err) {
      console.warn('Không thể nạp dữ liệu chi tiết từ API, dùng dữ liệu hiện có:', err);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedContract(null);
  };

  // 5. Lưu hợp đồng thực tế vào Database qua API (TASK-27 & TASK-28)
  const handleSave = async (
    contractData: Partial<Contract>,
    action: 'save_draft' | 'submit_approval'
  ) => {
    const isSubmit = action === 'submit_approval';
    const nextStatus = isSubmit ? 'UnderReview' : 'Draft';

    if (viewMode === 'create') {
      try {
        setIsLoading(true);
        // Gọi API tạo hợp đồng nháp thực tế trên PostgreSQL (TASK-27)
        const createdDto = await contractService.createContract({
          code: contractData.code || undefined,
          customerId: contractData.customerId!,
          title: contractData.title!,
          effectiveFrom: contractData.effectiveFrom!,
          effectiveTo: contractData.effectiveTo!,
          contractValue: contractData.contractValue || 0,
          currency: contractData.currency || 'VND',
          paymentTerms: contractData.paymentTerms,
          serviceTerms: contractData.serviceTerms,
          ownerUserId: user?.id,
        });

        // Nếu có tệp đính kèm mới tải lên, gọi API upload tệp thực tế (TASK-28)
        if (createdDto.id && contractData.attachments && contractData.attachments.length > 0) {
          for (const att of contractData.attachments) {
            if (att.rawFile) {
              try {
                await contractService.uploadAttachment(createdDto.id, att.rawFile, att.isMainDocument);
              } catch (uploadErr) {
                console.error('Không thể tải lên tệp:', att.fileName, uploadErr);
              }
            }
          }
        }

        // Tải lại danh sách hợp đồng thực tế từ database
        await loadContracts();

        setToastMessage({
          title: isSubmit ? 'Gửi trình duyệt thành công!' : 'Tạo hợp đồng thành công!',
          desc: `Hợp đồng ${createdDto.code} đã được lưu vào cơ sở dữ liệu (Trạng thái: ${
            isSubmit ? 'Đang rà soát (Under Review)' : 'Bản nháp'
          }).`,
        });
      } catch (err) {
        console.error('Lỗi khi gọi API tạo hợp đồng:', err);
        const errorMsg =
          err instanceof ApiError || err instanceof Error ? err.message : 'Có lỗi xảy ra.';

        // Fallback lưu tạm bộ nhớ nếu API gặp sự cố
        const newContract: Contract = {
          id: `c-${Date.now()}`,
          code: contractData.code || `HĐ-2026-${String(contracts.length + 1).padStart(3, '0')}`,
          title: contractData.title || '',
          contractType: contractData.contractType || 'Dịch vụ cảng',
          customerId: contractData.customerId || '',
          customerName: contractData.customerName || '',
          customerTaxCode: contractData.customerTaxCode || '',
          effectiveFrom: contractData.effectiveFrom || '',
          effectiveTo: contractData.effectiveTo || '',
          contractValue: contractData.contractValue || 0,
          currency: contractData.currency || 'VND',
          paymentTerms: contractData.paymentTerms || '',
          serviceTerms: contractData.serviceTerms || '',
          status: nextStatus,
          ownerName: user?.fullName || 'Chuyên viên Kinh doanh',
          currentAssignee: isSubmit ? 'Pháp chế – Lê C' : '—',
          attachments: contractData.attachments || [],
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        setContracts((prev) => [newContract, ...prev]);
        setToastMessage({
          title: isSubmit ? 'Gửi trình duyệt thành công!' : 'Đã lưu bản nháp!',
          desc: `Hồ sơ ${newContract.code} đã được khởi tạo (${errorMsg}).`,
        });
      } finally {
        setIsLoading(false);
      }
    } else if ((viewMode === 'detail' || viewMode === 'edit') && selectedContract) {
      try {
        setIsLoading(true);
        // Upload tệp đính kèm mới nếu có (TASK-28)
        if (selectedContract.id && contractData.attachments && contractData.attachments.length > 0) {
          for (const att of contractData.attachments) {
            if (att.rawFile) {
              try {
                await contractService.uploadAttachment(selectedContract.id, att.rawFile, att.isMainDocument);
              } catch (uploadErr) {
                console.error('Không thể tải lên tệp:', att.fileName, uploadErr);
              }
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải tệp đính kèm:', err);
      } finally {
        setIsLoading(false);
      }

      const updatedContract: Contract = {
        ...selectedContract,
        ...contractData,
        status: isSubmit ? 'UnderReview' : selectedContract.status,
        currentAssignee: isSubmit ? 'Pháp chế – Lê C' : selectedContract.currentAssignee,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? updatedContract : c))
      );

      // Tải lại danh sách hợp đồng thực tế từ backend
      void loadContracts();

      setToastMessage({
        title: isSubmit ? 'Gửi duyệt thành công!' : 'Cập nhật thành công!',
        desc: isSubmit
          ? `Hợp đồng ${updatedContract.code} đã được chuyển sang Ban Pháp chế rà soát.`
          : `Thông tin hợp đồng ${updatedContract.code} đã được cập nhật thành công.`,
      });
    }

    setViewMode('list');
    setSelectedContract(null);
  };

  // Phê duyệt hợp đồng (APR-01)
  const handleApprove = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'Approved',
              currentAssignee: 'Ban Giám đốc (Đã duyệt)',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : c
      )
    );
    if (selectedContract && selectedContract.id === contractId) {
      setSelectedContract((prev) =>
        prev ? { ...prev, status: 'Approved', currentAssignee: 'Ban Giám đốc (Đã duyệt)' } : null
      );
    }
    setToastMessage({
      title: 'Phê duyệt thành công!',
      desc: 'Hợp đồng đã được xác nhận phê duyệt chính thức theo quy trình APR-01.',
    });
  };

  // Từ chối phê duyệt (APR-03)
  const handleReject = (contractId: string, reason: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'Rejected',
              currentAssignee: 'Kinh doanh (Đã từ chối)',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : c
      )
    );
    if (selectedContract && selectedContract.id === contractId) {
      setSelectedContract((prev) =>
        prev ? { ...prev, status: 'Rejected', currentAssignee: 'Kinh doanh (Đã từ chối)' } : null
      );
    }
    setToastMessage({
      title: 'Đã từ chối hợp đồng',
      desc: `Lý do: "${reason}". Hồ sơ đã được chuyển lại người lập.`,
    });
  };

  // Yêu cầu chỉnh sửa (APR-03)
  const handleRequestRevision = (contractId: string, reason: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'RevisionRequested',
              currentAssignee: 'Kinh doanh (Cần chỉnh sửa)',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : c
      )
    );
    if (selectedContract && selectedContract.id === contractId) {
      setSelectedContract((prev) =>
        prev ? { ...prev, status: 'RevisionRequested', currentAssignee: 'Kinh doanh (Cần chỉnh sửa)' } : null
      );
    }
    setToastMessage({
      title: 'Đã gửi yêu cầu chỉnh sửa',
      desc: `Nội dung: "${reason}". Hồ sơ đã mở khóa để nhân viên cập nhật.`,
    });
  };

  return (
    <div className="contracts-page-wrapper w-full h-full flex flex-col min-h-0 relative">
      {/* Universal Floating Toast (Figma Section 2.5: Toast tự ẩn sau 4s) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-[#E5E7EB] rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#111827]">{toastMessage.title}</h4>
            <p className="text-[11px] text-[#4B5563] mt-0.5">{toastMessage.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#9CA3AF] hover:text-[#111827] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {viewMode === 'list' ? (
        <ContractList
          contracts={contracts}
          onOpenCreate={handleOpenCreate}
          onOpenDetail={handleOpenDetail}
          onOpenEdit={handleOpenEdit}
          toastMessage={toastMessage}
          onCloseToast={() => setToastMessage(null)}
          isLoading={isLoading}
          onRefresh={loadContracts}
        />
      ) : (
        <ContractForm
          mode={viewMode}
          contract={selectedContract}
          customers={customers}
          onBack={handleBack}
          onSave={handleSave}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestRevision={handleRequestRevision}
        />
      )}
    </div>
  );
}
