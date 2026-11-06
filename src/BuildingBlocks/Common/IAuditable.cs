namespace Qtkd.BuildingBlocks.Common;

/// <summary>
/// Người tạo / người sửa cuối. Không có khóa ngoại tới users (job hệ thống ghi null).
/// </summary>
public interface IAuditable
{
    Guid? CreatedBy { get; set; }
    Guid? UpdatedBy { get; set; }
}
