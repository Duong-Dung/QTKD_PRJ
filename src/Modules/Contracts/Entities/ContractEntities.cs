using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.Contracts.Entities;

public enum ContractStatus
{
    Draft,
    Submitted,
    UnderReview,
    Approved,
    Active,
    Expired,
    Rejected,
    RevisionRequested,
    Cancelled
}

public enum AddendumChangeType
{
    PriceChange,
    ExtendTerm,
    PaymentTerms,
    AddService
}

public class Contract : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly EffectiveTo { get; set; }
    public decimal ContractValue { get; set; }
    public string Currency { get; set; } = "VND";
    public string? PaymentTerms { get; set; }
    public string? ServiceTerms { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public Guid OwnerUserId { get; set; }
    public Guid? RevisionOfContractId { get; set; }
    public string? CancelledReason { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }

    public Contract? RevisionOfContract { get; set; }
    public ICollection<Contract> Revisions { get; set; } = new List<Contract>();
    public ICollection<ContractAttachment> Attachments { get; set; } = new List<ContractAttachment>();
    public ICollection<ContractAddendum> Addenda { get; set; } = new List<ContractAddendum>();
}

public class ContractAttachment : AuditableEntity
{
    public Guid ContractId { get; set; }
    public Guid? AddendumId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? Checksum { get; set; }
    public bool IsMainDocument { get; set; }

    public Contract? Contract { get; set; }
    public ContractAddendum? Addendum { get; set; }
}

public class ContractAddendum : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public Guid ContractId { get; set; }
    public Guid OwnerUserId { get; set; }
    public AddendumChangeType ChangeType { get; set; }
    public string? Description { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? NewEffectiveTo { get; set; }
    public string? NewPaymentTerms { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;

    public Contract? Contract { get; set; }
    public ICollection<ContractAttachment> Attachments { get; set; } = new List<ContractAttachment>();
}
