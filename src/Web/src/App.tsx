import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ContractList } from './components/ContractList';
import { ContractForm } from './components/ContractForm';
import { INITIAL_CONTRACTS, INITIAL_CUSTOMERS } from './data/mockData';
import { Contract, Customer } from './types/contract';

export function App() {
  const [currentSidebarTab, setCurrentSidebarTab] = useState('contracts');
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Xử lý mở form Tạo hợp đồng
  const handleOpenCreate = () => {
    setSelectedContract(null);
    setView('create');
  };

  // Xử lý mở form Chi tiết / Chỉnh sửa hợp đồng
  const handleOpenDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setView('detail');
  };

  // Xử lý quay lại danh sách
  const handleBackToList = () => {
    setView('list');
    setSelectedContract(null);
  };

  // Xử lý Lưu bản nháp hoặc Gửi duyệt
  const handleSaveContract = (
    data: Partial<Contract>,
    action: 'save_draft' | 'submit_approval'
  ) => {
    const isSubmit = action === 'submit_approval';
    const status = isSubmit ? 'PendingApproval' : 'Draft';

    if (view === 'create') {
      // Tạo mới
      const newContract: Contract = {
        id: `c-${Date.now()}`,
        code: data.code || `HĐ-2026-${String(contracts.length + 1).padStart(3, '0')}`,
        title: data.title || '',
        customerId: data.customerId || '',
        customerName: data.customerName || '',
        customerTaxCode: data.customerTaxCode || '',
        effectiveFrom: data.effectiveFrom || '',
        effectiveTo: data.effectiveTo || '',
        contractValue: data.contractValue || 0,
        currency: data.currency || 'VND',
        paymentTerms: data.paymentTerms || '',
        serviceTerms: data.serviceTerms || '',
        status: status,
        ownerName: 'VAN PHU HIEU',
        attachments: data.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setContracts((prev) => [newContract, ...prev]);

      if (isSubmit) {
        setToastMessage({
          title: 'Hồ sơ đã được gửi phê duyệt',
          desc: `Hợp đồng ${newContract.code} đã được chuyển sang trạng thái Chờ duyệt.`,
        });
      } else {
        setToastMessage({
          title: 'Đã lưu hợp đồng ở trạng thái Bản nháp',
          desc: 'Bạn có thể tiếp tục chỉnh sửa và gửi duyệt sau.',
        });
      }
    } else if (view === 'detail' && selectedContract) {
      // Cập nhật hợp đồng hiện có
      const updatedList = contracts.map((c) => {
        if (c.id === selectedContract.id) {
          return {
            ...c,
            ...data,
            status: status,
            updatedAt: new Date().toISOString(),
          } as Contract;
        }
        return c;
      });

      setContracts(updatedList);

      if (isSubmit) {
        setToastMessage({
          title: 'Hồ sơ đã được gửi phê duyệt',
          desc: `Hợp đồng ${selectedContract.code} đã được chuyển sang trạng thái Chờ duyệt.`,
        });
      } else {
        setToastMessage({
          title: 'Đã cập nhật bản nháp thành công',
          desc: 'Các thay đổi của bạn đã được lưu vào hệ thống.',
        });
      }
    }

    setView('list');
    setSelectedContract(null);

    // Tự động tắt toast sau 6 giây
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentSidebarTab}
        onSelectTab={(tabId) => {
          setCurrentSidebarTab(tabId);
          if (tabId === 'contracts') {
            setView('list');
          }
        }}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <Header
          breadcrumbs={[
            'Quản lý kinh doanh',
            view === 'list'
              ? 'Hợp đồng'
              : view === 'create'
              ? 'Tạo hợp đồng'
              : `Chi tiết: ${selectedContract?.code || 'Hợp đồng'}`,
          ]}
        />

        {/* View Switcher */}
        {view === 'list' ? (
          <ContractList
            contracts={contracts}
            onOpenCreate={handleOpenCreate}
            onOpenDetail={handleOpenDetail}
            toastMessage={toastMessage}
            onCloseToast={() => setToastMessage(null)}
          />
        ) : (
          <ContractForm
            mode={view}
            contract={selectedContract}
            customers={customers}
            onBack={handleBackToList}
            onSave={handleSaveContract}
          />
        )}
      </div>
    </div>
  );
}

export default App;
