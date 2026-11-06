using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Services;

namespace Qtkd.Modules.Customers.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Route("api/customers")]
[Tags("Customers")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    /// <summary>
    /// Tạo mới hồ sơ khách hàng doanh nghiệp (TASK-22)
    /// </summary>
    /// <param name="request">Thông tin khách hàng mới</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Thông tin khách hàng vừa được tạo</returns>
    [HttpPost]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request, CancellationToken ct)
    {
        var created = await _customerService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Cập nhật thông tin khách hàng theo ID (TASK-22)
    /// </summary>
    /// <param name="id">Mã định danh khách hàng (UUID)</param>
    /// <param name="request">Thông tin cập nhật</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Thông tin khách hàng sau khi cập nhật</returns>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateCustomerRequest request, CancellationToken ct)
    {
        var updated = await _customerService.UpdateAsync(id, request, ct);
        return Ok(updated);
    }

    /// <summary>
    /// Lấy chi tiết thông tin khách hàng theo ID (TASK-22)
    /// </summary>
    /// <param name="id">Mã định danh khách hàng (UUID)</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Thông tin khách hàng</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken ct)
    {
        var customer = await _customerService.GetByIdAsync(id, ct);
        return Ok(customer);
    }

    /// <summary>
    /// Tra cứu thông tin khách hàng theo mã khách hàng (TASK-22)
    /// </summary>
    /// <param name="code">Mã khách hàng (VD: KH-001)</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Thông tin khách hàng</returns>
    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCode([FromRoute] string code, CancellationToken ct)
    {
        var customer = await _customerService.GetByCodeAsync(code, ct);
        if (customer == null)
        {
            throw new NotFoundException($"Không tìm thấy khách hàng với mã '{code}'.");
        }
        return Ok(customer);
    }

    /// <summary>
    /// Thông tin phân hệ khách hàng
    /// </summary>
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Customers",
            Status = "Active",
            Description = "Quản lý khách hàng, tra cứu hợp đồng, bảng giá, bảng thanh toán liên quan (TASK-22)",
            Endpoints = new[]
            {
                "POST /api/v1/customers",
                "PUT /api/v1/customers/{id}",
                "GET /api/v1/customers/{id}",
                "GET /api/v1/customers/by-code/{code}",
                "GET /api/v1/customers/info"
            }
        });
    }
}
