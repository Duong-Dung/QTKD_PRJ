using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Contracts.Controllers;

[ApiController]
[Route("api/v1/contracts")]
[Tags("Contracts")]
public class ContractsController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Contracts",
            Status = "Active",
            Description = "Quản lý hợp đồng, phụ lục, tệp đính kèm và Contract State Machine (CTR-01..07)",
            Endpoints = new[] { "/api/v1/contracts", "/api/v1/contracts/{id}", "/api/v1/contracts/{id}/addendums" }
        });
    }
}
