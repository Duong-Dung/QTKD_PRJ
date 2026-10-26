using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.ESign.Controllers;

[ApiController]
[Route("api/v1/esign")]
[Tags("ESign")]
public class ESignController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "ESign",
            Status = "Active",
            Description = "Dịch vụ mô phỏng chữ ký điện tử, webhook callback và quản lý phiên ký (4.8, T073..T075)",
            Endpoints = new[] { "/api/v1/esign/sessions", "/api/v1/esign/webhook", "/api/v1/esign/sessions/{id}" }
        });
    }
}
