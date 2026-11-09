using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Common;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Customers.Persistence;

namespace Qtkd.Modules.Customers.Services;

public class CustomerService : ICustomerService
{
    private readonly CustomersDbContext _dbContext;
    private readonly IValidator<CreateCustomerRequest> _createValidator;
    private readonly IValidator<UpdateCustomerRequest> _updateValidator;
    private readonly IValidator<UpdateCustomerStatusRequest>? _statusValidator;
    private readonly IValidator<GetCustomersQuery>? _queryValidator;

    public CustomerService(
        CustomersDbContext dbContext,
        IValidator<CreateCustomerRequest> createValidator,
        IValidator<UpdateCustomerRequest> updateValidator,
        IValidator<UpdateCustomerStatusRequest>? statusValidator = null,
        IValidator<GetCustomersQuery>? queryValidator = null)
    {
        _dbContext = dbContext;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _statusValidator = statusValidator;
        _queryValidator = queryValidator;
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerRequest request, CancellationToken ct = default)
    {
        // 1. Kiểm tra tính hợp lệ dữ liệu đầu vào bằng FluentValidation
        var validationResult = await _createValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationAppException(errors, "Dữ liệu tạo khách hàng không hợp lệ.");
        }

        var normalizedCode = request.Code.Trim();
        var normalizedTaxCode = request.TaxCode.Trim();

        // 2. Kiểm tra tính duy nhất của Mã khách hàng (Code)
        var codeExists = await _dbContext.Customers
            .AnyAsync(c => c.Code.ToLower() == normalizedCode.ToLower(), ct);
        if (codeExists)
        {
            throw new ConflictException($"Mã khách hàng '{normalizedCode}' đã tồn tại trong hệ thống.");
        }

        // 3. Kiểm tra tính duy nhất của Mã số thuế (TaxCode)
        var taxCodeExists = await _dbContext.Customers
            .AnyAsync(c => c.TaxCode == normalizedTaxCode, ct);
        if (taxCodeExists)
        {
            throw new ConflictException($"Mã số thuế '{normalizedTaxCode}' đã được đăng ký cho một khách hàng khác.");
        }

        // 4. Khởi tạo thực thể Customer
        var customer = new Customer
        {
            Id = Guid.CreateVersion7(),
            Code = normalizedCode,
            Name = request.Name.Trim(),
            TaxCode = normalizedTaxCode,
            Address = request.Address.Trim(),
            RepresentativeName = request.RepresentativeName.Trim(),
            RepresentativeTitle = request.RepresentativeTitle?.Trim(),
            ContactPerson = request.ContactPerson?.Trim(),
            ContactPhone = request.ContactPhone?.Trim(),
            ContactEmail = request.ContactEmail?.Trim(),
            Status = CustomerStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync(ct);

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(Guid id, UpdateCustomerRequest request, CancellationToken ct = default)
    {
        // 1. Kiểm tra tính hợp lệ dữ liệu đầu vào bằng FluentValidation
        var validationResult = await _updateValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationAppException(errors, "Dữ liệu cập nhật khách hàng không hợp lệ.");
        }

        // 2. Kiểm tra sự tồn tại của khách hàng
        var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", id);
        }

        var normalizedTaxCode = request.TaxCode.Trim();

        // 3. Kiểm tra tính duy nhất của TaxCode loại trừ khách hàng hiện tại
        var taxCodeConflict = await _dbContext.Customers
            .AnyAsync(c => c.Id != id && c.TaxCode == normalizedTaxCode, ct);
        if (taxCodeConflict)
        {
            throw new ConflictException($"Mã số thuế '{normalizedTaxCode}' đã được đăng ký cho một khách hàng khác.");
        }

