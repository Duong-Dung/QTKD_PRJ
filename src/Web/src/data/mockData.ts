import { Contract, Customer } from '../types/contract';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '0192f000-0000-7000-8000-000000000001',
    code: 'KH-001',
    name: 'Công ty CP Thương mại An Phát',
    taxCode: '0101234567',
    status: 'Active',
  },
  {
    id: '0192f000-0000-7000-8000-000000000002',
    code: 'KH-002',
    name: 'Công ty TNHH Minh Long',
    taxCode: '0309876543',
    status: 'Active',
  },
  {
    id: '0192f000-0000-7000-8000-000000000003',
    code: 'KH-003',
    name: 'Công ty CP Sơn Hà',
    taxCode: '0105556677',
    status: 'Active',
  },
  {
    id: '0192f000-0000-7000-8000-000000000004',
    code: 'KH-004',
    name: 'Công ty TNHH Đại Dương',
    taxCode: '0204448899',
    status: 'Active',
  },
  {
    id: '0192f000-0000-7000-8000-000000000005',
    code: 'KH-005',
    name: 'Công ty CP Thép Việt',
    taxCode: '0311223344',
    status: 'Active',
  },
  {
    id: '0192f000-0000-7000-8000-000000000006',
    code: 'KH-006',
    name: 'Công ty TNHH Hưng Thịnh',
    taxCode: '0307778899',
    status: 'Active',
  },
  {
    id: '0192f000-0000-7000-8000-000000000007',
    code: 'KH-007',
    name: 'Công ty CP Vận tải Quốc tế Á Châu',
    taxCode: '0109988776',
    status: 'Suspended', // Khách hàng ngưng hoạt động -> không hiển thị trong dropdown tạo hợp đồng
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'c-024',
    code: 'HĐ-2026-024',
    title: 'Vận chuyển hàng hóa miền Bắc',
    customerId: '0192f000-0000-7000-8000-000000000001',
    customerName: 'Công ty CP Thương mại An Phát',
    customerTaxCode: '0101234567',
    effectiveFrom: '2026-11-01',
    effectiveTo: '2027-10-31',
    contractValue: 350000000,
    currency: 'VND',
    paymentTerms: 'Thanh toán chuyển khoản định kỳ ngày 15 hàng tháng theo biên bản đối soát sản lượng.',
    serviceTerms: 'Vận chuyển hàng bách hóa và tiêu dùng các tuyến Hà Nội - Hải Phòng - Quảng Ninh.',
    status: 'Draft',
    ownerName: 'VAN PHU HIEU',
    attachments: [
      {
        id: 'att-01',
        fileName: 'Hop_dong_nguyen_tac_AnPhat.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2450000,
        isMainDocument: true,
        uploadedAt: '2026-11-01 09:30'
      }
    ],
    createdAt: '2026-11-01T09:30:00Z',
    updatedAt: '2026-11-01T10:15:00Z'
  },
  {
    id: 'c-023',
    code: 'HĐ-2026-023',
    title: 'Dịch vụ kho bãi Bình Dương',
    customerId: '0192f000-0000-7000-8000-000000000002',
    customerName: 'Công ty TNHH Minh Long',
    customerTaxCode: '0309876543',
    effectiveFrom: '2026-11-01',
    effectiveTo: '2027-04-30',
    contractValue: 480000000,
    currency: 'VND',
    paymentTerms: 'Đặt cọc 2 tháng tiền thuê kho, thanh toán vào ngày 05 đầu mỗi tháng.',
    serviceTerms: 'Lưu kho tiêu chuẩn 2.000 m2 tại ICD Sóng Thần, Bình Dương.',
    status: 'PendingApproval',
    ownerName: 'VAN PHU HIEU',
    attachments: [
      {
        id: 'att-02',
        fileName: 'Phu_luc_kho_bai_MinhLong.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 1800000,
        isMainDocument: true,
        uploadedAt: '2026-10-28 14:00'
      }
    ],
    createdAt: '2026-10-28T14:00:00Z'
  },
  {
    id: 'c-022',
    code: 'HĐ-2026-022',
    title: 'Vận chuyển tuyến Hà Nội – Đà Nẵng',
    customerId: '0192f000-0000-7000-8000-000000000003',
    customerName: 'Công ty CP Sơn Hà',
    customerTaxCode: '0105556677',
    effectiveFrom: '2026-10-01',
    effectiveTo: '2027-09-30',
    contractValue: 820000000,
    currency: 'VND',
    paymentTerms: 'Thanh toán 100% trong vòng 30 ngày kể từ ngày nhận đủ chứng từ hóa đơn.',
    serviceTerms: 'Dịch vụ xe tải lạnh tải trọng 15 tấn chuyên tuyến Bắc - Trung.',
    status: 'Approved',
    ownerName: 'VAN PHU HIEU',
    attachments: [
      {
        id: 'att-03',
        fileName: 'Hop_dong_SonHa_signed.pdf',
        contentType: 'application/pdf',
        sizeBytes: 3100000,
        isMainDocument: true,
        uploadedAt: '2026-09-25 08:30'
      }
    ],
    createdAt: '2026-09-25T08:30:00Z'
  },
  {
    id: 'c-021',
    code: 'HĐ-2026-021',
    title: 'Dịch vụ giao nhận hàng xuất khẩu',
    customerId: '0192f000-0000-7000-8000-000000000004',
    customerName: 'Công ty TNHH Đại Dương',
    customerTaxCode: '0204448899',
    effectiveFrom: '2026-10-15',
    effectiveTo: '2027-10-14',
    contractValue: 620000000,
    currency: 'VND',
    paymentTerms: 'Thanh toán gối đầu 1 kỳ theo bảng đối soát hàng tháng.',
    serviceTerms: 'Làm thủ tục hải quan và thông quan hàng nông sản tại cụm cảng Hải Phòng.',
    status: 'RevisionRequested',
    ownerName: 'VAN PHU HIEU',
    attachments: [
      {
        id: 'att-04',
        fileName: 'Du_thao_HD_DaiDuong.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1540000,
        isMainDocument: true,
        uploadedAt: '2026-10-10 11:20'
      }
    ],
    createdAt: '2026-10-10T11:20:00Z'
  },
  {
    id: 'c-020',
    code: 'HĐ-2026-020',
    title: 'Vận chuyển container nội địa',
    customerId: '0192f000-0000-7000-8000-000000000005',
    customerName: 'Công ty CP Thép Việt',
    customerTaxCode: '0311223344',
    effectiveFrom: '2026-10-01',
    effectiveTo: '2027-03-31',
    contractValue: 1250000000,
    currency: 'VND',
    paymentTerms: 'Thanh toán từng chuyến trong vòng 7 ngày sau khi giao nhận nguyên vẹn.',
    serviceTerms: 'Vận chuyển container thép cuộn và thép hình bằng xe đầu kéo chuyên dụng.',
    status: 'Approved',
    ownerName: 'VAN PHU HIEU',
    attachments: [
      {
        id: 'att-05',
        fileName: 'HD_ThepViet_chinhthuc.pdf',
        contentType: 'application/pdf',
        sizeBytes: 4200000,
        isMainDocument: true,
        uploadedAt: '2026-09-20 16:45'
      }
    ],
    createdAt: '2026-09-20T16:45:00Z'
  },
  {
    id: 'c-019',
    code: 'HĐ-2026-019',
    title: 'Dịch vụ logistics trọn gói',
    customerId: '0192f000-0000-7000-8000-000000000006',
    customerName: 'Công ty TNHH Hưng Thịnh',
    customerTaxCode: '0307778899',
    effectiveFrom: '2026-10-01',
    effectiveTo: '2027-09-30',
    contractValue: 980000000,
    currency: 'VND',
    paymentTerms: 'Thanh toán thành 4 đợt theo từng quý (25% mỗi đợt).',
    serviceTerms: 'Quản lý kho ngoại quan, bốc xếp, dán nhãn và phân phối dặm cuối.',
    status: 'PendingApproval',
    ownerName: 'VAN PHU HIEU',
    attachments: [
      {
        id: 'att-06',
        fileName: 'Bao_gia_va_hop_dong_HungThinh.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2900000,
        isMainDocument: true,
        uploadedAt: '2026-09-18 10:00'
      }
    ],
    createdAt: '2026-09-18T10:00:00Z'
  }
];
