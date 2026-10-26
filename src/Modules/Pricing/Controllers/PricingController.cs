using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Pricing.Controllers;

[ApiController]
[Route("api/v1/pricing")]
[Tags("Pricing")]
public class PricingController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Pricing",
            Status = "Active",
            Description = "Quản lý bảng giá, versioning, chống chồng hiệu lực daterange (PRC-01..06)",
            Endpoints = new[] { "/api/v1/pricing", "/api/v1/pricing/{id}", "/api/v1/pricing/check-overlap" }
        });
    }
}
