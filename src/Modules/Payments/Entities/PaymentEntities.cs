using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Payments.Entities;

public enum PaymentStatementStatus
{
    Draft = 1,
    Calculated = 2,
    Reconciled = 3,
    Submitted = 4,
    Approved = 5,
    Rejected = 6,
    RevisionRequested = 7,
    Signing = 8,
    Signed = 9,
    Issued = 10,
    Cancelled = 11
}

public class PaymentStatement : AuditableEntity
{
    public string StatementNumber { get; set; } = string.Empty;
    public Guid ContractId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid PeriodId { get; set; }

    public decimal TotalAmount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal GrandTotal { get; set; }

    public PaymentStatementStatus Status { get; set; } = PaymentStatementStatus.Draft;

    /// <summary>
    /// Đánh dấu đây là hồ sơ điều chỉnh thay thế hoặc bù trừ (PAY-05)
    /// </summary>
    public bool IsAdjustment { get; set; } = false;
    public Guid? OriginalStatementId { get; set; }

    public ICollection<PaymentLine> Lines { get; set; } = new List<PaymentLine>();
}

public class PaymentLine : BaseEntity
{
    public Guid StatementId { get; set; }
    public PaymentStatement? Statement { get; set; }

    public string ServiceCode { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;

    /// <summary>
    /// Đơn giá snapshot tại thời điểm tính phí (PAY-03: không bị đổi khi bảng giá thay đổi)
    /// </summary>
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public decimal VatRate { get; set; } = 0.10m; // 10% VAT
    public decimal VatAmount { get; set; }
    public decimal LineTotal { get; set; }
}
