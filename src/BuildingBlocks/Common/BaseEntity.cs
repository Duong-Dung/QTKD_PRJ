namespace Qtkd.BuildingBlocks.Common;

/// <summary>
/// Thực thể có khóa chính UUID v7, mốc thời gian UTC và xmin (RowVersion) trên PostgreSQL.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// Token xmin của PostgreSQL. Không phải cột vật lý; migration không tạo cột này.
    /// </summary>
    public uint RowVersion { get; set; }
}
