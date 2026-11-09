namespace Qtkd.BuildingBlocks.Common;

/// <summary>
/// Cấu trúc dữ liệu kết quả phân trang dùng chung cho các phân hệ
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu của các phần tử trong danh sách</typeparam>
public class PagedResult<T>
{
    /// <summary>
    /// Danh sách bản ghi thuộc trang hiện tại
    /// </summary>
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();

    /// <summary>
    /// Chỉ số trang hiện tại (bắt đầu từ 1)
    /// </summary>
    public int PageIndex { get; init; }

    /// <summary>
    /// Số lượng bản ghi trên một trang
    /// </summary>
    public int PageSize { get; init; }

    /// <summary>
    /// Tổng số bản ghi thỏa mãn điều kiện lọc
    /// </summary>
    public int TotalCount { get; init; }

    /// <summary>
    /// Tổng số trang
    /// </summary>
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;

    /// <summary>
    /// Có trang trước đó hay không
    /// </summary>
    public bool HasPreviousPage => PageIndex > 1;

    /// <summary>
    /// Có trang tiếp theo hay không
    /// </summary>
    public bool HasNextPage => PageIndex < TotalPages;

    public PagedResult()
    {
    }

    public PagedResult(IReadOnlyList<T> items, int pageIndex, int pageSize, int totalCount)
    {
        Items = items;
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalCount = totalCount;
    }
}