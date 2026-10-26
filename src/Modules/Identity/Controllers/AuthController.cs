using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Identity.Controllers;

[ApiController]
[Route("api/v1/identity")]
[Tags("Identity")]
public class AuthController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Identity",
            Status = "Active",
            Description = "Quản lý định danh, xác thực JWT và phân quyền RBAC (T028, T029)",
            Endpoints = new[] { "/api/v1/identity/login", "/api/v1/identity/me", "/api/v1/identity/users" }
        });
    }
}
