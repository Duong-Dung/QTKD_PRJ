import type { UserDto } from "../types/identity";

export interface MenuItem {
  id: string;
  label: string;
  section: string;
  icon: string;
  description: string;
  roles?: string[];
  permissions?: string[];
}

const menu: MenuItem[] = [
  {
    id: "overview",
    label: "Tổng quan",
    section: "Không gian làm việc",
    icon: "grid",
    description: "Bảng điều khiển hoạt động và lối tắt theo quyền của bạn.",
  },
  {
    id: "contracts",
    label: "Hợp đồng",
    section: "Kinh doanh",
    icon: "file",
    description: "Không gian quản lý hồ sơ hợp đồng, phụ lục và tiến trình phê duyệt.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER", "STAFF"],
    permissions: ["contracts.view", "contracts.create", "contract.read", "contract.create"],
  },
  {
    id: "customers",
    label: "Khách hàng",
    section: "Kinh doanh",
    icon: "users",
    description: "Tra cứu và quản lý hồ sơ khách hàng doanh nghiệp.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER", "STAFF"],
    permissions: ["customers.view", "customers.manage", "customer.read", "customer.create"],
  },
  {
    id: "pricing",
    label: "Biểu giá",
    section: "Kinh doanh",
    icon: "chart",
    description: "Không gian quản lý biểu giá dịch vụ logistics.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER"],
    permissions: ["pricing.manage"],
  },
  {
    id: "approvals",
    label: "Phê duyệt",
    section: "Vận hành",
    icon: "check",
    description: "Theo dõi các bước phê duyệt theo quy trình.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER"],
    permissions: ["workflow.approve", "workflow.read"],
  },
  {
    id: "production",
    label: "Sản lượng",
    section: "Vận hành",
    icon: "box",
    description: "Không gian theo dõi sản lượng khai thác cảng và kho bãi.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER", "STAFF"],
  },
  {
    id: "payments",
    label: "Thanh toán",
    section: "Vận hành",
    icon: "credit",
    description: "Không gian theo dõi đối soát và bảng thanh toán.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER"],
    permissions: ["payment.manage"],
  },
  {
    id: "users",
    label: "Người dùng",
    section: "Quản trị",
    icon: "userCog",
    description: "Danh sách tài khoản và phân quyền trong hệ thống.",
    roles: ["ADMIN", "MANAGER"],
    permissions: ["users.view", "users.manage", "user.manage"],
  },
  {
    id: "audit",
    label: "Nhật ký hệ thống",
    section: "Quản trị",
    icon: "activity",
    description: "Không gian theo dõi nhật ký kiểm toán và vận hành hệ thống.",
    roles: ["ADMIN"],
    permissions: ["audit.read"],
  },
];

export function getVisibleMenu(user: UserDto) {
  // Quản trị viên (ADMIN) luôn nhìn thấy tất cả các phân hệ
  if (user.roles?.includes("ADMIN")) {
    return menu;
  }

  return menu.filter((item) => {
    const hasRole =
      !item.roles || item.roles.some((role) => user.roles?.includes(role));
    const hasPermission =
      !item.permissions ||
      item.permissions.some((permission) =>
        user.permissions?.includes(permission),
      );
    // Nếu thuộc role hoặc có quyền thì cho phép hiển thị
    return hasRole || hasPermission;
  });
}

export function getMenuItem(id: string) {
  return menu.find((item) => item.id === id);
}
