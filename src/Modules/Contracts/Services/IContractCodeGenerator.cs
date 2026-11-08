namespace Qtkd.Modules.Contracts.Services;

public interface IContractCodeGenerator
{
    /// <summary>
    /// Sinh mã hợp đồng tự động theo quy tắc cấu hình của doanh nghiệp (HD-{YYYY}-{NNNN})
    /// </summary>
    /// <param name="effectiveDate">Ngày hiệu lực để lấy năm (mặc định năm hiện tại)</param>
    /// <param name="ct">CancellationToken</param>
    /// <returns>Mã hợp đồng tự động duy nhất</returns>
    Task<string> GenerateCodeAsync(DateOnly? effectiveDate = null, CancellationToken ct = default);
}