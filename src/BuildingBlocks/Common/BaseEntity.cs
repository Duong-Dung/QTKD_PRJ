namespace Qtkd.BuildingBlocks.Common;

/// <summary>
/// Thực thể cơ sở cho toàn bộ entity trong hệ thống.
/// Hỗ trợ Id chuẩn GUID, mốc thời gian UTC và token xmin chống race condition trên PostgreSQL.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// Concurrency token ánh xạ vào hệ thống xmin của PostgreSQL.
    /// Giúp phát hiện xung đột ghi đè (Optimistic Concurrency Control).
    /// </summary>
    public uint RowVersion { get; set; }
}
