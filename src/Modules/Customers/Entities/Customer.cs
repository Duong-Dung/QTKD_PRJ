using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Customers.Entities;

public enum CustomerStatus
{
    Active,
    Suspended
}

public class Customer : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string RepresentativeName { get; set; } = string.Empty;
    public string? RepresentativeTitle { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;
    public string? SuspendedReason { get; set; }
    public DateTimeOffset? SuspendedAt { get; set; }
}
