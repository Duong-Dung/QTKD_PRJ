export type ContractStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'PendingApproval'
  | 'RevisionRequested'
  | 'Approved'
  | 'Active'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired'
  | 'Superseded';

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
  rawFile?: File;
  checksum?: string;
}

export interface Contract {
  id: string;
  code: string;
  title: string;
  contractType?: string;
  customerId: string;
  customerName: string;
  customerTaxCode: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string;   // YYYY-MM-DD
  contractValue: number;
  currency: string;
  paymentTerms: string;
  paymentTermDays?: number | string;
  paymentCycle?: string;
  serviceTerms: string;
  status: ContractStatus;
  ownerName: string;
  ownerId?: string;
  currentAssignee?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string;
}
