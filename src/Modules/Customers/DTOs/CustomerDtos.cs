using Qtkd.Modules.Customers.Entities;

namespace Qtkd.Modules.Customers.DTOs;

/// <summary>
/// DTO yêu cầu tạo mới khách hàng (TASK-22)
/// </summary>
public class CreateCustomerRequest
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
}

/// <summary>
/// DTO yêu cầu cập nhật thông tin khách hàng (TASK-22)
/// </summary>
public class UpdateCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string RepresentativeName { get; set; } = string.Empty;
    public string? RepresentativeTitle { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
}

/// <summary>
/// DTO phản hồi thông tin khách hàng
/// </summary>
public class CustomerDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string RepresentativeName { get; set; } = string.Empty;
    public string? RepresentativeTitle { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public CustomerStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? SuspendedReason { get; set; }
    public DateTimeOffset? SuspendedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
