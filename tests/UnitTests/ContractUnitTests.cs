using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Contracts.DTOs;
using Qtkd.Modules.Contracts.Entities;
using Qtkd.Modules.Contracts.Persistence;
using Qtkd.Modules.Contracts.Services;
using Qtkd.Modules.Contracts.Validators;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Customers.Persistence;
using Qtkd.Modules.Customers.Services;
using Qtkd.Modules.Customers.Validators;
using Xunit;

namespace Qtkd.UnitTests;

/// <summary>
/// Bộ unit test toàn diện cho phân hệ Hợp đồng (TASK-27 - CTR-01)
/// Kiểm tra:
/// 1. CreateContractValidator: logic ngày (EffectiveTo > EffectiveFrom), các trường bắt buộc, giá trị hợp đồng
/// 2. IContractCodeGenerator: quy tắc sinh mã tự động cấu hình doanh nghiệp (HD-{YYYY}-{NNNN})
/// 3. ContractService:
///    - Khởi tạo hợp đồng ở trạng thái Draft
///    - Kiểm tra khách hàng tồn tại và Active
///    - Chặn khách hàng tạm ngưng (Suspended)
///    - Xử lý trùng lặp mã hợp đồng
///    - Tra cứu chi tiết và ngoại lệ
/// </summary>
public class ContractUnitTests
{
    private readonly CreateContractValidator _validator = new();

    private ContractsDbContext CreateInMemoryContractsDb()
    {
        var options = new DbContextOptionsBuilder<ContractsDbContext>()
            .UseInMemoryDatabase(databaseName: $"ContractsDb_{Guid.NewGuid()}")
            .Options;
        return new ContractsDbContext(options);
    }

    private CustomersDbContext CreateInMemoryCustomersDb()
    {
        var options = new DbContextOptionsBuilder<CustomersDbContext>()
            .UseInMemoryDatabase(databaseName: $"CustomersDb_{Guid.NewGuid()}")
            .Options;
        return new CustomersDbContext(options);
    }

    private ICustomerService CreateCustomerService(CustomersDbContext db)
    {
        return new CustomerService(
            db,
            new CreateCustomerValidator(),
            new UpdateCustomerValidator(),
            new UpdateCustomerStatusValidator(),
            new GetCustomersQueryValidator());
    }

    #region CreateContractValidator Tests (TASK-27)

