export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
}

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string | null;
  department?: DepartmentDto | null;
  roles: string[];
  permissions: string[];
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}

export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  statusName: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiProblem {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
