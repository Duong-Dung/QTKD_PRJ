using Qtkd.Modules.Contracts.DTOs;

namespace Qtkd.Modules.Contracts.Services;

public interface IContractService
{
    /// <summary>
    /// Khởi tạo hợp đồng mới ở trạng thái Draft (TASK-27 - CTR-01)
    /// </summary>
    Task<ContractDto> CreateDraftAsync(CreateContractRequest request, CancellationToken ct = default);

    /// <summary>
    /// Tra cứu chi tiết hợp đồng theo ID
    /// </summary>
    Task<ContractDto> GetByIdAsync(Guid id, CancellationToken ct = default);
}