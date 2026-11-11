export type CustomerStatusCode = 0 | 1;
export type CustomerStatusName = 'Active' | 'Suspended';

export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName: string;
  representativeTitle: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: CustomerStatusCode | CustomerStatusName;
  statusName: CustomerStatusName;
  suspendedReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateCustomerRequest {
  code: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName: string;
  representativeTitle?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface UpdateCustomerRequest {
  name: string;
  taxCode: string;
  address: string;
  representativeName: string;
  representativeTitle?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface UpdateCustomerStatusRequest {
  status: CustomerStatusCode;
  reason?: string | null;
}

export interface GetCustomersQuery {
  searchTerm?: string;
  status?: CustomerStatusName | '';
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

export interface CustomerFormValues {
  code: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName: string;
  representativeTitle: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  status: CustomerStatusName;
  suspendedReason: string;
}

export type CustomerFieldName = keyof CustomerFormValues;
export type CustomerFieldErrors = Partial<Record<CustomerFieldName, string>>;

export function normalizeCustomerStatus(
  status: CustomerStatusCode | CustomerStatusName | number | string,
  statusName?: string
): CustomerStatusName {
  if (statusName === 'Suspended' || status === 1 || status === 'Suspended') {
    return 'Suspended';
  }
  return 'Active';
}

export function toCustomerStatusCode(status: CustomerStatusName): CustomerStatusCode {
  return status === 'Suspended' ? 1 : 0;
}
