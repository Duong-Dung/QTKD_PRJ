using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Customers.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Tags("Customers")]
public class CustomersController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Customers",
            Status = "Active",
            Description = "Quản lý khách hàng, tra cứu hợp đồng, bảng giá, bảng thanh toán liên quan",
            Endpoints = new[] { "/api/v1/customers", "/api/v1/customers/{id}" }
        });
    }
}
