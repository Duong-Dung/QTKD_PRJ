using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Audit.Entities;

public class AuditLog : BaseEntity
{
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, Transition, Approve, Reject
    public string Actor { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? Note { get; set; }
    public string? CorrelationId { get; set; }
}
