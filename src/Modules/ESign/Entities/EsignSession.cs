using Qtkd.BuildingBlocks.Common;

namespace Qtkd.Modules.ESign.Entities;

public enum EsignSessionStatus
{
    PendingSend = 1,
    Signing = 2,
    Signed = 3,
    Failed = 4,
    Cancelled = 5
}

public class EsignSession : BaseEntity, IAuditable
{
    public Guid DocumentId { get; set; } // Reference to PaymentStatement or Contract
    public string DocumentType { get; set; } = "PaymentStatement";
    public string DocumentHash { get; set; } = string.Empty;
    public string SignerEmail { get; set; } = string.Empty;
    public string SignerName { get; set; } = string.Empty;
    public string CallbackUrl { get; set; } = string.Empty;
    public EsignSessionStatus Status { get; set; } = EsignSessionStatus.PendingSend;
    public DateTimeOffset? SignedAt { get; set; }
    public string? FailureReason { get; set; }

    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
