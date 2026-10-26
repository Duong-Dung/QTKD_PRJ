using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Audit.Controllers;

[ApiController]
[Route("api/v1/audit")]
[Tags("Audit")]
public class AuditController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Audit",
            Status = "Active",
            Description = "Ghi nhận và tra cứu nhật ký kiểm toán (Audit Trail) bất biến qua snapshot JSON (4.10, T043)",
            Endpoints = new[] { "/api/v1/audit/logs", "/api/v1/audit/entity/{type}/{id}" }
        });
    }
}
