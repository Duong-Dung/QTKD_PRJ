using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Workflow.Controllers;

[ApiController]
[Route("api/v1/workflow")]
[Tags("Workflow")]
public class WorkflowController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Workflow",
            Status = "Active",
            Description = "Engine quy trình phê duyệt data-driven, chống double submit và race condition (APR-01..07)",
            Endpoints = new[] { "/api/v1/workflow/submit", "/api/v1/workflow/inbox", "/api/v1/workflow/{id}/approve", "/api/v1/workflow/{id}/reject" }
        });
    }
}
