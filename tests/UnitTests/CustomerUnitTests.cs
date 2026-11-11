using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Customers.Persistence;
using Qtkd.Modules.Customers.Services;
using Qtkd.Modules.Customers.Validators;
using Xunit;

namespace Qtkd.UnitTests;

/// <summary>
/// Bộ unit test toàn diện cho phân hệ Khách hàng (TASK-22, TASK-24)
/// Kiểm tra:
/// 1. Các hàm validate CustomerCode và TaxCode (CustomerValidationRules)
/// 2. Validator FluentValidation (CreateCustomerValidator, UpdateCustomerValidator)
/// 3. Xử lý trùng lặp CustomerCode (phân biệt/không phân biệt hoa thường, khoảng trắng)
/// 4. Xử lý trùng lặp TaxCode khi tạo và cập nhật
/// 5. Các hàm tra cứu và ngoại lệ nghiệp vụ trong CustomerService
/// </summary>
public class CustomerUnitTests
{
    private readonly CreateCustomerValidator _createValidator = new();
    private readonly UpdateCustomerValidator _updateValidator = new();
    private readonly UpdateCustomerStatusValidator _statusValidator = new();
    private readonly GetCustomersQueryValidator _queryValidator = new();

    private CustomersDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<CustomersDbContext>()
            .UseInMemoryDatabase(databaseName: $"CustomersDb_{Guid.NewGuid()}")
            .Options;

