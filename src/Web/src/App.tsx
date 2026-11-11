import { useCallback, useState } from 'react';
import { Layers } from 'lucide-react';
import { Sidebar, SIDEBAR_MENU_ITEMS } from './components/Sidebar';
import { Header } from './components/Header';
import { CustomerWorkspace } from './components/CustomerWorkspace';
import { Toast, ToastData } from './components/Toast';

export function App() {
  const [currentTab, setCurrentTab] = useState('customers');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([
    'Trang chủ',
    'Khách hàng',
    'Danh sách khách hàng',
  ]);
  const [toast, setToast] = useState<ToastData | null>(null);

  const handleSelectTab = useCallback((tabId: string) => {
    setCurrentTab(tabId);
    if (tabId !== 'customers') {
      const label = SIDEBAR_MENU_ITEMS.find((m) => m.id === tabId)?.label ?? tabId;
      setBreadcrumbs(['Trang chủ', label]);
    }
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F3F4F6] text-[#111827]">
      <Sidebar currentTab={currentTab} onSelectTab={handleSelectTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header breadcrumbs={breadcrumbs} />

        <main className="flex-1 p-6 lg:p-8">
          {currentTab === 'customers' ? (
            <CustomerWorkspace
              onBreadcrumbChange={setBreadcrumbs}
              onNotify={setToast}
            />
          ) : (
            <div className="max-w-[1200px] mx-auto bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-[#111827]">
                Phân hệ{' '}
                {SIDEBAR_MENU_ITEMS.find((m) => m.id === currentTab)?.label ?? currentTab}{' '}
                đang được tích hợp
              </h2>
              <p className="text-sm text-[#4B5563] max-w-md mx-auto">
                Phân hệ Khách hàng (TASK-23) đã sẵn sàng kết nối trực tiếp với Backend API.
              </p>
              <button
                type="button"
                onClick={() => handleSelectTab('customers')}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1E3A8A] text-white text-sm font-semibold transition-colors"
              >
                Quay về Khách hàng
              </button>
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} onClose={handleCloseToast} />
    </div>
  );
}

export default App;
