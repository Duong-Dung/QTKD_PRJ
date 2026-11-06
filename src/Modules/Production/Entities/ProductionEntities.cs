using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Production.Entities;

public class ProductionPeriod : AuditableEntity
{
    public string PeriodCode { get; set; } = string.Empty; // Ví dụ: 2026-10
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset FromDate { get; set; }
    public DateTimeOffset ToDate { get; set; }
    public bool IsLocked { get; set; } = false;
    public DateTimeOffset? LockedAt { get; set; }
    public string? LockedBy { get; set; }

    public ICollection<ProductionRecord> Records { get; set; } = new List<ProductionRecord>();
}

public class ProductionRecord : AuditableEntity
{
    public Guid PeriodId { get; set; }
    public ProductionPeriod? Period { get; set; }

    public Guid ContractId { get; set; }
    public Guid CustomerId { get; set; }
    public string ServiceCode { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty; // container, tấn, chuyến, ngày lưu kho
    public string Source { get; set; } = string.Empty; // Hệ thống vận hành, import Excel
    public string Note { get; set; } = string.Empty;

    /// <summary>
    /// Đánh dấu sản lượng đã được dùng để đối soát tính thanh toán (không dùng 2 lần - T086)
    /// </summary>
    public bool IsReconciled { get; set; } = false;
    public Guid? ReconciledPaymentId { get; set; }

}
