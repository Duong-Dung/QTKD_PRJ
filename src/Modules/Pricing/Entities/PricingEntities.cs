using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Pricing.Entities;

public enum PriceListStatus
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    Rejected = 4,
    Effective = 5,
    Superseded = 6,
    Expired = 7
}

public class PriceList : BaseEntity, IAuditable
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public Guid? ContractId { get; set; }
    public string ServiceCategory { get; set; } = string.Empty;
    public DateTimeOffset ValidFrom { get; set; }
    public DateTimeOffset ValidTo { get; set; }
    public int Version { get; set; } = 1;
    public PriceListStatus Status { get; set; } = PriceListStatus.Draft;
    
    /// <summary>
    /// Đánh dấu bảng giá đã được dùng để tính thanh toán (PRC-05: không cho sửa, phải sinh version mới)
    /// </summary>
    public bool IsUsed { get; set; } = false;

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public ICollection<PriceItem> Items { get; set; } = new List<PriceItem>();
}

public class PriceItem : BaseEntity
{
    public Guid PriceListId { get; set; }
    public PriceList? PriceList { get; set; }

    public string ServiceCode { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty; // container, tấn, chuyến, ngày lưu kho
    public decimal UnitPrice { get; set; }
}