        // 4. Cập nhật các trường thông tin
        customer.Name = request.Name.Trim();
        customer.TaxCode = normalizedTaxCode;
        customer.Address = request.Address.Trim();
        customer.RepresentativeName = request.RepresentativeName.Trim();
        customer.RepresentativeTitle = request.RepresentativeTitle?.Trim();
        customer.ContactPerson = request.ContactPerson?.Trim();
        customer.ContactPhone = request.ContactPhone?.Trim();
        customer.ContactEmail = request.ContactEmail?.Trim();
        customer.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateStatusAsync(Guid id, UpdateCustomerStatusRequest request, CancellationToken ct = default)
    {
        // 1. Kiểm tra tính hợp lệ dữ liệu nếu có validator
        if (_statusValidator != null)
        {
            var validationResult = await _statusValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                throw new ValidationAppException(errors, "Dữ liệu cập nhật trạng thái khách hàng không hợp lệ.");
            }
        }

        // 2. Kiểm tra sự tồn tại của khách hàng
        var customer = await _dbContext.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", id);
        }

        // 3. Cập nhật trạng thái
        customer.Status = request.Status;
        if (request.Status == CustomerStatus.Suspended)
        {
            customer.SuspendedReason = request.Reason?.Trim();
            customer.SuspendedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            customer.SuspendedReason = null;
            customer.SuspendedAt = null;
        }

        customer.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(ct);

        return MapToDto(customer);
    }

    public async Task<PagedResult<CustomerDto>> GetPagedAsync(GetCustomersQuery query, CancellationToken ct = default)
    {
        // 1. Kiểm tra tính hợp lệ tham số truy vấn nếu có validator
        if (_queryValidator != null)
        {
            var validationResult = await _queryValidator.ValidateAsync(query, ct);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                throw new ValidationAppException(errors, "Tham số truy vấn danh sách khách hàng không hợp lệ.");
            }
        }

        var pageIndex = query.PageIndex < 1 ? 1 : query.PageIndex;
        var pageSize = query.PageSize < 1 ? 10 : (query.PageSize > 100 ? 100 : query.PageSize);

        var dbQuery = _dbContext.Customers.AsNoTracking().AsQueryable();

        // 2. Lọc theo trạng thái hoạt động (Active / Suspended)
        if (query.Status.HasValue)
        {
            dbQuery = dbQuery.Where(c => c.Status == query.Status.Value);
        }

        // 3. Tìm kiếm theo từ khóa (Mã khách hàng, Tên công ty hoặc MST)
        var keyword = (!string.IsNullOrWhiteSpace(query.SearchTerm) ? query.SearchTerm : query.Keyword)?.Trim().ToLower();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            dbQuery = dbQuery.Where(c =>
                c.Code.ToLower().Contains(keyword) ||
                c.Name.ToLower().Contains(keyword) ||
                c.TaxCode.ToLower().Contains(keyword));
        }

        // 4. Tổng số bản ghi thỏa mãn điều kiện
        var totalCount = await dbQuery.CountAsync(ct);

        // 5. Phân trang và sắp xếp (ưu tiên khách hàng tạo gần nhất lên đầu, thứ tự ổn định theo mã)
        var items = await dbQuery
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Code)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToDto).ToList();

        return new PagedResult<CustomerDto>(dtos, pageIndex, pageSize, totalCount);
    }

    public async Task<CustomerDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var customer = await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (customer == null)
        {
            throw new NotFoundException("Khách hàng", id);
        }

        return MapToDto(customer);
    }

    public async Task<CustomerDto?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;

        var normalizedCode = code.Trim().ToLower();
        var customer = await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Code.ToLower() == normalizedCode, ct);

        return customer == null ? null : MapToDto(customer);
    }

    private static CustomerDto MapToDto(Customer c)
    {
        return new CustomerDto
        {
            Id = c.Id,
            Code = c.Code,
            Name = c.Name,
            TaxCode = c.TaxCode,
            Address = c.Address,
            RepresentativeName = c.RepresentativeName,
            RepresentativeTitle = c.RepresentativeTitle,
            ContactPerson = c.ContactPerson,
            ContactPhone = c.ContactPhone,
            ContactEmail = c.ContactEmail,
            Status = c.Status,
            SuspendedReason = c.SuspendedReason,
            SuspendedAt = c.SuspendedAt,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            CreatedBy = c.CreatedBy,
            UpdatedBy = c.UpdatedBy
        };
    }
}