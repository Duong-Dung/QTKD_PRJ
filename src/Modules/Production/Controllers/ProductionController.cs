using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Production.Controllers;

[ApiController]
[Route("api/v1/production")]
[Tags("Production")]
public class ProductionController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Production",
            Status = "Active",
            Description = "Ghi nhận sản lượng thực tế (container, tấn, ngày kho), quản lý kỳ và khóa kỳ (4.5)",
            Endpoints = new[] { "/api/v1/production/periods", "/api/v1/production/records", "/api/v1/production/lock-period" }
        });
    }
}
