import { useEffect, useState } from "react";
import { ApiError, getCustomers } from "../services/api";
import type { CustomerDto, PagedResult } from "../types/identity";
import { Icon } from "../components/Icon";

export default function CustomersPage({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<PagedResult<CustomerDto> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      getCustomers(search, page)
        .then((data) => {
          if (active) {
            setResult(data);
            setError("");
          }
        })
        .catch((requestError: unknown) => {
          if (active) {
            setError(
              requestError instanceof ApiError
                ? requestError.message
                : "Không thể tải danh sách khách hàng.",
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, page, reloadKey]);

  return (
    <section className="page-enter">
      <div className="page-heading page-heading--split">
        <div><div className="breadcrumbs-inline">Kinh doanh <Icon name="chevron" size={13} /> Khách hàng</div><h1>Khách hàng</h1><p>Quản lý và tra cứu hồ sơ khách hàng doanh nghiệp.</p></div>
        {canManage && <button type="button" className="button button--primary" disabled title="Chức năng tạo mới sẽ được bổ sung cùng biểu mẫu khách hàng"><Icon name="plus" size={17} /> Thêm khách hàng</button>}
      </div>
      <div className="data-toolbar">
        <label className="table-search"><Icon name="search" size={18} /><input aria-label="Tìm khách hàng" placeholder="Tìm theo mã, tên công ty, mã số thuế..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        <span className="table-total">{result?.totalCount ?? "—"} khách hàng</span>
      </div>
      {error && <div className="form-alert table-alert" role="alert"><span className="alert-icon">!</span><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)}>Thử lại</button></div>}
      <div className="table-card">
        <div className="table-scroll"><table>
          <thead><tr><th>MÃ KHÁCH HÀNG</th><th>TÊN DOANH NGHIỆP</th><th>MÃ SỐ THUẾ</th><th>ĐẠI DIỆN</th><th>TRẠNG THÁI</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6}><div className="table-loading"><span className="button-spinner button-spinner--dark" /> Đang tải danh sách…</div></td></tr>
              : result?.items.length ? result.items.map((customer) => (
                <tr key={customer.id}><td><span className="customer-code">{customer.code}</span></td><td><strong className="customer-name">{customer.name}</strong><span className="customer-address">{customer.address}</span></td><td>{customer.taxCode || "—"}</td><td>{customer.representativeName || "—"}</td><td><span className={`status-pill ${customer.statusName.toLowerCase() === "active" ? "status-pill--active" : "status-pill--inactive"}`}><i />{customer.statusName === "Active" ? "Đang hoạt động" : customer.statusName === "Suspended" ? "Tạm ngưng" : customer.statusName}</span></td><td><button className="icon-button row-action" aria-label={`Xem ${customer.name}`}><Icon name="chevron" size={17} /></button></td></tr>
              ))
              : !error && <tr><td colSpan={6}><div className="table-empty"><span className="placeholder-icon"><Icon name="users" /></span><strong>{search ? "Không tìm thấy khách hàng" : "Chưa có dữ liệu khách hàng"}</strong><span>{search ? "Thử một từ khóa khác để tìm hồ sơ." : "Danh sách sẽ hiển thị tại đây khi có dữ liệu."}</span></div></td></tr>}
          </tbody>
        </table></div>
        <div className="table-pagination"><span>Trang {result?.pageIndex ?? page} / {result?.totalPages || 1}</span><div><button type="button" disabled={!result?.pageIndex || result.pageIndex <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</button><button type="button" disabled={!result?.totalPages || page >= result.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Tiếp theo</button></div></div>
      </div>
    </section>
  );
}
