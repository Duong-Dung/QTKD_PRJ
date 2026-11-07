namespace Qtkd.BuildingBlocks.Common;

/// <summary>
/// Bảng nghiệp vụ có created_by / updated_by (TASK-12).
/// </summary>
public abstract class AuditableEntity : BaseEntity, IAuditable
{
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
