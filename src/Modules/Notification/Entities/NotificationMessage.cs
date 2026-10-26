using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Notification.Entities;

public class NotificationMessage : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "General"; // Workflow, Expiry, Signing, System
    public bool IsRead { get; set; } = false;
    public DateTimeOffset? ReadAt { get; set; }
    public string? ActionUrl { get; set; }
}
