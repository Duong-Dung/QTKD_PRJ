import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerWorkspace } from './CustomerWorkspace';
import { customerService } from '../services/customerService';
import { CustomerDto, PagedResult } from '../types/customer';

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

const activeCustomer: CustomerDto = {
  id: '01950000-0000-7000-8000-000000000001',
  code: 'KH-001',
  name: 'Công ty Logistics Biển Đông',
  taxCode: '0312345678',
  address: 'Quận 1, TP.HCM',
  representativeName: 'Nguyễn Văn An',
  representativeTitle: 'Giám đốc',
  contactPerson: 'Trần Hoa',
  contactPhone: '0901234567',
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

const suspendedCustomer: CustomerDto = {
  ...activeCustomer,
  id: '01950000-0000-7000-8000-000000000002',
  code: 'KH-002',
  name: 'Công ty Vận Tải Phương Nam',
  taxCode: '0109876543',
  status: 1,
  statusName: 'Suspended',
  suspendedReason: 'Quá hạn thanh toán',
  suspendedAt: '2026-11-11T09:00:00Z',
};

const defaultPagedResult: PagedResult<CustomerDto> = {
  items: [activeCustomer, suspendedCustomer],
  pageIndex: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('CustomerWorkspace (TASK-26)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customerService.getCustomers).mockResolvedValue(defaultPagedResult);
    vi.mocked(customerService.getCustomerById).mockResolvedValue(activeCustomer);
  });

  it('loads customer list, searches by keyword, filters by status, and resets filters', async () => {
    const user = userEvent.setup();
    render(<CustomerWorkspace onBreadcrumbChange={vi.fn()} onNotify={vi.fn()} />);

    expect(await screen.findByText('KH-001')).toBeInTheDocument();
    expect(screen.getByText('KH-002')).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/tìm kiếm khách hàng/i);
    await user.type(searchInput, 'Biển Đông');
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    await waitFor(() => {
      expect(customerService.getCustomers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchTerm: 'Biển Đông',
          pageIndex: 1,
        }),
        expect.any(AbortSignal)
      );
    });

    await user.selectOptions(screen.getByLabelText(/lọc theo trạng thái/i), 'Suspended');

    await waitFor(() => {
      expect(customerService.getCustomers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'Suspended',
          pageIndex: 1,
        }),
        expect.any(AbortSignal)
      );
    });

    await user.click(screen.getByRole('button', { name: /đặt lại/i }));

    await waitFor(() => {
      expect(customerService.getCustomers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchTerm: '',
          status: '',
          pageIndex: 1,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('suspends an active customer via row action menu and confirmation modal', async () => {
    const user = userEvent.setup();
    const onNotify = vi.fn();
    vi.mocked(customerService.updateCustomerStatus).mockResolvedValue({
      ...activeCustomer,
      status: 1,
      statusName: 'Suspended',
      suspendedReason: 'Chậm thanh toán kỳ 10',
    });

    render(<CustomerWorkspace onBreadcrumbChange={vi.fn()} onNotify={onNotify} />);
    expect(await screen.findByText('KH-001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /thao tác cho KH-001/i }));
    await user.click(screen.getByRole('menuitem', { name: /tạm ngưng/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/lý do tạm ngưng/i), 'Chậm thanh toán kỳ 10');
    await user.click(screen.getByRole('button', { name: /xác nhận tạm ngưng/i }));

    await waitFor(() => {
      expect(customerService.updateCustomerStatus).toHaveBeenCalledWith(activeCustomer.id, {
        status: 1,
        reason: 'Chậm thanh toán kỳ 10',
      });
    });

    expect(onNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Đã tạm ngưng khách hàng',
      })
    );
  });

  it('reactivates a suspended customer and clears reason', async () => {
    const user = userEvent.setup();
    const onNotify = vi.fn();
    vi.mocked(customerService.updateCustomerStatus).mockResolvedValue({
      ...suspendedCustomer,
      status: 0,
      statusName: 'Active',
      suspendedReason: null,
    });

    render(<CustomerWorkspace onBreadcrumbChange={vi.fn()} onNotify={onNotify} />);
    expect(await screen.findByText('KH-002')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /thao tác cho KH-002/i }));
    await user.click(screen.getByRole('menuitem', { name: /kích hoạt lại/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Quá hạn thanh toán/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /xác nhận kích hoạt/i }));

    await waitFor(() => {
      expect(customerService.updateCustomerStatus).toHaveBeenCalledWith(suspendedCustomer.id, {
        status: 0,
        reason: null,
      });
    });

    expect(onNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Đã kích hoạt lại khách hàng',
      })
    );
  });

  it('opens customer detail view and supports suspending from detail header', async () => {
    const user = userEvent.setup();
    vi.mocked(customerService.updateCustomerStatus).mockResolvedValue({
      ...activeCustomer,
      status: 1,
      statusName: 'Suspended',
      suspendedReason: 'Kiểm tra hợp đồng',
    });

    render(<CustomerWorkspace onBreadcrumbChange={vi.fn()} onNotify={vi.fn()} />);
    expect(await screen.findByText('KH-001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /thao tác cho KH-001/i }));
    await user.click(screen.getByRole('menuitem', { name: /xem chi tiết/i }));

    expect(await screen.findByText(/Thông tin doanh nghiệp/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^tạm ngưng$/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^tạm ngưng$/i }));
    await user.type(screen.getByLabelText(/lý do tạm ngưng/i), 'Kiểm tra hợp đồng');
    await user.click(screen.getByRole('button', { name: /xác nhận tạm ngưng/i }));

    await waitFor(() => {
      expect(customerService.updateCustomerStatus).toHaveBeenCalledWith(activeCustomer.id, {
        status: 1,
        reason: 'Kiểm tra hợp đồng',
      });
    });
  });
});
