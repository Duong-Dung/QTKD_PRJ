import {
  CreateCustomerRequest,
  CustomerDto,
  CustomerFieldErrors,
  GetCustomersQuery,
  PagedResult,
  ProblemDetails,
  UpdateCustomerRequest,
  UpdateCustomerStatusRequest,
} from '../types/customer';
import { mapProblemDetailsToErrors } from '../utils/customerValidation';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const CUSTOMERS_ENDPOINT = `${API_BASE_URL}/api/v1/customers`;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: CustomerFieldErrors;
  readonly problem?: ProblemDetails;

  constructor(
    status: number,
    message: string,
    fieldErrors: CustomerFieldErrors = {},
    problem?: ProblemDetails
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.problem = problem;
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      const problem = (await response.json()) as ProblemDetails;
      const { generalError, fieldErrors } = mapProblemDetailsToErrors({
        ...problem,
        status: problem.status ?? response.status,
      });
      return new ApiError(response.status, generalError, fieldErrors, problem);
    } catch {
      // Fall through to generic status message
    }
  }

  return new ApiError(
    response.status,
    `Yêu cầu thất bại (HTTP ${response.status}). Vui lòng kiểm tra kết nối tới máy chủ API.`
  );
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, application/problem+json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Không thể kết nối đến máy chủ Backend API (http://localhost:5210). Vui lòng kiểm tra dịch vụ API đang chạy.'
    );
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return (await response.json()) as T;
}

export const customerService = {
  async getCustomers(
    query: GetCustomersQuery = {},
    signal?: AbortSignal
  ): Promise<PagedResult<CustomerDto>> {
    const params = new URLSearchParams();
    if (query.searchTerm?.trim()) {
      params.set('searchTerm', query.searchTerm.trim());
    }
    if (query.status) {
      params.set('status', query.status);
    }
    params.set('pageIndex', String(query.pageIndex ?? 1));
    params.set('pageSize', String(query.pageSize ?? 10));

    return requestJson<PagedResult<CustomerDto>>(
      `${CUSTOMERS_ENDPOINT}?${params.toString()}`,
      { method: 'GET', signal }
    );
  },

  async getCustomerById(id: string, signal?: AbortSignal): Promise<CustomerDto> {
    return requestJson<CustomerDto>(`${CUSTOMERS_ENDPOINT}/${id}`, {
      method: 'GET',
      signal,
    });
  },

  async getCustomerByCode(code: string, signal?: AbortSignal): Promise<CustomerDto> {
    return requestJson<CustomerDto>(
      `${CUSTOMERS_ENDPOINT}/by-code/${encodeURIComponent(code.trim())}`,
      { method: 'GET', signal }
    );
  },

  async createCustomer(payload: CreateCustomerRequest): Promise<CustomerDto> {
    return requestJson<CustomerDto>(CUSTOMERS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCustomer(id: string, payload: UpdateCustomerRequest): Promise<CustomerDto> {
    return requestJson<CustomerDto>(`${CUSTOMERS_ENDPOINT}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateCustomerStatus(
    id: string,
    payload: UpdateCustomerStatusRequest
  ): Promise<CustomerDto> {
    return requestJson<CustomerDto>(`${CUSTOMERS_ENDPOINT}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
