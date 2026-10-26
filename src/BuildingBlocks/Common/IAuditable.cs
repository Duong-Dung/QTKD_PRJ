namespace Qtkd.BuildingBlocks.Common;

/// <summary>
/// Giao diện đánh dấu entity cần truy vết người tạo và người chỉnh sửa cuối.
/// </summary>
public interface IAuditable
{
    string? CreatedBy { get; set; }
    string? UpdatedBy { get; set; }
}
