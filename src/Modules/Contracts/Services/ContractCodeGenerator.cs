using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Qtkd.Modules.Contracts.Persistence;

namespace Qtkd.Modules.Contracts.Services;

public class ContractCodeGenerator : IContractCodeGenerator
{
    private readonly ContractsDbContext _dbContext;

    public ContractCodeGenerator(ContractsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<string> GenerateCodeAsync(DateOnly? effectiveDate = null, CancellationToken ct = default)
    {
        var year = effectiveDate?.Year ?? DateTime.UtcNow.Year;
        var prefix = $"HD-{year}-";

        // Lấy danh sách các mã hợp đồng hiện có trong năm
        var existingCodes = await _dbContext.Contracts
            .AsNoTracking()
            .Where(c => c.Code.StartsWith(prefix))
            .Select(c => c.Code)
            .ToListAsync(ct);

        var maxSeq = 0;
        foreach (var code in existingCodes)
        {
            if (code.Length > prefix.Length)
            {
                var suffix = code.Substring(prefix.Length);
                if (int.TryParse(suffix, out var seq) && seq > maxSeq)
                {
                    maxSeq = seq;
                }
            }
        }

        var nextSeq = maxSeq + 1;
        var generatedCode = $"{prefix}{nextSeq:D4}";

        // Phòng ngừa xung đột đồng thời, lặp nếu mã đã tồn tại
        while (existingCodes.Contains(generatedCode))
        {
            nextSeq++;
            generatedCode = $"{prefix}{nextSeq:D4}";
        }

        return generatedCode;
    }
}