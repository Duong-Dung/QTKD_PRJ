using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Payments.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Tags("Payments")]
public class PaymentsController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Payments",
            Status = "Active",
            Description = "Lập bảng thanh toán, snapshot đơn giá (PAY-03), đối soát sản lượng và hồ sơ điều chỉnh (PAY-01..07)",
            Endpoints = new[] { "/api/v1/payments", "/api/v1/payments/calculate", "/api/v1/payments/{id}/reconcile" }
        });
    }
}
