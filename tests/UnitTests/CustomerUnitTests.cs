using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Customers.Persistence;
using Qtkd.Modules.Customers.Services;
using Qtkd.Modules.Customers.Validators;
using Xunit;

namespace Qtkd.UnitTests;

public class CustomerUnitTests
{
    private readonly CreateCustomerValidator _createValidator = new();
    private readonly UpdateCustomerValidator _updateValidator = new();

    private CustomersDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<CustomersDbContext>()
            .UseInMemoryDatabase(databaseName: $"CustomersDb_{Guid.NewGuid()}")
            .Options;

        return new CustomersDbContext(options);
    }

    #region Validator Tests

    [Fact]
    public void CreateCustomerValidator_WithValidData10DigitTaxCode_ShouldPass()
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-001",
            Name = "Công ty TNHH Tiếp vận Biển Đông",
            TaxCode = "0101234567",
            Address = "123 Cảng Sài Gòn, Q.4, TP.HCM",
            RepresentativeName = "Nguyễn Văn A",
            RepresentativeTitle = "Giám đốc điều hành",
            ContactPerson = "Trần Thị B",
            ContactPhone = "0901234567",
            ContactEmail = "contact@biendong.com"
        };

        var result = _createValidator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateCustomerValidator_WithValidData13DigitTaxCode_ShouldPass()
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-002",
            Name = "Chi nhánh Cảng Biển Đông Hải Phòng",
            TaxCode = "0101234567-001",
            Address = "456 Đường Lê Thánh Tông, Hải Phòng",
            RepresentativeName = "Lê Văn C"
        };

        var result = _createValidator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CreateCustomerValidator_WithEmptyCode_ShouldFail(string? code)
    {
        var req = new CreateCustomerRequest
        {
            Code = code!,
            Name = "Công ty TNHH ABC",
            TaxCode = "0101234567",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        };

        var result = _createValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerRequest.Code));
    }

    [Fact]
    public void CreateCustomerValidator_WithCodeTooLong_ShouldFail()
    {
        var req = new CreateCustomerRequest
        {
            Code = "THIS_CODE_IS_WAY_TOO_LONG_EXCEEDING_20_CHARS",
            Name = "Công ty ABC",
            TaxCode = "0101234567",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        };

        var result = _createValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerRequest.Code));
    }

    [Theory]
    [InlineData("123456789")]       // 9 số
    [InlineData("12345678901")]     // 11 số
    [InlineData("0101234567-01")]   // 13 số nhưng thiếu 1 số đuôi
    [InlineData("010123456A")]      // Chứa chữ cái
    [InlineData("ABC1234567")]      // Chứa chữ cái
    [InlineData("0101234567/001")]  // Dấu / thay vì -
    public void CreateCustomerValidator_WithInvalidTaxCode_ShouldFail(string invalidTaxCode)
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-003",
            Name = "Công ty ABC",
            TaxCode = invalidTaxCode,
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        };

        var result = _createValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerRequest.TaxCode));
    }

    [Fact]
    public void CreateCustomerValidator_WithInvalidEmail_ShouldFail()
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-004",
            Name = "Công ty ABC",
            TaxCode = "0101234567",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A",
            ContactEmail = "invalid-email-address"
        };

        var result = _createValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerRequest.ContactEmail));
    }

    [Fact]
    public void UpdateCustomerValidator_WithValidData_ShouldPass()
    {
        var req = new UpdateCustomerRequest
        {
            Name = "Công ty CP Cảng Quốc Tế Tân Cảng",
            TaxCode = "0300123456",
            Address = "Tân Cảng, TP. Hồ Chí Minh",
            RepresentativeName = "Nguyễn Văn D",
            ContactPhone = "02838123456"
        };

        var result = _updateValidator.Validate(req);
        Assert.True(result.IsValid);
    }

    #endregion

    #region Service Tests

    [Fact]
    public async Task CustomerService_CreateAsync_WhenValidRequest_CreatesCustomer()
    {
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var req = new CreateCustomerRequest
        {
            Code = "CUST-100",
            Name = "Công ty Cổ phần Vận tải Biển Nam Triệu",
            TaxCode = "0200987654",
            Address = "Bến Bính, Minh Đức, Thủy Nguyên, Hải Phòng",
            RepresentativeName = "Phạm Văn E",
            RepresentativeTitle = "Tổng Giám đốc",
            ContactPhone = "0912345678",
            ContactEmail = "info@namtrieu.vn"
        };

        var created = await service.CreateAsync(req);

        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("CUST-100", created.Code);
        Assert.Equal("0200987654", created.TaxCode);
        Assert.Equal(CustomerStatus.Active, created.Status);

        var entityInDb = await dbContext.Customers.FirstOrDefaultAsync(c => c.Id == created.Id);
        Assert.NotNull(entityInDb);
        Assert.Equal("CUST-100", entityInDb.Code);
    }

    [Fact]
    public async Task CustomerService_CreateAsync_WhenDuplicateCode_ThrowsConflictException()
    {
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-DUP",
            Name = "Existing Customer",
            TaxCode = "0100000001",
            Address = "Hanoi",
            RepresentativeName = "Nguyen Van A"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var req = new CreateCustomerRequest
        {
            Code = "cust-dup", // Test case-insensitive duplicate check
            Name = "Another Customer",
            TaxCode = "0100000002",
            Address = "Danang",
            RepresentativeName = "Le Van B"
        };

        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(req));
        Assert.Contains("Mã khách hàng", ex.Message);
    }

    [Fact]
    public async Task CustomerService_CreateAsync_WhenDuplicateTaxCode_ThrowsConflictException()
    {
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-001",
            Name = "Existing Customer",
            TaxCode = "0109999999",
            Address = "Hanoi",
            RepresentativeName = "Nguyen Van A"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var req = new CreateCustomerRequest
        {
            Code = "CUST-002",
            Name = "Another Customer",
            TaxCode = "0109999999", // Duplicate TaxCode
            Address = "Danang",
            RepresentativeName = "Le Van B"
        };

        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(req));
        Assert.Contains("Mã số thuế", ex.Message);
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenCustomerNotFound_ThrowsNotFoundException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var req = new UpdateCustomerRequest
        {
            Name = "Updated Name",
            TaxCode = "0101234567",
            Address = "Updated Address",
            RepresentativeName = "Updated Rep"
        };

        await Assert.ThrowsAsync<NotFoundException>(() => service.UpdateAsync(Guid.NewGuid(), req));
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenDuplicateTaxCodeOnAnotherCustomer_ThrowsConflictException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var cust1 = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-01",
            Name = "Customer 1",
            TaxCode = "0101111111",
            Address = "Hanoi",
            RepresentativeName = "Rep 1"
        };
        var cust2 = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-02",
            Name = "Customer 2",
            TaxCode = "0102222222",
            Address = "Hanoi",
            RepresentativeName = "Rep 2"
        };
        dbContext.Customers.AddRange(cust1, cust2);
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Cố tình sửa TaxCode của cust2 thành trùng với cust1
        var updateReq = new UpdateCustomerRequest
        {
            Name = "Customer 2 Updated",
            TaxCode = "0101111111", // Đã thuộc cust1
            Address = "Hanoi",
            RepresentativeName = "Rep 2"
        };

        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.UpdateAsync(cust2.Id, updateReq));
        Assert.Contains("Mã số thuế", ex.Message);
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenValidData_UpdatesAndReturnsDto()
    {
        using var dbContext = CreateInMemoryDbContext();
        var cust = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-05",
            Name = "Tên Cũ",
            TaxCode = "0105555555",
            Address = "Địa chỉ cũ",
            RepresentativeName = "Đại diện cũ"
        };
        dbContext.Customers.Add(cust);
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var updateReq = new UpdateCustomerRequest
        {
            Name = "Tên Mới",
            TaxCode = "0105555555", // Giữ nguyên TaxCode của chính mình
            Address = "Địa chỉ mới",
            RepresentativeName = "Đại diện mới",
            RepresentativeTitle = "Chủ tịch HĐQT",
            ContactPerson = "Trợ lý tổng giám đốc",
            ContactPhone = "0988776655",
            ContactEmail = "troly@newname.com"
        };

        var updated = await service.UpdateAsync(cust.Id, updateReq);

        Assert.Equal("Tên Mới", updated.Name);
        Assert.Equal("Địa chỉ mới", updated.Address);
        Assert.Equal("Đại diện mới", updated.RepresentativeName);
        Assert.Equal("Chủ tịch HĐQT", updated.RepresentativeTitle);
        Assert.NotNull(updated.UpdatedAt);
    }

    #endregion
}
