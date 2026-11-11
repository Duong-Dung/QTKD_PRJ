import { describe, expect, it } from 'vitest';
import {
  createEmptyCustomerFormValues,
  mapProblemDetailsToErrors,
  suggestNextCustomerCode,
  validateCustomerForm,
} from './customerValidation';

describe('customerValidation', () => {
  it('accepts valid create payload with 10-digit and 13-digit tax code', () => {
    const valid10 = {
      ...createEmptyCustomerFormValues(),
      code: 'KH-001',
      name: 'Công ty Cổ phần Logistics ABC',
      taxCode: '0312345678',
      address: 'Số 10 Mai Chí Thọ, TP. Thủ Đức',
      representativeName: 'Nguyễn Văn An',
      contactPhone: '0901234567',
      contactEmail: 'contact@abc.vn',
    };
    expect(validateCustomerForm(valid10, 'create')).toEqual({});

    const valid13 = { ...valid10, taxCode: '0312345678-001' };
    expect(validateCustomerForm(valid13, 'create')).toEqual({});
  });

  it('rejects missing required fields and invalid formats in create mode', () => {
    const invalid = {
      ...createEmptyCustomerFormValues(),
      code: 'A!',
      taxCode: '12345',
      contactPhone: 'abc',
      contactEmail: 'not-an-email',
    };

    const errors = validateCustomerForm(invalid, 'create');
    expect(errors.code).toBeDefined();
    expect(errors.name).toBeDefined();
    expect(errors.taxCode).toBeDefined();
    expect(errors.address).toBeDefined();
    expect(errors.representativeName).toBeDefined();
    expect(errors.contactPhone).toBeDefined();
    expect(errors.contactEmail).toBeDefined();
  });

  it('skips code validation in edit mode and allows optional contact fields blank', () => {
    const values = {
      ...createEmptyCustomerFormValues(),
      code: '',
      name: 'Công ty Cập Nhật',
      taxCode: '0101234567',
      address: 'Hà Nội',
      representativeName: 'Trần Bình',
    };

    expect(validateCustomerForm(values, 'edit')).toEqual({});
  });

  it('maps 400 ProblemDetails validation errors and 409 Conflict errors accurately', () => {
    const badRequest = mapProblemDetailsToErrors({
      status: 400,
      detail: 'Dữ liệu tạo khách hàng không hợp lệ.',
      errors: {
        TaxCode: ['Mã số thuế không đúng định dạng.'],
        ContactEmail: ['Email không hợp lệ.'],
      },
    });
    expect(badRequest.fieldErrors.taxCode).toBe('Mã số thuế không đúng định dạng.');
    expect(badRequest.fieldErrors.contactEmail).toBe('Email không hợp lệ.');

    const conflictTax = mapProblemDetailsToErrors({
      status: 409,
      detail: "Mã số thuế '0101234567' đã được đăng ký cho một khách hàng khác.",
    });
    expect(conflictTax.fieldErrors.taxCode).toContain('0101234567');

    const conflictCode = mapProblemDetailsToErrors({
      status: 409,
      detail: "Mã khách hàng 'KH-001' đã tồn tại trong hệ thống.",
    });
    expect(conflictCode.fieldErrors.code).toContain('KH-001');
  });

  it('suggests next sequential customer code', () => {
    expect(suggestNextCustomerCode([])).toBe('KH-001');
    expect(suggestNextCustomerCode(['KH-001', 'KH-009', 'OTHER-12'])).toBe('KH-010');
  });
});