    [Fact]
    public void CreateContractValidator_WithValidData_ShouldPass()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng dịch vụ nâng hạ và lưu bãi container 2026",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 500_000_000m,
            Currency = "VND",
            PaymentTerms = "Thanh toán trong vòng 30 ngày kể từ ngày nhận hóa đơn",
            ServiceTerms = "Cung cấp dịch vụ bốc xếp tại cảng Cát Lái"
        };

        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateContractValidator_WithEmptyCustomerId_ShouldFail()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.Empty,
            Title = "Hợp đồng test",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 6, 30),
            ContractValue = 100_000_000m
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.CustomerId));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateContractValidator_WithEmptyTitle_ShouldFail(string? emptyTitle)
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = emptyTitle!,
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 6, 30),
            ContractValue = 100_000_000m
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.Title));
    }

    [Fact]
    public void CreateContractValidator_WithTitleExceeding250Chars_ShouldFail()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = new string('T', 251),
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 6, 30),
            ContractValue = 100_000_000m
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.Title));
    }

    [Fact]
    public void CreateContractValidator_WhenEffectiveToIsLessThanEffectiveFrom_ShouldFail()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng lỗi ngày",
            EffectiveFrom = new DateOnly(2026, 12, 31),
            EffectiveTo = new DateOnly(2026, 1, 1), // Ngày kết thúc nhỏ hơn ngày bắt đầu
            ContractValue = 100_000_000m
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.EffectiveTo));
        Assert.Contains("phải lớn hơn", result.Errors.First(e => e.PropertyName == nameof(CreateContractRequest.EffectiveTo)).ErrorMessage);
    }

    [Fact]
    public void CreateContractValidator_WhenEffectiveToEqualsEffectiveFrom_ShouldFail()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng cùng ngày",
            EffectiveFrom = new DateOnly(2026, 5, 1),
            EffectiveTo = new DateOnly(2026, 5, 1), // Cùng ngày
            ContractValue = 100_000_000m
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.EffectiveTo));
    }

    [Fact]
    public void CreateContractValidator_WhenEffectiveToGreaterThanEffectiveFrom_ShouldPass()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng ngày hợp lệ",
            EffectiveFrom = new DateOnly(2026, 5, 1),
            EffectiveTo = new DateOnly(2026, 5, 2), // Lớn hơn 1 ngày
            ContractValue = 100_000_000m
        };

        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateContractValidator_WithNegativeContractValue_ShouldFail()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng giá trị âm",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = -1m // Giá trị âm
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.ContractValue));
    }

    [Fact]
    public void CreateContractValidator_WithZeroContractValue_ShouldPass()
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng khung giá trị 0",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 0m
        };

        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("VND")]
    [InlineData("USD")]
    [InlineData("EUR")]
    public void CreateContractValidator_WithValidCurrency_ShouldPass(string currency)
    {
        var req = new CreateContractRequest
        {
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng ngoại tệ",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 1000m,
            Currency = currency
        };

        var result = _validator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateContractValidator_WithCodeExceeding30Chars_ShouldFail()
    {
        var req = new CreateContractRequest
        {
            Code = new string('C', 31),
            CustomerId = Guid.NewGuid(),
            Title = "Hợp đồng mã quá dài",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 1000m
        };

        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContractRequest.Code));
    }

    #endregion

    #region ContractCodeGenerator Tests (TASK-27)

    [Fact]
    public async Task ContractCodeGenerator_WhenNoContractsExist_GeneratesFirstSequence0001()
    {
        using var db = CreateInMemoryContractsDb();
        var generator = new ContractCodeGenerator(db);

        var date = new DateOnly(2026, 1, 15);
        var code = await generator.GenerateCodeAsync(date);

        Assert.Equal("HD-2026-0001", code);
    }

    [Fact]
    public async Task ContractCodeGenerator_WhenContractsExist_IncrementsToNextSequence()
    {
        using var db = CreateInMemoryContractsDb();
        db.Contracts.AddRange(
            new Contract { Id = Guid.NewGuid(), Code = "HD-2026-0001", Title = "HĐ 1", CustomerId = Guid.NewGuid() },
            new Contract { Id = Guid.NewGuid(), Code = "HD-2026-0002", Title = "HĐ 2", CustomerId = Guid.NewGuid() }
        );
        await db.SaveChangesAsync();

        var generator = new ContractCodeGenerator(db);
        var code = await generator.GenerateCodeAsync(new DateOnly(2026, 5, 20));

        Assert.Equal("HD-2026-0003", code);
    }

    [Fact]
    public async Task ContractCodeGenerator_WithDifferentYear_GeneratesCodeForThatYear()
    {
        using var db = CreateInMemoryContractsDb();
        db.Contracts.Add(new Contract { Id = Guid.NewGuid(), Code = "HD-2025-0099", Title = "HĐ năm ngoái", CustomerId = Guid.NewGuid() });
        await db.SaveChangesAsync();

        var generator = new ContractCodeGenerator(db);
        var code2026 = await generator.GenerateCodeAsync(new DateOnly(2026, 1, 1));

        Assert.Equal("HD-2026-0001", code2026);
    }

    #endregion

    #region ContractService - CreateDraftAsync Tests (TASK-27)

    [Fact]
    public async Task CreateDraftAsync_WhenValidRequestWithoutCode_GeneratesCodeAndSetsDraftStatus()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-ACT-01",
            Name = "Công ty TNHH Tiếp Vận Hàng Hải",
            TaxCode = "0101234567",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn Đại Diện",
            Status = CustomerStatus.Active
        };
        customersDb.Customers.Add(customer);
        await customersDb.SaveChangesAsync();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        var request = new CreateContractRequest
        {
            CustomerId = customer.Id,
            Title = "Hợp đồng dịch vụ kho bãi",
            EffectiveFrom = new DateOnly(2026, 3, 1),
            EffectiveTo = new DateOnly(2027, 2, 28),
            ContractValue = 350_000_000m,
            Currency = "VND",
            PaymentTerms = "Thanh toán theo tháng"
        };

        // Act
        var result = await contractService.CreateDraftAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("HD-2026-0001", result.Code);
        Assert.Equal(ContractStatus.Draft, result.Status);
        Assert.Equal("Draft", result.StatusName);
        Assert.Equal(customer.Id, result.CustomerId);
        Assert.Equal("Công ty TNHH Tiếp Vận Hàng Hải", result.CustomerName);
        Assert.Equal("CUST-ACT-01", result.CustomerCode);
        Assert.Equal("Hợp đồng dịch vụ kho bãi", result.Title);
        Assert.Equal(350_000_000m, result.ContractValue);

        // Kiểm tra trong database
        var entityInDb = await contractsDb.Contracts.FindAsync(result.Id);
        Assert.NotNull(entityInDb);
        Assert.Equal("HD-2026-0001", entityInDb.Code);
        Assert.Equal(ContractStatus.Draft, entityInDb.Status);
    }

    [Fact]
    public async Task CreateDraftAsync_WhenManualCodeProvided_UsesManualCode()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-ACT-02",
            Name = "Doanh Nghiệp Xuất Nhập Khẩu",
            TaxCode = "0300123456",
            Address = "TP.HCM",
            RepresentativeName = "Trần Thị B",
            Status = CustomerStatus.Active
        };
        customersDb.Customers.Add(customer);
        await customersDb.SaveChangesAsync();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        var request = new CreateContractRequest
        {
            Code = "HD-CUSTOM-2026",
            CustomerId = customer.Id,
            Title = "Hợp đồng chỉ định mã riêng",
            EffectiveFrom = new DateOnly(2026, 4, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 100_000_000m
        };

        // Act
        var result = await contractService.CreateDraftAsync(request);

        // Assert
        Assert.Equal("HD-CUSTOM-2026", result.Code);
    }

    [Fact]
    public async Task CreateDraftAsync_WhenDuplicateCode_ThrowsConflictException()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-ACT-03",
            Name = "Doanh Nghiệp A",
            TaxCode = "0300111222",
            Address = "TP.HCM",
            RepresentativeName = "Lê Văn C",
            Status = CustomerStatus.Active
        };
        customersDb.Customers.Add(customer);
        await customersDb.SaveChangesAsync();

        contractsDb.Contracts.Add(new Contract
        {
            Id = Guid.NewGuid(),
            Code = "HD-DUP-01",
            Title = "Hợp đồng đã có",
            CustomerId = customer.Id
        });
        await contractsDb.SaveChangesAsync();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        var request = new CreateContractRequest
        {
            Code = "hd-dup-01", // Trùng hoa thường
            CustomerId = customer.Id,
            Title = "Hợp đồng mới trùng mã",
            EffectiveFrom = new DateOnly(2026, 4, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 100_000_000m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => contractService.CreateDraftAsync(request));
        Assert.Contains("Mã hợp đồng", ex.Message);
        Assert.Contains("hd-dup-01", ex.Message);
    }

    [Fact]
    public async Task CreateDraftAsync_WhenCustomerDoesNotExist_ThrowsNotFoundException()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        var nonExistentCustomerId = Guid.NewGuid();
        var request = new CreateContractRequest
        {
            CustomerId = nonExistentCustomerId,
            Title = "Hợp đồng cho khách hàng không tồn tại",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 100_000_000m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<NotFoundException>(() => contractService.CreateDraftAsync(request));
        Assert.Contains(nonExistentCustomerId.ToString(), ex.Message);
    }

    [Fact]
    public async Task CreateDraftAsync_WhenCustomerIsSuspended_ThrowsConflictException()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var suspendedCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-SUSP-01",
            Name = "Công ty Đang Tạm Ngưng",
            TaxCode = "0109998888",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn D",
            Status = CustomerStatus.Suspended,
            SuspendedReason = "Nợ đọng cước bãi cảng",
            SuspendedAt = DateTimeOffset.UtcNow
        };
        customersDb.Customers.Add(suspendedCustomer);
        await customersDb.SaveChangesAsync();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        var request = new CreateContractRequest
        {
            CustomerId = suspendedCustomer.Id,
            Title = "Hợp đồng thử nghiệm cho khách hàng tạm ngưng",
            EffectiveFrom = new DateOnly(2026, 2, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 50_000_000m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => contractService.CreateDraftAsync(request));
        Assert.Contains("tạm ngưng", ex.Message);
        Assert.Contains("Suspended", ex.Message);
    }

    [Fact]
    public async Task CreateDraftAsync_WhenValidationFails_ThrowsValidationAppException()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        var invalidReq = new CreateContractRequest
        {
            CustomerId = Guid.Empty, // Trống
            Title = "", // Trống
            EffectiveFrom = new DateOnly(2026, 12, 31),
            EffectiveTo = new DateOnly(2026, 1, 1), // Ngày kết thúc < ngày bắt đầu
            ContractValue = -500m // Giá trị âm
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationAppException>(() => contractService.CreateDraftAsync(invalidReq));
        Assert.NotEmpty(ex.Errors);
        Assert.Contains(nameof(CreateContractRequest.CustomerId), ex.Errors.Keys);
        Assert.Contains(nameof(CreateContractRequest.Title), ex.Errors.Keys);
        Assert.Contains(nameof(CreateContractRequest.EffectiveTo), ex.Errors.Keys);
        Assert.Contains(nameof(CreateContractRequest.ContractValue), ex.Errors.Keys);
    }

    [Fact]
    public async Task GetByIdAsync_WhenContractExists_ReturnsContractDto()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-009",
            Name = "Khách Hàng Tra Cứu",
            TaxCode = "0109991111",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn E",
            Status = CustomerStatus.Active
        };
        customersDb.Customers.Add(customer);
        await customersDb.SaveChangesAsync();

        var contractId = Guid.NewGuid();
        contractsDb.Contracts.Add(new Contract
        {
            Id = contractId,
            Code = "HD-2026-9999",
            Title = "Hợp đồng tra cứu",
            CustomerId = customer.Id,
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 200_000_000m,
            Status = ContractStatus.Draft
        });
        await contractsDb.SaveChangesAsync();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        // Act
        var result = await contractService.GetByIdAsync(contractId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(contractId, result.Id);
        Assert.Equal("HD-2026-9999", result.Code);
        Assert.Equal("Khách Hàng Tra Cứu", result.CustomerName);
    }

    [Fact]
    public async Task GetByIdAsync_WhenContractNotFound_ThrowsNotFoundException()
    {
        // Arrange
        using var contractsDb = CreateInMemoryContractsDb();
        using var customersDb = CreateInMemoryCustomersDb();

        var customerService = CreateCustomerService(customersDb);
        var codeGenerator = new ContractCodeGenerator(contractsDb);
        var contractService = new ContractService(contractsDb, customerService, codeGenerator, _validator);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => contractService.GetByIdAsync(Guid.NewGuid()));
    }

    #endregion
}