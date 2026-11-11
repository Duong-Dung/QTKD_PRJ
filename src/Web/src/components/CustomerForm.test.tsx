import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerForm } from './CustomerForm';
import { ApiError, customerService } from '../services/customerService';
import { CustomerDto } from '../types/customer';

vi.mock('../services/customerService', async () => {
  const actual = await vi.importActual<typeof import('../services/customerService')>(
    '../services/customerService'
  );
  return {
    ...actual,
    customerService: {
      getCustomers: vi.fn(),
      getCustomerById: vi.fn(),
      getCustomerByCode: vi.fn(),
      createCustomer: vi.fn(),
      updateCustomer: vi.fn(),
      updateCustomerStatus: vi.fn(),
    },
  };
});

const sampleCustomer: CustomerDto = {
  id: '01950000-0000-7000-8000-000000000001',
  code: 'KH-001',
  name: 'Công ty Vận Tải Biển Đông',
  taxCode: '0312345678',
  address: 'Số 10 Nguyễn Huệ, Quận 1, TP.HCM',
  representativeName: 'Nguyễn Hải Đăng',
  representativeTitle: 'Giám đốc',
  contactPerson: 'Lê Thị Hoa',
  contactPhone: '0908889999',
  contactEmail: 'hoa@biendong.vn',
  status: 0,
  statusName: 'Active',
  suspendedReason: null,
  suspendedAt: null,
  createdAt: '2026-11-10T08:00:00Z',
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
};

describe('CustomerForm (TASK-23)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents submission and shows field errors when required fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <CustomerForm
        mode="create"
        existingCodes={['KH-001']}
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /lưu khách hàng/i }));

    expect(customerService.createCustomer).not.toHaveBeenCalled();
    expect(screen.getByText(/Mã khách hàng không được để trống/i)).toBeInTheDocument();
    expect(screen.getByText(/Tên khách hàng không được để trống/i)).toBeInTheDocument();
    expect(screen.getByText(/Mã số thuế không được để trống/i)).toBeInTheDocument();
  });

  it('suggests next code and creates customer via API with trimmed payload', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(customerService.createCustomer).mockResolvedValue({
      ...sampleCustomer,
      code: 'KH-002',
    });

    render(
      <CustomerForm
        mode="create"
        existingCodes={['KH-001']}
        onCancel={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: /gợi ý mã/i }));
    expect(screen.getByLabelText(/mã khách hàng/i)).toHaveValue('KH-002');

    await user.type(screen.getByLabelText(/mã số thuế/i), '0312345678');
    await user.type(screen.getByLabelText(/tên khách hàng/i), '  Công ty Cảng Mới  ');
    await user.type(screen.getByLabelText(/địa chỉ trụ sở/i), 'Cảng Cát Lái, TP. Thủ Đức');
    await user.type(screen.getByLabelText(/người đại diện pháp luật/i), 'Trần Văn Minh');

    await user.click(screen.getByRole('button', { name: /lưu khách hàng/i }));

    await waitFor(() => {
      expect(customerService.createCustomer).toHaveBeenCalledWith({
        code: 'KH-002',
        name: 'Công ty Cảng Mới',
        taxCode: '0312345678',
        address: 'Cảng Cát Lái, TP. Thủ Đức',
        representativeName: 'Trần Văn Minh',
        representativeTitle: null,
        contactPerson: null,
        contactPhone: null,
        contactEmail: null,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('maps backend 409 conflict error onto taxCode field', async () => {
    const user = userEvent.setup();
    const detail = "Mã số thuế '0312345678' đã được đăng ký cho một khách hàng khác.";
    vi.mocked(customerService.createCustomer).mockRejectedValue(
      new ApiError(409, detail, { taxCode: detail })
    );

    render(
      <CustomerForm mode="create" onCancel={vi.fn()} onSuccess={vi.fn()} />
    );

    await user.type(screen.getByLabelText(/mã khách hàng/i), 'KH-010');
    await user.type(screen.getByLabelText(/mã số thuế/i), '0312345678');
    await user.type(screen.getByLabelText(/tên khách hàng/i), 'Công ty Trùng MST');
    await user.type(screen.getByLabelText(/địa chỉ trụ sở/i), 'Đà Nẵng');
    await user.type(screen.getByLabelText(/người đại diện pháp luật/i), 'Nguyễn An');

    await user.click(screen.getByRole('button', { name: /lưu khách hàng/i }));

    await waitFor(() => {
      expect(screen.getAllByText(detail).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByLabelText(/mã số thuế/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables code in edit mode and updates both info and status when suspended', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    vi.mocked(customerService.updateCustomer).mockResolvedValue(sampleCustomer);
    vi.mocked(customerService.updateCustomerStatus).mockResolvedValue({
      ...sampleCustomer,
      status: 1,
      statusName: 'Suspended',
      suspendedReason: 'Quá hạn thanh toán',
    });

    render(
      <CustomerForm
        mode="edit"
        initialCustomer={sampleCustomer}
        onCancel={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByLabelText(/mã khách hàng/i)).toBeDisabled();

    const nameInput = screen.getByLabelText(/tên khách hàng/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Công ty Vận Tải Biển Đông Mới');

    await user.click(screen.getByLabelText(/tạm ngưng/i));
    await user.type(screen.getByLabelText(/lý do tạm ngưng/i), 'Quá hạn thanh toán');

    await user.click(screen.getByRole('button', { name: /cập nhật khách hàng/i }));

    await waitFor(() => {
      expect(customerService.updateCustomer).toHaveBeenCalledWith(
        sampleCustomer.id,
        expect.objectContaining({ name: 'Công ty Vận Tải Biển Đông Mới' })
      );
      expect(customerService.updateCustomerStatus).toHaveBeenCalledWith(sampleCustomer.id, {
        status: 1,
        reason: 'Quá hạn thanh toán',
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ statusName: 'Suspended' }),
      'edit'
    );
  });

  it('asks confirmation before discarding unsaved edits', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<CustomerForm mode="create" onCancel={onCancel} onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/tên khách hàng/i), 'Dữ liệu đang nhập');
    await user.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /hủy thay đổi/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
