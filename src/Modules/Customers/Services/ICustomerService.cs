using Qtkd.BuildingBlocks.Common;
using Qtkd.Modules.Customers.DTOs;

namespace Qtkd.Modules.Customers.Services;

public interface ICustomerService
{
    Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken ct = default);
    Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerRequest request, CancellationToken ct = default);
    Task<CustomerDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CustomerDto?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<CustomerDto> UpdateStatusAsync(Guid id, UpdateCustomerStatusRequest request, CancellationToken ct = default);
    Task<PagedResult<CustomerDto>> GetPagedAsync(GetCustomersQuery query, CancellationToken ct = default);
}