import {
  CustomerDto,
  CustomerFieldErrors,
  CustomerFieldName,
  CustomerFormValues,
  ProblemDetails,
  normalizeCustomerStatus,
} from '../types/customer';

export const CUSTOMER_CODE_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
export const TAX_CODE_REGEX = /^[0-9]{10}(-[0-9]{3})?$/;
export const PHONE_NUMBER_REGEX = /^[0-9+() -]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createEmptyCustomerFormValues(): CustomerFormValues {
  return {
    code: '',
    name: '',
    taxCode: '',
    address: '',
    representativeName: '',
    representativeTitle: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    status: 'Active',
    suspendedReason: '',
  };
}

export function customerDtoToFormValues(customer: CustomerDto): CustomerFormValues {
  return {
    code: customer.code,
    name: customer.name,
    taxCode: customer.taxCode,
    address: customer.address,
    representativeName: customer.representativeName,
    representativeTitle: customer.representativeTitle ?? '',
    contactPerson: customer.contactPerson ?? '',
    contactPhone: customer.contactPhone ?? '',
    contactEmail: customer.contactEmail ?? '',
    status: normalizeCustomerStatus(customer.status, customer.statusName),
    suspendedReason: customer.suspendedReason ?? '',
  };
}

export function validateCustomerForm(
  values: CustomerFormValues,
  mode: 'create' | 'edit'
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};

  const code = values.code.trim();
  const name = values.name.trim();
  const taxCode = values.taxCode.trim();
  const address = values.address.trim();
  const representativeName = values.representativeName.trim();
  const representativeTitle = values.representativeTitle.trim();
  const contactPerson = values.contactPerson.trim();
  const contactPhone = values.contactPhone.trim();
  const contactEmail = values.contactEmail.trim();
  const suspendedReason = values.suspendedReason.trim();

  if (mode === 'create') {
    if (!code) {
      errors.code = 'Mã khách hàng không được để trống.';
    } else if (!CUSTOMER_CODE_REGEX.test(code)) {
      errors.code =
        'Mã khách hàng chỉ được chứa từ 3 đến 20 ký tự chữ cái, số, gạch ngang (-) hoặc gạch dưới (_).';
    }
  }

  if (!name) {
    errors.name = 'Tên khách hàng không được để trống.';
  } else if (name.length > 200) {
    errors.name = 'Tên khách hàng không được vượt quá 200 ký tự.';
  }

  if (!taxCode) {
    errors.taxCode = 'Mã số thuế không được để trống.';
  } else if (!TAX_CODE_REGEX.test(taxCode)) {
    errors.taxCode =
      'Mã số thuế không đúng định dạng (gồm 10 chữ số hoặc 13 chữ số có dấu gạch ngang, ví dụ: 0101234567 hoặc 0101234567-001).';
  }

  if (!address) {
    errors.address = 'Địa chỉ trụ sở khách hàng không được để trống.';
  } else if (address.length > 500) {
    errors.address = 'Địa chỉ không được vượt quá 500 ký tự.';
  }

  if (!representativeName) {
    errors.representativeName = 'Tên người đại diện pháp luật không được để trống.';
  } else if (representativeName.length > 150) {
    errors.representativeName = 'Tên người đại diện không được vượt quá 150 ký tự.';
  }

  if (representativeTitle.length > 100) {
    errors.representativeTitle = 'Chức danh người đại diện không được vượt quá 100 ký tự.';
  }

  if (contactPerson.length > 150) {
    errors.contactPerson = 'Tên người liên hệ không được vượt quá 150 ký tự.';
  }

  if (contactPhone) {
    if (contactPhone.length > 20) {
      errors.contactPhone = 'Số điện thoại liên hệ không được vượt quá 20 ký tự.';
    } else if (!PHONE_NUMBER_REGEX.test(contactPhone)) {
      errors.contactPhone = 'Số điện thoại liên hệ không đúng định dạng.';
    }
  }

  if (contactEmail) {
    if (contactEmail.length > 150) {
      errors.contactEmail = 'Email liên hệ không được vượt quá 150 ký tự.';
    } else if (!EMAIL_REGEX.test(contactEmail)) {
      errors.contactEmail = 'Email liên hệ không đúng định dạng email hợp lệ.';
    }
  }

  if (mode === 'edit' && values.status === 'Suspended' && suspendedReason.length > 500) {
    errors.suspendedReason = 'Lý do tạm ngưng không được vượt quá 500 ký tự.';
  }

  return errors;
}

const BACKEND_FIELD_MAP: Record<string, CustomerFieldName> = {
  code: 'code',
  name: 'name',
  taxcode: 'taxCode',
  address: 'address',
  representativename: 'representativeName',
  representativetitle: 'representativeTitle',
  contactperson: 'contactPerson',
  contactphone: 'contactPhone',
  contactemail: 'contactEmail',
  reason: 'suspendedReason',
  suspendedreason: 'suspendedReason',
};

export function mapProblemDetailsToErrors(problem: ProblemDetails): {
  generalError: string;
  fieldErrors: CustomerFieldErrors;
} {
  const fieldErrors: CustomerFieldErrors = {};

  if (problem.errors) {
    for (const [key, messages] of Object.entries(problem.errors)) {
      const normalizedKey = key.trim().toLowerCase();
      const targetField = BACKEND_FIELD_MAP[normalizedKey];
      if (targetField && messages.length > 0) {
        fieldErrors[targetField] = messages[0];
      }
    }
  }

  const detail = problem.detail?.trim() || problem.title?.trim() || 'Đã xảy ra lỗi khi lưu dữ liệu.';

  if (problem.status === 409) {
    const lowerDetail = detail.toLowerCase();
    if (lowerDetail.includes('mã khách hàng')) {
      fieldErrors.code = detail;
    } else if (lowerDetail.includes('mã số thuế')) {
      fieldErrors.taxCode = detail;
    }
  }

  return {
    generalError: detail,
    fieldErrors,
  };
}

export function suggestNextCustomerCode(existingCodes: string[]): string {
  let maxNumber = 0;

  for (const code of existingCodes) {
    const match = /^KH[-_]?(\d+)$/i.exec(code.trim());
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }

  return `KH-${String(maxNumber + 1).padStart(3, '0')}`;
}
