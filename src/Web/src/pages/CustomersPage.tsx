import { useState } from "react";
import { CustomerWorkspace } from "../components/CustomerWorkspace";
import { Toast, type ToastData } from "../components/Toast";

export default function CustomersPage({ canManage: _canManage }: { canManage?: boolean }) {
  const [toast, setToast] = useState<ToastData | null>(null);

  return (
    <section className="page-enter">
      <CustomerWorkspace
        onBreadcrumbChange={() => {}}
        onNotify={setToast}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
