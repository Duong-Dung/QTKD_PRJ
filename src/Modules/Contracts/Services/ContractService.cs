using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.BuildingBlocks.Common;
using Qtkd.Modules.Contracts.DTOs;
using Qtkd.Modules.Contracts.Entities;
using Qtkd.Modules.Contracts.Persistence;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Customers.Services;

namespace Qtkd.Modules.Contracts.Services;

public class ContractService : IContractService
{
    private readonly ContractsDbContext _dbContext;
    private readonly ICustomerService _customerService;
    private readonly IContractCodeGenerator _codeGenerator;
    private readonly IValidator<CreateContractRequest> _createValidator;

    public ContractService(
        ContractsDbContext dbContext,
        ICustomerService customerService,
        IContractCodeGenerator codeGenerator,
        IValidator<CreateContractRequest> createValidator)
    {
        _dbContext = dbContext;
        _customerService = customerService;
        _codeGenerator = codeGenerator;
        _createValidator = createValidator;
    }

    public async Task<ContractDto> CreateDraftAsync(CreateContractRequest request, CancellationToken ct = default)
    {
        // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào qua FluentValidation
        var validationResult = await _createValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationAppException(errors, "Dữ liệu tạo hợp đồng nháp không hợp lệ.");
        }

        // 2. Kiểm tra khách hàng tồn tại và đang ở trạng thái kích hoạt (Active)
        CustomerDto customer;
        try
        {
            customer = await _customerService.GetByIdAsync(request.CustomerId, ct);
        }
        catch (NotFoundException)
        {
            throw new NotFoundException($"Khách hàng với ID '{request.CustomerId}' không tồn tại trong hệ thống.");
        }

        if (customer.Status != CustomerStatus.Active)
        {
            throw new ConflictException(
                $"Khách hàng '{customer.Name}' ({customer.Code}) đang trong trạng thái tạm ngưng (Suspended), không thể tạo hợp đồng mới.");
        }

        // 3. Xử lý mã hợp đồng (sinh tự động theo quy tắc cấu hình HD-{YYYY}-{NNNN} nếu để trống)
        string code;
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            code = await _codeGenerator.GenerateCodeAsync(request.EffectiveFrom, ct);
        }
        else
        {
            code = request.Code.Trim();
            var codeExists = await _dbContext.Contracts
                .AnyAsync(c => c.Code.ToLower() == code.ToLower(), ct);
            if (codeExists)
            {
                throw new ConflictException($"Mã hợp đồng '{code}' đã tồn tại trong hệ thống.");
            }
        }

        // 4. Khởi tạo thực thể Contract ở trạng thái Draft
        var contract = new Contract
        {
            Id = Guid.CreateVersion7(),
            Code = code,
            CustomerId = customer.Id,
            Title = request.Title.Trim(),
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            ContractValue = request.ContractValue,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency.Trim().ToUpperInvariant(),
            PaymentTerms = request.PaymentTerms?.Trim(),
            ServiceTerms = request.ServiceTerms?.Trim(),
            Status = ContractStatus.Draft,
            OwnerUserId = request.OwnerUserId ?? Guid.Empty,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Contracts.Add(contract);
        await _dbContext.SaveChangesAsync(ct);

        return MapToDto(contract, customer);
    }

    /// <summary>Chỉ truy vấn đọc; không làm thay đổi trạng thái hợp đồng.</summary>
    public async Task<PagedResult<ContractDto>> GetPagedAsync(GetContractsQuery query, CancellationToken ct = default)
    {
        if (query.PageIndex < 1)
            throw new ValidationAppException(nameof(query.PageIndex), "PageIndex phải lớn hơn hoặc bằng 1.");
        if (query.PageSize < 1 || query.PageSize > 100)
            throw new ValidationAppException(nameof(query.PageSize), "PageSize phải từ 1 đến 100.");
        if (query.EffectiveFrom.HasValue && query.EffectiveTo.HasValue &&
            query.EffectiveFrom.Value > query.EffectiveTo.Value)
            throw new ValidationAppException(nameof(query.EffectiveTo), "EffectiveTo phải lớn hơn hoặc bằng EffectiveFrom.");
        if (!Enum.IsDefined(query.Status.GetValueOrDefault()) && query.Status.HasValue)
            throw new ValidationAppException(nameof(query.Status), "Trạng thái hợp đồng không hợp lệ.");

        var contracts = _dbContext.Contracts.AsNoTracking().AsQueryable();
        if (query.Status.HasValue)
            contracts = contracts.Where(c => c.Status == query.Status.Value);
        if (query.CustomerId.HasValue)
            contracts = contracts.Where(c => c.CustomerId == query.CustomerId.Value);
        if (query.OwnerUserId.HasValue)
            contracts = contracts.Where(c => c.OwnerUserId == query.OwnerUserId.Value);
        if (query.EffectiveFrom.HasValue)
            contracts = contracts.Where(c => c.EffectiveFrom >= query.EffectiveFrom.Value);
        if (query.EffectiveTo.HasValue)
            contracts = contracts.Where(c => c.EffectiveTo <= query.EffectiveTo.Value);

        var keyword = query.Keyword?.Trim().ToLower();
        if (!string.IsNullOrEmpty(keyword))
            contracts = contracts.Where(c => c.Code.ToLower().Contains(keyword) ||
                                              c.Title.ToLower().Contains(keyword));

        var totalCount = await contracts.CountAsync(ct);
        var items = await contracts
            .OrderByDescending(c => c.CreatedAt)
            .ThenBy(c => c.Id)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        // Dùng CustomerService sẵn có, không truy cập trực tiếp bảng của module khác.
        // Tối ưu hóa: cache theo CustomerId trong cùng một request để tránh gọi lặp.
        var customerCache = new Dictionary<Guid, CustomerDto?>();
        var result = new List<ContractDto>(items.Count);
        foreach (var contract in items)
        {
            if (!customerCache.TryGetValue(contract.CustomerId, out var customer))
            {
                try { customer = await _customerService.GetByIdAsync(contract.CustomerId, ct); }
                catch (NotFoundException) { customer = null; }
                customerCache[contract.CustomerId] = customer;
            }
            result.Add(MapToDto(contract, customer));
        }
        return new PagedResult<ContractDto>(result, query.PageIndex, query.PageSize, totalCount);
    }

    public async Task<ContractDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var contract = await _dbContext.Contracts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (contract == null)
        {
            throw new NotFoundException("Hợp đồng", id);
        }

        CustomerDto? customer = null;
        try
        {
            customer = await _customerService.GetByIdAsync(contract.CustomerId, ct);
        }
        catch (NotFoundException)
        {
            // Bỏ qua nếu khách hàng không tìm thấy
        }

        return MapToDto(contract, customer);
    }

    private static ContractDto MapToDto(Contract c, CustomerDto? customer = null)
    {
        return new ContractDto
        {
            Id = c.Id,
            Code = c.Code,
            CustomerId = c.CustomerId,
            CustomerName = customer?.Name,
            CustomerCode = customer?.Code,
            Title = c.Title,
            EffectiveFrom = c.EffectiveFrom,
            EffectiveTo = c.EffectiveTo,
            ContractValue = c.ContractValue,
            Currency = c.Currency,
            PaymentTerms = c.PaymentTerms,
            ServiceTerms = c.ServiceTerms,
            Status = c.Status,
            OwnerUserId = c.OwnerUserId,
            RevisionOfContractId = c.RevisionOfContractId,
            CancelledReason = c.CancelledReason,
            CancelledAt = c.CancelledAt,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            CreatedBy = c.CreatedBy,
            UpdatedBy = c.UpdatedBy
        };
    }
}