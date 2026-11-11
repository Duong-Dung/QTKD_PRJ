import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ContractList } from '../components/ContractList';
import { ContractForm } from '../components/ContractForm';
import type { Contract } from '../types/contract';
import { INITIAL_CONTRACTS, INITIAL_CUSTOMERS } from '../data/mockData';

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [customers] = useState(INITIAL_CUSTOMERS);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setViewMode('create');
  };

  const handleOpenDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedContract(null);
  };

  const handleSave = (
    contractData: Partial<Contract>,
    action: 'save_draft' | 'submit_approval'
  ) => {
    const isSubmit = action === 'submit_approval';
    const status = isSubmit ? 'PendingApproval' : 'Draft';

    if (viewMode === 'create') {
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
        title: isSubmit ? 'Gửi duyệt thành công!' : 'Lưu bản nháp thành công!',
        desc: isSubmit
          ? `Hợp đồng ${newContract.code} đã được chuyển sang trạng thái Chờ duyệt.`
          : `Hợp đồng ${newContract.code} đã được lưu dưới dạng Bản nháp.`,
      });
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
