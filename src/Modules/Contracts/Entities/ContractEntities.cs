using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Contracts.Entities;

public enum ContractStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    Approved = 4,
    RevisionRequested = 5,
    Rejected = 6,
    Active = 7,
    Expired = 8,
    Cancelled = 9
}

public class Contract : BaseEntity, IAuditable
{
    public string ContractNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public decimal Value { get; set; }
    public string PaymentTerms { get; set; } = string.Empty;
    public string ServiceTerms { get; set; } = string.Empty;
    public ContractStatus Status { get; set; } = ContractStatus.Draft;

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public ICollection<ContractAttachment> Attachments { get; set; } = new List<ContractAttachment>();
    public ICollection<ContractAddendum> Addendums { get; set; } = new List<ContractAddendum>();
}

public class ContractAttachment : BaseEntity
{
    public Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
}

public class ContractAddendum : BaseEntity, IAuditable
{
    public Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public string AddendumNumber { get; set; } = string.Empty;
    public string ChangeType { get; set; } = string.Empty; // Đơn giá, Thời hạn, Điều khoản thanh toán, Dịch vụ
    public decimal? NewValue { get; set; }
    public DateTimeOffset EffectiveDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public ContractStatus Status { get; set; } = ContractStatus.Draft;

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
