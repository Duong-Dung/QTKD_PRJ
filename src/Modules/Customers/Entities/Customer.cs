using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Customers.Entities;

public enum CustomerStatus
{
    Active = 1,
    Suspended = 2
}

public class Customer : BaseEntity, IAuditable
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Representative { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public CustomerStatus Status { get; set; } = CustomerStatus.Active;

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
