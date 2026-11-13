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
    id: "customers",
    label: "Khách hàng",
    section: "Kinh doanh",
    icon: "users",
    description: "Tra cứu hồ sơ khách hàng doanh nghiệp.",
    permissions: ["customers.view", "customer.read", "customer.manage"],
  },
  {
    id: "contracts",
    label: "Hợp đồng",
    section: "Kinh doanh",
    icon: "file",
    description: "Không gian quản lý hợp đồng và phụ lục.",
    permissions: ["contracts.view", "contract.read", "contract.create"],
  },
  {
    id: "pricing",
    label: "Biểu giá",
    section: "Kinh doanh",
    icon: "chart",
    description: "Không gian quản lý biểu giá dịch vụ logistics.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER"],
  },
  {
    id: "approvals",
    label: "Phê duyệt",
    section: "Vận hành",
    icon: "check",
    description: "Theo dõi các bước phê duyệt theo quy trình.",
    permissions: ["workflow.approve"],
  },
  {
    id: "production",
    label: "Sản lượng",
    section: "Vận hành",
    icon: "box",
    description: "Không gian theo dõi sản lượng khai thác.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER", "STAFF"],
  },
  {
    id: "payments",
    label: "Thanh toán",
    section: "Vận hành",
    icon: "credit",
    description: "Không gian theo dõi đối soát và thanh toán.",
    roles: ["ADMIN", "DIRECTOR", "MANAGER"],
  },
  {
    id: "users",
    label: "Người dùng",
    section: "Quản trị",
    icon: "userCog",
    description: "Danh sách tài khoản trong hệ thống.",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "audit",
    label: "Nhật ký hệ thống",
    section: "Quản trị",
    icon: "activity",
    description: "Không gian theo dõi nhật ký vận hành hệ thống.",
    roles: ["ADMIN"],
  },
];

export function getVisibleMenu(user: UserDto) {
  if (user.roles.includes("ADMIN")) {
    return menu;
  }

  return menu.filter((item) => {
    const hasRole =
      !item.roles || item.roles.some((role) => user.roles.includes(role));
    const hasPermission =
      !item.permissions ||
      item.permissions.some((permission) =>
        user.permissions.includes(permission),
      );
    return hasRole && hasPermission;
  });
}

export function getMenuItem(id: string) {
  return menu.find((item) => item.id === id);
}
