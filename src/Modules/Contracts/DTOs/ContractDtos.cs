using Qtkd.Modules.Contracts.Entities;

namespace Qtkd.Modules.Contracts.DTOs;

/// <summary>
/// DTO yêu cầu khởi tạo hợp đồng nháp (TASK-27 - CTR-01)
/// </summary>
public class CreateContractRequest
{
    /// <summary>
    /// Mã hợp đồng (Tùy chọn. Nếu để trống hệ thống tự sinh theo quy tắc cấu hình HD-{YYYY}-{NNNN})
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Mã định danh khách hàng (Bắt buộc, phải tồn tại và đang ở trạng thái Active)
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// Tiêu đề hoặc trích yếu hợp đồng
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Ngày bắt đầu có hiệu lực
    /// </summary>
    public DateOnly EffectiveFrom { get; set; }

    /// <summary>
    /// Ngày kết thúc hiệu lực (Phải lớn hơn EffectiveFrom)
    /// </summary>
    public DateOnly EffectiveTo { get; set; }

    /// <summary>
    /// Giá trị hợp đồng (VND hoặc ngoại tệ, >= 0)
    /// </summary>
    public decimal ContractValue { get; set; }

    /// <summary>
    /// Đơn vị tiền tệ (mặc định VND)
    /// </summary>
    public string Currency { get; set; } = "VND";

    /// <summary>
    /// Điều khoản thanh toán
    /// </summary>
    public string? PaymentTerms { get; set; }

    /// <summary>
    /// Điều khoản dịch vụ
    /// </summary>
    public string? ServiceTerms { get; set; }

    /// <summary>
    /// Người phụ trách hợp đồng (Tùy chọn)
    /// </summary>
    public Guid? OwnerUserId { get; set; }
}

/// <summary>
/// DTO phản hồi thông tin hợp đồng
/// </summary>
public class ContractDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerCode { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly EffectiveTo { get; set; }
    public decimal ContractValue { get; set; }
    public string Currency { get; set; } = "VND";
    public string? PaymentTerms { get; set; }
    public string? ServiceTerms { get; set; }
    public ContractStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public Guid OwnerUserId { get; set; }
    public Guid? RevisionOfContractId { get; set; }
    public string? CancelledReason { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}