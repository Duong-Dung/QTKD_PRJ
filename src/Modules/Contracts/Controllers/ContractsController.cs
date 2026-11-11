using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Qtkd.Modules.Contracts.DTOs;
using Qtkd.Modules.Contracts.Services;
using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Contracts.Controllers;

[ApiController]
[Route("api/v1/contracts")]
[Route("api/contracts")]
[Tags("Contracts")]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    /// <summary>
    /// TASK-31: Tìm kiếm, lọc và phân trang hợp đồng.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] GetContractsQuery query, CancellationToken ct)
    {
        var result = await _contractService.GetPagedAsync(query, ct);
        return Ok(result);
    }

    /// <summary>
    /// Khởi tạo hợp đồng mới ở trạng thái Draft (TASK-27 - CTR-01)
    /// </summary>
    /// <param name="request">Thông tin hợp đồng nháp cần tạo</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Hợp đồng vừa được khởi tạo ở trạng thái Draft</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ContractDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateContractRequest request, CancellationToken ct)
    {
        var created = await _contractService.CreateDraftAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// TASK-31: Lấy chi tiết thông tin hợp đồng theo ID (giữ implementation TASK-27)
    /// </summary>
    /// <param name="id">Mã định danh hợp đồng (UUID)</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Thông tin hợp đồng</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ContractDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken ct)
    {
        var contract = await _contractService.GetByIdAsync(id, ct);
        return Ok(contract);
    }

    /// <summary>
    /// Thông tin phân hệ hợp đồng
    /// </summary>
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Contracts",
            Status = "Active",
            Description = "Quản lý hợp đồng, phụ lục, tệp đính kèm và Contract State Machine (CTR-01..07) (TASK-27)",
            Endpoints = new[]
            {
                "POST /api/v1/contracts",
                "GET /api/v1/contracts/{id}",
                "GET /api/v1/contracts?keyword=&status=&pageIndex=&pageSize=",
                "GET /api/v1/contracts/info"
            }
        });
    }
}