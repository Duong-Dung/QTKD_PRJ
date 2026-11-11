using Qtkd.BuildingBlocks.Common;
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
/// DTO yêu cầu cập nhật trạng thái khách hàng (Active / Suspended) (TASK-25)
/// </summary>
public class UpdateCustomerStatusRequest
{
    public CustomerStatus Status { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// DTO truy vấn danh sách khách hàng có tìm kiếm và phân trang (TASK-25)
/// </summary>
public class GetCustomersQuery
{
    /// <summary>
    /// Từ khóa tìm kiếm theo Mã khách hàng, Tên công ty hoặc MST
    /// </summary>
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Bí danh tham số tìm kiếm (hỗ trợ ?keyword=...)
    /// </summary>
    public string? Keyword { get; set; }

    /// <summary>
    /// Lọc theo trạng thái hoạt động (Active, Suspended)
    /// </summary>
    public CustomerStatus? Status { get; set; }

    /// <summary>
    /// Chỉ số trang (bắt đầu từ 1, mặc định 1)
    /// </summary>
    public int PageIndex { get; set; } = 1;

    /// <summary>
    /// Số lượng bản ghi mỗi trang (mặc định 10, tối đa 100)
    /// </summary>
    public int PageSize { get; set; } = 10;
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