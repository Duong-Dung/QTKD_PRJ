import { apiRequest } from './api';
import type { PagedResult } from '../types/identity';
import type { Attachment, Contract, ContractStatus } from '../types/contract';

export interface BackendContractDto {
  id: string;
  code: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  title: string;
  effectiveFrom: string;
  effectiveTo: string;
  contractValue: number;
  currency: string;
  paymentTerms?: string;
  serviceTerms?: string;
  status: number | string;
  statusName?: string;
  ownerUserId?: string;
  revisionOfContractId?: string;
  cancelledReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttachmentResponse {
  id: string;
  contractId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksum?: string;
  isMainDocument: boolean;
  createdAt: string;
}

export interface CreateContractPayload {
  code?: string;
  customerId: string;
  title: string;
  effectiveFrom: string;
  effectiveTo: string;
  contractValue: number;
  currency?: string;
  paymentTerms?: string;
  serviceTerms?: string;
  ownerUserId?: string;
}

export interface GetContractsFilter {
  keyword?: string;
  searchTerm?: string;
  status?: string;
  customerId?: string;
  pageIndex?: number;
  pageSize?: number;
}

const STATUS_MAP: Record<number, ContractStatus> = {
  0: 'Draft',
  1: 'Draft',
  2: 'Approved',
  3: 'Approved',
  4: 'Draft',
  5: 'Draft',
  6: 'RevisionRequested',
  7: 'PendingApproval',
};

export function parseContractStatus(status: number | string | undefined, statusName?: string): ContractStatus {
  if (statusName && ['Draft', 'PendingApproval', 'Approved', 'RevisionRequested'].includes(statusName)) {
    return statusName as ContractStatus;
  }
  if (typeof status === 'number') {
    return STATUS_MAP[status] || 'Draft';
  }
  if (typeof status === 'string' && ['Draft', 'PendingApproval', 'Approved', 'RevisionRequested'].includes(status)) {
    return status as ContractStatus;
  }
  return 'Draft';
}

export function mapBackendDtoToContract(dto: BackendContractDto, attachments: Attachment[] = []): Contract {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    customerId: dto.customerId,
    customerName: dto.customerName || 'Khách hàng',
    customerTaxCode: dto.customerCode || '',
    effectiveFrom: dto.effectiveFrom,
    effectiveTo: dto.effectiveTo,
    contractValue: dto.contractValue,
    currency: dto.currency || 'VND',
    paymentTerms: dto.paymentTerms || '',
    serviceTerms: dto.serviceTerms || '',
    status: parseContractStatus(dto.status, dto.statusName),
    ownerName: 'Cán bộ phụ trách',
    ownerId: dto.ownerUserId,
    attachments,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapAttachmentResponseToAttachment(res: AttachmentResponse): Attachment {
  return {
    id: res.id,
    fileName: res.fileName,
    contentType: res.contentType,
    sizeBytes: res.sizeBytes,
    isMainDocument: res.isMainDocument,
    uploadedAt: res.createdAt.replace('T', ' ').substring(0, 16),
    checksum: res.checksum,
  };
}

export const contractService = {
  async getContracts(filter: GetContractsFilter = {}): Promise<PagedResult<Contract>> {
    const params = new URLSearchParams();
    const searchVal = filter.keyword?.trim() || filter.searchTerm?.trim();
    if (searchVal) params.set('keyword', searchVal);
    if (filter.status && filter.status !== 'all') params.set('status', filter.status);
    if (filter.customerId) params.set('customerId', filter.customerId);
    params.set('pageIndex', String(filter.pageIndex ?? 1));
    params.set('pageSize', String(filter.pageSize ?? 50));

    const pagedDto = await apiRequest<PagedResult<BackendContractDto>>(
      `/api/v1/contracts?${params.toString()}`
    );

    return {
      items: pagedDto.items.map((dto) => mapBackendDtoToContract(dto)),
      pageIndex: pagedDto.pageIndex,
      pageSize: pagedDto.pageSize,
      totalCount: pagedDto.totalCount,
      totalPages: pagedDto.totalPages,
    };
  },

  async getContractById(id: string): Promise<Contract> {
    const dto = await apiRequest<BackendContractDto>(`/api/v1/contracts/${id}`);
    let attachments: Attachment[] = [];
    try {
      attachments = await contractService.getAttachments(id);
    } catch {
      // Bỏ qua nếu chưa nạp được attachments
    }
    return mapBackendDtoToContract(dto, attachments);
  },

  async createContract(payload: CreateContractPayload): Promise<BackendContractDto> {
    return apiRequest<BackendContractDto>('/api/v1/contracts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async uploadAttachment(contractId: string, file: File, isMainDocument: boolean): Promise<AttachmentResponse> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('IsMainDocument', String(isMainDocument));

    return apiRequest<AttachmentResponse>(`/api/v1/contracts/${contractId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  },

  async getAttachments(contractId: string): Promise<Attachment[]> {
    const list = await apiRequest<AttachmentResponse[]>(`/api/v1/contracts/${contractId}/attachments`);
    return list.map(mapAttachmentResponseToAttachment);
  },
};
