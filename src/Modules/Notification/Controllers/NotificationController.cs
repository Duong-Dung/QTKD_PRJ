using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Qtkd.Modules.Notification.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Tags("Notification")]
public class NotificationController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Notification",
            Status = "Active",
            Description = "Dịch vụ thông báo người dùng, nhận event bất đồng bộ và đẩy thông báo thời gian thực (4.9, T058..T059)",
            Endpoints = new[] { "/api/v1/notifications", "/api/v1/notifications/unread-count", "/api/v1/notifications/mark-read" }
        });
    }
}
