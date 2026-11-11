export type ContractStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'RevisionRequested';

export interface Customer {
  id: string;
  code: string;
  name: string;
  taxCode: string;
  status: 'Active' | 'Suspended';
}

export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  isMainDocument: boolean;
  uploadedAt: string;
}

export interface Contract {
  id: string;
  code: string;
  title: string;
  customerId: string;
  customerName: string;
  customerTaxCode: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string;   // YYYY-MM-DD
  contractValue: number;
  currency: string;
  paymentTerms: string;
  serviceTerms: string;
  status: ContractStatus;
  ownerName: string;
  ownerId?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string;
}
