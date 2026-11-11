import { UserDto } from '../types/identity';

export const DEMO_USERS: Record<string, UserDto> = {
  admin: {
    id: '019318a0-0100-7000-8000-000000000100',
    username: 'admin',
    fullName: 'Nguyễn Quản Trị',
    email: 'admin@qtkd.com',
    phone: '0901000001',
    department: {
      id: '019318a0-0006-7000-8000-000000000006',
      code: 'QT',
      name: 'Phòng Quản trị hệ thống',
    },
    roles: ['ADMIN'],
    permissions: [
      'contract.create', 'contract.read', 'contract.update', 'contract.submit', 'contract.approve', 'contract.reject', 'contract.cancel',
      'customer.create', 'customer.read', 'customer.update', 'customer.manage',
      'workflow.read', 'workflow.approve', 'workflow.reject', 'workflow.configure',
      'user.manage', 'role.manage', 'audit.read', 'pricing.manage', 'payment.manage',
      'users.view', 'users.manage', 'customers.view', 'customers.manage', 'contracts.view',
    ],
  },
  giamdoc: {
    id: '019318a0-0200-7000-8000-000000000200',
    username: 'giamdoc',
    fullName: 'Trần Giám Đốc',
    email: 'director@qtkd.com',
    phone: '0902000002',
    department: {
      id: '019318a0-0001-7000-8000-000000000001',
      code: 'BGD',
      name: 'Ban Giám đốc',
    },
    roles: ['DIRECTOR'],
    permissions: [
      'contract.read', 'contract.approve', 'contract.reject', 'contract.cancel',
      'customer.read', 'customers.view',
      'workflow.read', 'workflow.approve', 'workflow.reject',
      'audit.read', 'pricing.manage', 'payment.manage', 'contracts.view',
    ],
  },
  tp_kinhdoanh: {
    id: '019318a0-0300-7000-8000-000000000300',
    username: 'tp_kinhdoanh',
    fullName: 'Lê Trưởng Kinh Doanh',
    email: 'manager.kd@qtkd.com',
    phone: '0903000003',
    department: {
      id: '019318a0-0002-7000-8000-000000000002',
      code: 'KD',
      name: 'Phòng Kinh doanh',
    },
    roles: ['MANAGER'],
    permissions: [
      'contract.create', 'contract.read', 'contract.update', 'contract.submit', 'contract.approve', 'contract.reject',
      'customer.create', 'customer.read', 'customer.update', 'customers.view', 'customers.manage',
      'workflow.read', 'workflow.approve', 'workflow.reject', 'pricing.manage', 'payment.manage', 'contracts.view',
    ],
  },
  nv_kinhdoanh: {
    id: '019318a0-0400-7000-8000-000000000400',
    username: 'nv_kinhdoanh',
    fullName: 'Phạm Nhân Viên KD',
    email: 'staff.kd@qtkd.com',
    phone: '0904000004',
    department: {
      id: '019318a0-0002-7000-8000-000000000002',
      code: 'KD',
      name: 'Phòng Kinh doanh',
    },
    roles: ['STAFF'],
    permissions: [
      'contract.create', 'contract.read', 'contract.update', 'contract.submit',
      'customer.create', 'customer.read', 'customer.update', 'customers.view',
      'workflow.read', 'contracts.view',
    ],
  },
};

export function getFallbackDemoUser(input: string): UserDto {
  const normalized = input.trim().toLowerCase();
  if (normalized in DEMO_USERS) {
    return DEMO_USERS[normalized];
  }
  // Nếu tìm theo email
  const byEmail = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === normalized);
  if (byEmail) return byEmail;

  // Fallback mặc định
  return DEMO_USERS.admin;
}