        return new CustomersDbContext(options);
    }

    #region CustomerValidationRules Tests (TASK-24)

    [Theory]
    [InlineData("CUST-001")]
    [InlineData("KH_2026_HN")]
    [InlineData("ABC")] // Độ dài tối thiểu 3 ký tự
    [InlineData("A-1")]
    [InlineData("A_1")]
    [InlineData("123")]
    [InlineData("12345678901234567890")] // Độ dài tối đa 20 ký tự
    [InlineData("CUST-LONG-CODE-00001")] // Đúng 20 ký tự
    [InlineData("cust-lowercase-01")]
    [InlineData("  CUST-TRIM-01  ")] // Khoảng trắng 2 đầu được cắt bỏ
    public void CustomerValidationRules_IsValidCustomerCode_WithValidCodes_ReturnsTrue(string validCode)
    {
        // Act
        var result = CustomerValidationRules.IsValidCustomerCode(validCode);

        // Assert
        Assert.True(result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("A")] // Quá ngắn (1 ký tự)
    [InlineData("AB")] // Quá ngắn (2 ký tự)
    [InlineData("123456789012345678901")] // Quá dài (21 ký tự)
    [InlineData("CUST-OVERFLOW-CODE-21C")] // Quá dài (22 ký tự)
    [InlineData("CUST 001")] // Chứa khoảng trắng ở giữa
    [InlineData("CUST.001")] // Chứa dấu chấm không hợp lệ
    [InlineData("CUST@01")] // Chứa ký tự đặc biệt @
    [InlineData("CUST#01")] // Chứa ký tự đặc biệt #
    [InlineData("CUST$01")] // Chứa ký tự đặc biệt $
    [InlineData("CUST*01")] // Chứa ký tự đặc biệt *
    [InlineData("KHÁCH_HÀNG")] // Chứa ký tự tiếng Việt có dấu
    [InlineData("CÔNG_TY_01")] // Chứa ký tự tiếng Việt có dấu
    public void CustomerValidationRules_IsValidCustomerCode_WithInvalidCodes_ReturnsFalse(string? invalidCode)
    {
        // Act
        var result = CustomerValidationRules.IsValidCustomerCode(invalidCode);

        // Assert
        Assert.False(result);
    }

    [Theory]
    [InlineData("0101234567")] // Mã số thuế 10 chữ số (Hà Nội)
    [InlineData("0300123456")] // Mã số thuế 10 chữ số (TP.HCM)
    [InlineData("0000000000")] // 10 chữ số biên
    [InlineData("9999999999")] // 10 chữ số biên
    [InlineData("0101234567-001")] // Mã số thuế 13 chữ số chi nhánh có dấu gạch ngang
    [InlineData("0300123456-999")] // Chi nhánh 999
    [InlineData("  0101234567  ")] // Khoảng trắng 2 đầu được cắt bỏ hợp lệ
    [InlineData("  0101234567-001  ")] // Khoảng trắng 2 đầu được cắt bỏ hợp lệ
    public void CustomerValidationRules_IsValidTaxCode_WithValidTaxCodes_ReturnsTrue(string validTaxCode)
    {
        // Act
        var result = CustomerValidationRules.IsValidTaxCode(validTaxCode);

        // Assert
        Assert.True(result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("123456789")] // 9 số (thiếu 1 số)
    [InlineData("12345678")] // 8 số
    [InlineData("123")] // Quá ngắn
    [InlineData("12345678901")] // 11 số liền (không có gạch ngang)
    [InlineData("123456789012")] // 12 số liền
    [InlineData("0101234567001")] // 13 số liền (thiếu dấu gạch ngang)
    [InlineData("01012345670001")] // 14 số liền
    [InlineData("0101234567-01")] // Đuôi chi nhánh chỉ có 2 chữ số (phải là 3 chữ số)
    [InlineData("0101234567-1")] // Đuôi chi nhánh chỉ có 1 chữ số
    [InlineData("0101234567-0001")] // Đuôi chi nhánh 4 chữ số (vượt quá)
    [InlineData("0101234567_001")] // Dấu gạch dưới thay vì gạch ngang
    [InlineData("0101234567.001")] // Dấu chấm thay vì gạch ngang
    [InlineData("0101234567/001")] // Dấu gạch chéo thay vì gạch ngang
    [InlineData("0101234567 001")] // Dấu khoảng trắng thay vì gạch ngang
    [InlineData("010123456A")] // Chứa chữ cái trong mã 10 số
    [InlineData("ABC1234567")] // Chứa chữ cái ở đầu
    [InlineData("0101234567-00A")] // Chứa chữ cái trong mã chi nhánh
    [InlineData("0101234567-ABC")] // Chi nhánh toàn chữ cái
    [InlineData("010123456!")] // Chứa ký tự đặc biệt
    [InlineData("-0101234567")] // Dấu gạch ngang ở đầu
    [InlineData("0101234567-")] // Dấu gạch ngang ở đuôi không có số chi nhánh
    public void CustomerValidationRules_IsValidTaxCode_WithInvalidTaxCodes_ReturnsFalse(string? invalidTaxCode)
    {
        // Act
        var result = CustomerValidationRules.IsValidTaxCode(invalidTaxCode);

        // Assert
        Assert.False(result);
    }

    #endregion

    #region FluentValidation Validator Tests

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

    [Theory]
    [InlineData("A")] // Quá ngắn
    [InlineData("AB")] // 2 ký tự
    [InlineData("THIS_CODE_IS_WAY_TOO_LONG_EXCEEDING_20_CHARS")] // Quá dài (> 20 ký tự)
    [InlineData("CODE WITH SPACE")] // Có dấu cách
    [InlineData("CODE@SPECIAL")] // Ký tự đặc biệt
    public void CreateCustomerValidator_WithInvalidCodeFormat_ShouldFail(string invalidCode)
    {
        var req = new CreateCustomerRequest
        {
            Code = invalidCode,
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
    [InlineData("0101234567_001")]  // Dấu _ thay vì -
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

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CreateCustomerValidator_WithEmptyName_ShouldFail(string? emptyName)
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-001",
            Name = emptyName!,
            TaxCode = "0101234567",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        };

        var result = _createValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerRequest.Name));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CreateCustomerValidator_WithEmptyAddress_ShouldFail(string? emptyAddress)
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-001",
            Name = "Công ty TNHH Cảng",
            TaxCode = "0101234567",
            Address = emptyAddress!,
            RepresentativeName = "Nguyễn Văn A"
        };

        var result = _createValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCustomerRequest.Address));
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

    [Theory]
    [InlineData("0901234567")]
    [InlineData("+84901234567")]
    [InlineData("(028) 38123456")]
    [InlineData("028-3812-3456")]
    public void CreateCustomerValidator_WithValidPhone_ShouldPass(string validPhone)
    {
        var req = new CreateCustomerRequest
        {
            Code = "CUST-005",
            Name = "Công ty Cảng Biển",
            TaxCode = "0101234567",
            Address = "Hải Phòng",
            RepresentativeName = "Trần Văn B",
            ContactPhone = validPhone
        };

        var result = _createValidator.Validate(req);
        Assert.True(result.IsValid);
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

    [Theory]
    [InlineData("123456789")]       // 9 số
    [InlineData("010123456A")]      // Chứa chữ cái
    [InlineData("0101234567-01")]   // Thiếu số chi nhánh
    public void UpdateCustomerValidator_WithInvalidTaxCode_ShouldFail(string invalidTaxCode)
    {
        var req = new UpdateCustomerRequest
        {
            Name = "Công ty CP Cảng",
            TaxCode = invalidTaxCode,
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn D"
        };

        var result = _updateValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateCustomerRequest.TaxCode));
    }

    #endregion

    #region CustomerService - Duplicate CustomerCode & TaxCode Handling (TASK-24)

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
    public async Task CustomerService_CreateAsync_WhenDuplicateCodeExactMatch_ThrowsConflictException()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-001",
            Name = "Khách hàng hiện hữu",
            TaxCode = "0100000001",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var req = new CreateCustomerRequest
        {
            Code = "CUST-001", // Trùng chính xác mã
            Name = "Khách hàng mới trùng mã",
            TaxCode = "0100000002",
            Address = "Đà Nẵng",
            RepresentativeName = "Trần Văn B"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(req));
        Assert.Contains("Mã khách hàng", ex.Message);
        Assert.Contains("CUST-001", ex.Message);
    }

    [Theory]
    [InlineData("cust-dup")] // Chữ thường
    [InlineData("CUST-DUP")] // Chữ hoa
    [InlineData("CuSt-DuP")] // Hỗn hợp hoa thường
    [InlineData("  cust-dup  ")] // Có khoảng trắng bao quanh
    public async Task CustomerService_CreateAsync_WhenDuplicateCodeCaseInsensitiveOrTrimmed_ThrowsConflictException(string duplicateCode)
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-DUP",
            Name = "Khách hàng gốc",
            TaxCode = "0100000001",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var req = new CreateCustomerRequest
        {
            Code = duplicateCode,
            Name = "Khách hàng mới thử nghiệm trùng mã",
            TaxCode = "0100000002",
            Address = "Đà Nẵng",
            RepresentativeName = "Lê Văn B"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(req));
        Assert.Contains("Mã khách hàng", ex.Message);
    }

    [Fact]
    public async Task CustomerService_CreateAsync_WhenCodeDistinct_CreatesCustomerSuccessfully()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-001",
            Name = "Khách hàng 1",
            TaxCode = "0100000001",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn A"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Mã tương tự nhưng không trùng
        var req = new CreateCustomerRequest
        {
            Code = "CUST-002",
            Name = "Khách hàng 2",
            TaxCode = "0100000002",
            Address = "Đà Nẵng",
            RepresentativeName = "Lê Văn B"
        };

        // Act
        var result = await service.CreateAsync(req);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("CUST-002", result.Code);
    }

    [Fact]
    public async Task CustomerService_CreateAsync_WhenDuplicateTaxCode_ThrowsConflictException()
    {
        // Arrange
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
            TaxCode = "0109999999", // Trùng TaxCode
            Address = "Danang",
            RepresentativeName = "Le Van B"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.CreateAsync(req));
        Assert.Contains("Mã số thuế", ex.Message);
        Assert.Contains("0109999999", ex.Message);
    }

    [Fact]
    public async Task CustomerService_CreateAsync_WhenDuplicateTaxCodeWithWhitespace_ThrowsConflictException()
    {
        // Arrange
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
            TaxCode = "  0109999999  ", // TaxCode có khoảng trắng bao quanh
            Address = "Danang",
            RepresentativeName = "Le Van B"
        };

        // Act & Assert
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
        // Arrange
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

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ConflictException>(() => service.UpdateAsync(cust2.Id, updateReq));
        Assert.Contains("Mã số thuế", ex.Message);
        Assert.Contains("0101111111", ex.Message);
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenKeepingOwnTaxCode_SucceedsWithoutConflict()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var cust = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-SELF",
            Name = "Tên Ban Đầu",
            TaxCode = "0105555555",
            Address = "Hà Nội",
            RepresentativeName = "Đại diện A"
        };
        dbContext.Customers.Add(cust);
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var updateReq = new UpdateCustomerRequest
        {
            Name = "Tên Sau Cập Nhật",
            TaxCode = "0105555555", // Giữ nguyên TaxCode của chính mình
            Address = "Địa chỉ mới",
            RepresentativeName = "Đại diện mới"
        };

        // Act
        var result = await service.UpdateAsync(cust.Id, updateReq);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("0105555555", result.TaxCode);
        Assert.Equal("Tên Sau Cập Nhật", result.Name);
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenChangingToUnusedTaxCode_Succeeds()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var cust = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-TAX-CHANGE",
            Name = "Công ty Cổ phần A",
            TaxCode = "0101111111",
            Address = "Hải Phòng",
            RepresentativeName = "Giám đốc A"
        };
        dbContext.Customers.Add(cust);
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var updateReq = new UpdateCustomerRequest
        {
            Name = "Công ty Cổ phần A",
            TaxCode = "0109998888", // Mã số thuế mới chưa tồn tại
            Address = "Hải Phòng",
            RepresentativeName = "Giám đốc A"
        };

        // Act
        var result = await service.UpdateAsync(cust.Id, updateReq);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("0109998888", result.TaxCode);
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenValidData_PreservesOriginalCustomerCode()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var cust = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-IMMUTABLE",
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
            TaxCode = "0105555555",
            Address = "Địa chỉ mới",
            RepresentativeName = "Đại diện mới",
            RepresentativeTitle = "Chủ tịch HĐQT",
            ContactPerson = "Trợ lý tổng giám đốc",
            ContactPhone = "0988776655",
            ContactEmail = "troly@newname.com"
        };

        // Act
        var updated = await service.UpdateAsync(cust.Id, updateReq);

        // Assert
        Assert.Equal("CUST-IMMUTABLE", updated.Code); // Mã khách hàng không đổi
        Assert.Equal("Tên Mới", updated.Name);
        Assert.Equal("Địa chỉ mới", updated.Address);
        Assert.Equal("Đại diện mới", updated.RepresentativeName);
        Assert.Equal("Chủ tịch HĐQT", updated.RepresentativeTitle);
        Assert.NotNull(updated.UpdatedAt);
    }

    #endregion

    #region CustomerService - Retrieval & Query Tests (TASK-24)

    [Theory]
    [InlineData("CUST-FIND", "CUST-FIND")] // Trùng khớp hoa thường
    [InlineData("cust-find", "CUST-FIND")] // Tìm bằng chữ thường
    [InlineData("  cust-find  ", "CUST-FIND")] // Tìm kèm khoảng trắng 2 đầu
    public async Task CustomerService_GetByCodeAsync_WhenCustomerExists_ReturnsMatchingCustomer(string searchCode, string actualDbCode)
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = actualDbCode,
            Name = "Khách Hàng Tìm Kiếm",
            TaxCode = "0107777777",
            Address = "Hải Phòng",
            RepresentativeName = "Đại diện C"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Act
        var found = await service.GetByCodeAsync(searchCode);

        // Assert
        Assert.NotNull(found);
        Assert.Equal(actualDbCode, found.Code);
        Assert.Equal("Khách Hàng Tìm Kiếm", found.Name);
    }

    [Theory]
    [InlineData("NOT-EXISTING-CODE")]
    [InlineData("CUST-999999")]
    public async Task CustomerService_GetByCodeAsync_WhenCodeNotFound_ReturnsNull(string nonExistentCode)
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Act
        var found = await service.GetByCodeAsync(nonExistentCode);

        // Assert
        Assert.Null(found);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CustomerService_GetByCodeAsync_WhenCodeNullOrWhitespace_ReturnsNull(string? emptyCode)
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Act
        var found = await service.GetByCodeAsync(emptyCode!);

        // Assert
        Assert.Null(found);
    }

    [Fact]
    public async Task CustomerService_GetByIdAsync_WhenCustomerExists_ReturnsCustomerDto()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var customerId = Guid.NewGuid();
        dbContext.Customers.Add(new Customer
        {
            Id = customerId,
            Code = "CUST-ID-01",
            Name = "Khách Hàng Tra Cứu Id",
            TaxCode = "0108888888",
            Address = "TP. Hồ Chí Minh",
            RepresentativeName = "Đại diện D"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Act
        var result = await service.GetByIdAsync(customerId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(customerId, result.Id);
        Assert.Equal("CUST-ID-01", result.Code);
    }

    [Fact]
    public async Task CustomerService_GetByIdAsync_WhenNotFound_ThrowsNotFoundException()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(Guid.NewGuid()));
    }

    #endregion

    #region CustomerService - ValidationAppException Handling (TASK-24)

    [Fact]
    public async Task CustomerService_CreateAsync_WhenRequestFailsValidation_ThrowsValidationAppException()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var invalidReq = new CreateCustomerRequest
        {
            Code = "INVALID CODE WITH SPACE",
            Name = "", // Tên trống
            TaxCode = "INVALID_TAX", // Mã số thuế sai
            Address = "",
            RepresentativeName = ""
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationAppException>(() => service.CreateAsync(invalidReq));
        Assert.NotEmpty(ex.Errors);
        Assert.Contains(nameof(CreateCustomerRequest.Code), ex.Errors.Keys);
        Assert.Contains(nameof(CreateCustomerRequest.Name), ex.Errors.Keys);
        Assert.Contains(nameof(CreateCustomerRequest.TaxCode), ex.Errors.Keys);
    }

    [Fact]
    public async Task CustomerService_UpdateAsync_WhenRequestFailsValidation_ThrowsValidationAppException()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator);

        var invalidReq = new UpdateCustomerRequest
        {
            Name = "", // Trống
            TaxCode = "INVALID_TAX",
            Address = "",
            RepresentativeName = ""
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationAppException>(() => service.UpdateAsync(Guid.NewGuid(), invalidReq));
        Assert.NotEmpty(ex.Errors);
        Assert.Contains(nameof(UpdateCustomerRequest.Name), ex.Errors.Keys);
        Assert.Contains(nameof(UpdateCustomerRequest.TaxCode), ex.Errors.Keys);
    }

    #endregion

    #region UpdateCustomerStatusValidator Tests (TASK-25)

    [Theory]
    [InlineData(CustomerStatus.Active)]
    [InlineData(CustomerStatus.Suspended)]
    public void UpdateCustomerStatusValidator_WithValidStatus_ShouldPass(CustomerStatus status)
    {
        var req = new UpdateCustomerStatusRequest
        {
            Status = status,
            Reason = "Lý do hợp lệ"
        };

        var result = _statusValidator.Validate(req);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateCustomerStatusValidator_WithInvalidStatusEnum_ShouldFail()
    {
        var req = new UpdateCustomerStatusRequest
        {
            Status = (CustomerStatus)999,
            Reason = "Trạng thái không tồn tại"
        };

        var result = _statusValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateCustomerStatusRequest.Status));
    }

    [Fact]
    public void UpdateCustomerStatusValidator_WithReasonExceeding500Chars_ShouldFail()
    {
        var req = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = new string('A', 501)
        };

        var result = _statusValidator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateCustomerStatusRequest.Reason));
    }

    #endregion

    #region GetCustomersQueryValidator Tests (TASK-25)

    [Fact]
    public void GetCustomersQueryValidator_WithDefaultValues_ShouldPass()
    {
        var query = new GetCustomersQuery();
        var result = _queryValidator.Validate(query);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void GetCustomersQueryValidator_WithValidCustomValues_ShouldPass()
    {
        var query = new GetCustomersQuery
        {
            PageIndex = 2,
            PageSize = 25,
            Status = CustomerStatus.Active,
            SearchTerm = "Logistics Hải Phòng"
        };

        var result = _queryValidator.Validate(query);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-10)]
    public void GetCustomersQueryValidator_WithInvalidPageIndex_ShouldFail(int invalidPageIndex)
    {
        var query = new GetCustomersQuery { PageIndex = invalidPageIndex };
        var result = _queryValidator.Validate(query);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetCustomersQuery.PageIndex));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(101)]
    [InlineData(500)]
    public void GetCustomersQueryValidator_WithInvalidPageSize_ShouldFail(int invalidPageSize)
    {
        var query = new GetCustomersQuery { PageSize = invalidPageSize };
        var result = _queryValidator.Validate(query);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetCustomersQuery.PageSize));
    }

    [Fact]
    public void GetCustomersQueryValidator_WithInvalidStatusEnum_ShouldFail()
    {
        var query = new GetCustomersQuery { Status = (CustomerStatus)999 };
        var result = _queryValidator.Validate(query);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetCustomersQuery.Status));
    }

    [Fact]
    public void GetCustomersQueryValidator_WithSearchTermTooLong_ShouldFail()
    {
        var query = new GetCustomersQuery { SearchTerm = new string('S', 101) };
        var result = _queryValidator.Validate(query);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetCustomersQuery.SearchTerm));
    }

    #endregion

    #region CustomerService - UpdateStatusAsync Tests (TASK-25)

    [Fact]
    public async Task CustomerService_UpdateStatusAsync_WhenSuspendingCustomer_SetsSuspendedState()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-SUSP-01",
            Name = "Khách Hàng Tạm Ngưng",
            TaxCode = "0109990001",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn Suspended",
            Status = CustomerStatus.Active
        };
        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        var req = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = "Vi phạm điều khoản thanh toán hợp đồng dịch vụ cảng"
        };

        // Act
        var result = await service.UpdateStatusAsync(customer.Id, req);

        // Assert
        Assert.Equal(CustomerStatus.Suspended, result.Status);
        Assert.Equal("Suspended", result.StatusName);
        Assert.Equal("Vi phạm điều khoản thanh toán hợp đồng dịch vụ cảng", result.SuspendedReason);
        Assert.NotNull(result.SuspendedAt);
        Assert.NotNull(result.UpdatedAt);

        var dbEntity = await dbContext.Customers.FindAsync(customer.Id);
        Assert.NotNull(dbEntity);
        Assert.Equal(CustomerStatus.Suspended, dbEntity.Status);
        Assert.Equal("Vi phạm điều khoản thanh toán hợp đồng dịch vụ cảng", dbEntity.SuspendedReason);
        Assert.NotNull(dbEntity.SuspendedAt);
    }

    [Fact]
    public async Task CustomerService_UpdateStatusAsync_WhenReactivatingCustomer_ClearsSuspendedState()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-REACT-01",
            Name = "Khách Hàng Kích Hoạt Lại",
            TaxCode = "0109990002",
            Address = "Hải Phòng",
            RepresentativeName = "Trần Văn Active",
            Status = CustomerStatus.Suspended,
            SuspendedReason = "Tạm ngưng trước đó",
            SuspendedAt = DateTimeOffset.UtcNow.AddDays(-10)
        };
        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        var req = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Active
        };

        // Act
        var result = await service.UpdateStatusAsync(customer.Id, req);

        // Assert
        Assert.Equal(CustomerStatus.Active, result.Status);
        Assert.Equal("Active", result.StatusName);
        Assert.Null(result.SuspendedReason);
        Assert.Null(result.SuspendedAt);
        Assert.NotNull(result.UpdatedAt);

        var dbEntity = await dbContext.Customers.FindAsync(customer.Id);
        Assert.NotNull(dbEntity);
        Assert.Equal(CustomerStatus.Active, dbEntity.Status);
        Assert.Null(dbEntity.SuspendedReason);
        Assert.Null(dbEntity.SuspendedAt);
    }

    [Fact]
    public async Task CustomerService_UpdateStatusAsync_WhenCustomerNotFound_ThrowsNotFoundException()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        var req = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = "Lý do"
        };

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() => service.UpdateStatusAsync(Guid.NewGuid(), req));
    }

    [Fact]
    public async Task CustomerService_UpdateStatusAsync_WhenRequestInvalid_ThrowsValidationAppException()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        var req = new UpdateCustomerStatusRequest
        {
            Status = (CustomerStatus)888, // Invalid enum
            Reason = new string('E', 501) // Exceeding max length
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationAppException>(() => service.UpdateStatusAsync(Guid.NewGuid(), req));
    }

    #endregion

    #region CustomerService - GetPagedAsync Tests (TASK-25)

    [Fact]
    public async Task CustomerService_GetPagedAsync_DefaultParameters_ReturnsFirstPageWithTotalCount()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        for (int i = 1; i <= 15; i++)
        {
            dbContext.Customers.Add(new Customer
            {
                Id = Guid.NewGuid(),
                Code = $"CUST-PG-{i:D3}",
                Name = $"Công ty Cảng Logistics {i}",
                TaxCode = $"010000{i:D4}",
                Address = "Hà Nội",
                RepresentativeName = $"Người Đại Diện {i}",
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(i)
            });
        }
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act (Default: PageIndex = 1, PageSize = 10)
        var result = await service.GetPagedAsync(new GetCustomersQuery());

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(15, result.TotalCount);
        Assert.Equal(1, result.PageIndex);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.TotalPages);
        Assert.False(result.HasPreviousPage);
        Assert.True(result.HasNextPage);
        // Kiểm tra sắp xếp CreatedAt descending: bản ghi thứ 15 tạo sau cùng phải đứng đầu
        Assert.Equal("CUST-PG-015", result.Items[0].Code);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_SecondPage_ReturnsRemainingItems()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        for (int i = 1; i <= 15; i++)
        {
            dbContext.Customers.Add(new Customer
            {
                Id = Guid.NewGuid(),
                Code = $"CUST-PG2-{i:D3}",
                Name = $"Công ty {i}",
                TaxCode = $"020000{i:D4}",
                Address = "Hải Phòng",
                RepresentativeName = $"Đại diện {i}",
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(i)
            });
        }
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act
        var result = await service.GetPagedAsync(new GetCustomersQuery { PageIndex = 2, PageSize = 10 });

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(15, result.TotalCount);
        Assert.Equal(2, result.PageIndex);
        Assert.Equal(2, result.TotalPages);
        Assert.True(result.HasPreviousPage);
        Assert.False(result.HasNextPage);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_SearchByCode_ReturnsMatchingCustomers()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.AddRange(
            new Customer { Id = Guid.NewGuid(), Code = "CUST-HANOI-01", Name = "Công ty Alpha", TaxCode = "0100000010", Address = "Hà Nội", RepresentativeName = "A" },
            new Customer { Id = Guid.NewGuid(), Code = "CUST-SAIGON-02", Name = "Công ty Beta", TaxCode = "0100000020", Address = "TP.HCM", RepresentativeName = "B" },
            new Customer { Id = Guid.NewGuid(), Code = "CUST-DANANG-03", Name = "Công ty Gamma", TaxCode = "0100000030", Address = "Đà Nẵng", RepresentativeName = "C" }
        );
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act
        var result = await service.GetPagedAsync(new GetCustomersQuery { SearchTerm = "saigon" });

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CUST-SAIGON-02", result.Items[0].Code);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_SearchByName_ReturnsMatchingCustomers()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.AddRange(
            new Customer { Id = Guid.NewGuid(), Code = "CUST-001", Name = "Công ty Tân Cảng Sài Gòn", TaxCode = "0300111222", Address = "TP.HCM", RepresentativeName = "A" },
            new Customer { Id = Guid.NewGuid(), Code = "CUST-002", Name = "Công ty Tiếp Vận Biển Đông", TaxCode = "0300333444", Address = "Hải Phòng", RepresentativeName = "B" }
        );
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act
        var result = await service.GetPagedAsync(new GetCustomersQuery { SearchTerm = "Biển Đông" });

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CUST-002", result.Items[0].Code);
        Assert.Equal("Công ty Tiếp Vận Biển Đông", result.Items[0].Name);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_SearchByTaxCode_ReturnsMatchingCustomers()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.AddRange(
            new Customer { Id = Guid.NewGuid(), Code = "CUST-TAX-1", Name = "Công ty Một", TaxCode = "0109999001", Address = "HN", RepresentativeName = "A" },
            new Customer { Id = Guid.NewGuid(), Code = "CUST-TAX-2", Name = "Công ty Hai", TaxCode = "0308888002", Address = "HCM", RepresentativeName = "B" }
        );
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act
        var result = await service.GetPagedAsync(new GetCustomersQuery { SearchTerm = "0308888" });

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CUST-TAX-2", result.Items[0].Code);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_SearchUsingKeywordAlias_WorksIdentically()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST-KEYWORD",
            Name = "Công ty Đại Dương Xanh",
            TaxCode = "0107776665",
            Address = "Nha Trang",
            RepresentativeName = "Nguyễn Văn D"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act: Dùng query.Keyword thay vì SearchTerm
        var result = await service.GetPagedAsync(new GetCustomersQuery { Keyword = "đại dương" });

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CUST-KEYWORD", result.Items[0].Code);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_FilterByStatus_ReturnsOnlyMatchingStatus()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.AddRange(
            new Customer { Id = Guid.NewGuid(), Code = "ACT-1", Name = "Active 1", TaxCode = "010001", Address = "HN", RepresentativeName = "A", Status = CustomerStatus.Active },
            new Customer { Id = Guid.NewGuid(), Code = "ACT-2", Name = "Active 2", TaxCode = "010002", Address = "HN", RepresentativeName = "B", Status = CustomerStatus.Active },
            new Customer { Id = Guid.NewGuid(), Code = "SUS-1", Name = "Suspended 1", TaxCode = "010003", Address = "HN", RepresentativeName = "C", Status = CustomerStatus.Suspended }
        );
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act 1: Lọc Active
        var activeResult = await service.GetPagedAsync(new GetCustomersQuery { Status = CustomerStatus.Active });
        Assert.Equal(2, activeResult.TotalCount);
        Assert.All(activeResult.Items, c => Assert.Equal(CustomerStatus.Active, c.Status));

        // Act 2: Lọc Suspended
        var suspendedResult = await service.GetPagedAsync(new GetCustomersQuery { Status = CustomerStatus.Suspended });
        Assert.Single(suspendedResult.Items);
        Assert.Equal("SUS-1", suspendedResult.Items[0].Code);
        Assert.Equal(CustomerStatus.Suspended, suspendedResult.Items[0].Status);

        // Act 3: Không lọc status
        var allResult = await service.GetPagedAsync(new GetCustomersQuery { Status = null });
        Assert.Equal(3, allResult.TotalCount);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_SearchAndFilterCombined_ReturnsIntersection()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.AddRange(
            new Customer { Id = Guid.NewGuid(), Code = "LOG-01", Name = "Logistics Miền Bắc", TaxCode = "010101", Address = "HN", RepresentativeName = "A", Status = CustomerStatus.Active },
            new Customer { Id = Guid.NewGuid(), Code = "LOG-02", Name = "Logistics Miền Nam", TaxCode = "010102", Address = "HCM", RepresentativeName = "B", Status = CustomerStatus.Suspended },
            new Customer { Id = Guid.NewGuid(), Code = "TRK-01", Name = "Trucking Hải Phòng", TaxCode = "010103", Address = "HP", RepresentativeName = "C", Status = CustomerStatus.Active }
        );
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act: Tìm "Logistics" VÀ trạng thái Active
        var result = await service.GetPagedAsync(new GetCustomersQuery
        {
            SearchTerm = "Logistics",
            Status = CustomerStatus.Active
        });

        // Assert: Chỉ có LOG-01 khớp cả 2 tiêu chí
        Assert.Single(result.Items);
        Assert.Equal("LOG-01", result.Items[0].Code);
        Assert.Equal(CustomerStatus.Active, result.Items[0].Status);
    }

    [Fact]
    public async Task CustomerService_GetPagedAsync_WhenNoMatchFound_ReturnsEmptyItemsWithTotalCountZero()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        dbContext.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            Code = "EXISTING-01",
            Name = "Công ty Hiện Hữu",
            TaxCode = "0101112223",
            Address = "HN",
            RepresentativeName = "A"
        });
        await dbContext.SaveChangesAsync();

        var service = new CustomerService(dbContext, _createValidator, _updateValidator, _statusValidator, _queryValidator);

        // Act
        var result = await service.GetPagedAsync(new GetCustomersQuery { SearchTerm = "KHONG_TON_TAI_TRONG_DB" });

        // Assert
        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
        Assert.False(result.HasPreviousPage);
        Assert.False(result.HasNextPage);
    }

    #endregion
}