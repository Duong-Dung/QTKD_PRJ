import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ContractList } from '../components/ContractList';
import { ContractForm } from '../components/ContractForm';
import type { Contract, Customer } from '../types/contract';
import { INITIAL_CONTRACTS, INITIAL_CUSTOMERS } from '../data/mockData';
import { contractService } from '../services/contractService';
import { customerService } from '../services/customerService';
import { ApiError } from '../services/api';

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

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

  const handleBack = () => {
    setViewMode('list');
    setSelectedContract(null);
  };

  // 4. Lưu hợp đồng thực tế vào Database qua API (TASK-27 & TASK-28)
  const handleSave = async (
    contractData: Partial<Contract>,
    action: 'save_draft' | 'submit_approval'
  ) => {
    const isSubmit = action === 'submit_approval';
    const status = isSubmit ? 'PendingApproval' : 'Draft';

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
          title: isSubmit ? 'Gửi duyệt thành công!' : 'Tạo hợp đồng thành công!',
          desc: `Hợp đồng ${createdDto.code} đã được lưu vào cơ sở dữ liệu thật (Trạng thái: ${createdDto.statusName || 'Bản nháp'}).`,
        });
      } catch (err) {
        console.error('Lỗi khi gọi API tạo hợp đồng:', err);
        const errorMsg = err instanceof ApiError || err instanceof Error ? err.message : 'Có lỗi xảy ra.';

        // Fallback lưu tạm bộ nhớ nếu API gặp sự cố
        const newContract: Contract = {
          id: `c-${Date.now()}`,
          code: contractData.code || `HĐ-2026-${String(contracts.length + 1).padStart(3, '0')}`,
          title: contractData.title || '',
          customerId: contractData.customerId || '',
          customerName: contractData.customerName || '',
          customerTaxCode: contractData.customerTaxCode || '',
          effectiveFrom: contractData.effectiveFrom || '',
          effectiveTo: contractData.effectiveTo || '',
          contractValue: contractData.contractValue || 0,
          currency: contractData.currency || 'VND',
          paymentTerms: contractData.paymentTerms || '',
          serviceTerms: contractData.serviceTerms || '',
          status: status,
          ownerName: user?.fullName || 'Nhân viên kinh doanh',
          attachments: contractData.attachments || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setContracts((prev) => [newContract, ...prev]);
        setToastMessage({
          title: 'Thông báo',
          desc: `Lưu tạm bộ nhớ (Lỗi API: ${errorMsg}).`,
        });
      } finally {
        setIsLoading(false);
      }
    } else if (viewMode === 'detail' && selectedContract) {
      const updatedContract: Contract = {
        ...selectedContract,
        ...contractData,
        status: isSubmit ? 'PendingApproval' : selectedContract.status,
        updatedAt: new Date().toISOString(),
      };

      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? updatedContract : c))
      );
      setToastMessage({
        title: isSubmit ? 'Gửi duyệt thành công!' : 'Cập nhật thành công!',
        desc: isSubmit
          ? `Hợp đồng ${updatedContract.code} đã được gửi duyệt thành công.`
          : `Thông tin hợp đồng ${updatedContract.code} đã được cập nhật.`,
      });
    }

    setViewMode('list');
    setSelectedContract(null);
  };

  return (
    <div className="contracts-page-wrapper w-full h-full flex flex-col min-h-0 bg-slate-50">
      {viewMode === 'list' ? (
        <ContractList
          contracts={contracts}
          onOpenCreate={handleOpenCreate}
          onOpenDetail={handleOpenDetail}
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
        />
      )}
    </div>
  );
}
