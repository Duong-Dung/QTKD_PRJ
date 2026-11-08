using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Qtkd.BuildingBlocks.Common;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Xunit;

namespace Qtkd.IntegrationTests;

public class CustomerIntegrationTests : IClassFixture<QtkdWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public CustomerIntegrationTests(QtkdWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateCustomer_WithValidData_Returns201CreatedAndLocationHeader()
    {
        var randomCode = $"KH{Random.Shared.Next(10000, 99999)}";
        var randomTax = $"03{Random.Shared.Next(10000000, 99999999)}";

        var payload = new CreateCustomerRequest
        {
            Code = randomCode,
            Name = "Công ty TNHH Vận Tải Quốc Tế Hải Đăng",
            TaxCode = randomTax,
            Address = "Số 10 Mai Chí Thọ, TP. Thủ Đức, TP.HCM",
            RepresentativeName = "Nguyễn Hải Đăng",
            RepresentativeTitle = "Giám đốc",
            ContactPerson = "Phạm Thị Thảo",
            ContactPhone = "0908889999",
            ContactEmail = "haidang@logistics.vn"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/customers", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var body = await response.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(randomCode, body.Code);
        Assert.Equal(randomTax, body.TaxCode);
        Assert.NotEqual(Guid.Empty, body.Id);
    }

    [Fact]
    public async Task CreateCustomer_WithInvalidTaxCode_Returns400BadRequestProblemDetails()
    {
        var payload = new CreateCustomerRequest
        {
            Code = $"KH{Random.Shared.Next(10000, 99999)}",
            Name = "Công ty Sai MST",
            TaxCode = "12345", // Sai định dạng (chỉ 5 chữ số)
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn X"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/customers", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
    }

    [Fact]
    public async Task CreateCustomer_WhenDuplicateCode_Returns409Conflict()
    {
        var duplicateCode = $"DUP{Random.Shared.Next(1000, 9999)}";
        var tax1 = $"04{Random.Shared.Next(10000000, 99999999)}";
        var tax2 = $"04{Random.Shared.Next(10000000, 99999999)}";

        var payload1 = new CreateCustomerRequest
        {
            Code = duplicateCode,
            Name = "Doanh nghiệp A",
            TaxCode = tax1,
            Address = "Đà Nẵng",
            RepresentativeName = "Đại diện A"
        };

        var response1 = await _client.PostAsJsonAsync("/api/v1/customers", payload1);
        Assert.Equal(HttpStatusCode.Created, response1.StatusCode);

        // Tạo khách hàng thứ hai cùng mã Code
        var payload2 = new CreateCustomerRequest
        {
            Code = duplicateCode.ToLower(), // Test case-insensitive
            Name = "Doanh nghiệp B",
            TaxCode = tax2,
            Address = "Đà Nẵng",
            RepresentativeName = "Đại diện B"
        };

        var response2 = await _client.PostAsJsonAsync("/api/v1/customers", payload2);
        Assert.Equal(HttpStatusCode.Conflict, response2.StatusCode);

        var problem = await response2.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Contains("đã tồn tại", problem.Detail);
    }

    [Fact]
    public async Task UpdateCustomer_WithValidData_Returns200OkWithUpdatedProperties()
    {
        // 1. Tạo khách hàng ban đầu
        var code = $"UPD{Random.Shared.Next(1000, 9999)}";
        var tax = $"05{Random.Shared.Next(10000000, 99999999)}";

        var createPayload = new CreateCustomerRequest
        {
            Code = code,
            Name = "Tên Ban Đầu",
            TaxCode = tax,
            Address = "Địa chỉ ban đầu",
            RepresentativeName = "Đại diện ban đầu"
        };

        var createResp = await _client.PostAsJsonAsync("/api/v1/customers", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(created);

        // 2. Cập nhật thông tin qua PUT
        var updatePayload = new UpdateCustomerRequest
        {
            Name = "Tên Sau Cập Nhật",
            TaxCode = tax, // Giữ nguyên TaxCode
            Address = "Địa chỉ mới tại Cảng Cát Lái",
            RepresentativeName = "Đại diện mới",
            RepresentativeTitle = "Chủ tịch",
            ContactPhone = "0911223344",
            ContactEmail = "new_contact@catlai.vn"
        };

        var updateResp = await _client.PutAsJsonAsync($"/api/v1/customers/{created.Id}", updatePayload);
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);

        var updated = await updateResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal("Tên Sau Cập Nhật", updated.Name);
        Assert.Equal("Địa chỉ mới tại Cảng Cát Lái", updated.Address);
        Assert.Equal("Đại diện mới", updated.RepresentativeName);
        Assert.NotNull(updated.UpdatedAt);

        // 3. GET lại để xác nhận dữ liệu đã được lưu
        var getResp = await _client.GetAsync($"/api/v1/customers/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var fetched = await getResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(fetched);
        Assert.Equal("Tên Sau Cập Nhật", fetched.Name);
    }

    [Fact]
    public async Task UpdateCustomer_WithNonExistentId_Returns404NotFound()
    {
        var nonExistentId = Guid.NewGuid();
        var updatePayload = new UpdateCustomerRequest
        {
            Name = "Khách hàng không tồn tại",
            TaxCode = "0101234567",
            Address = "Hà Nội",
            RepresentativeName = "Nguyễn Văn Không"
        };

        var response = await _client.PutAsJsonAsync($"/api/v1/customers/{nonExistentId}", updatePayload);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task DirectApiCustomersRoute_ShouldAlsoWorkIdentically()
    {
        var code = $"DIR{Random.Shared.Next(1000, 9999)}";
        var tax = $"06{Random.Shared.Next(10000000, 99999999)}";

        var payload = new CreateCustomerRequest
        {
            Code = code,
            Name = "Kiểm tra Route /api/customers",
            TaxCode = tax,
            Address = "TP. Quy Nhơn",
            RepresentativeName = "Trần Bình Trọng"
        };

        // Gọi trực tiếp route /api/customers (không có /v1/)
        var response = await _client.PostAsJsonAsync("/api/customers", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal(code, created.Code);
    }

    [Fact]
    public async Task UpdateCustomerStatus_SuspendAndReactivate_Returns200OkWithCorrectState()
    {
        // 1. Tạo mới khách hàng
        var code = $"STS{Random.Shared.Next(1000, 9999)}";
        var tax = $"07{Random.Shared.Next(10000000, 99999999)}";

        var createPayload = new CreateCustomerRequest
        {
            Code = code,
            Name = "Công ty Kiểm tra Status",
            TaxCode = tax,
            Address = "Hải Phòng",
            RepresentativeName = "Nguyễn Văn Status"
        };

        var createResp = await _client.PostAsJsonAsync("/api/customers", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal(CustomerStatus.Active, created.Status);

        // 2. Chuyển sang Suspended qua PATCH /api/customers/{id}/status
        var suspendPayload = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = "Vi phạm nghĩa vụ thanh toán hợp đồng"
        };

        var suspendResp = await _client.PatchAsJsonAsync($"/api/customers/{created.Id}/status", suspendPayload);
        Assert.Equal(HttpStatusCode.OK, suspendResp.StatusCode);

        var suspended = await suspendResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(suspended);
        Assert.Equal(CustomerStatus.Suspended, suspended.Status);
        Assert.Equal("Vi phạm nghĩa vụ thanh toán hợp đồng", suspended.SuspendedReason);
        Assert.NotNull(suspended.SuspendedAt);

        // 3. Kích hoạt lại (Active) qua PATCH /api/v1/customers/{id}/status
        var reactivatePayload = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Active
        };

        var reactivateResp = await _client.PatchAsJsonAsync($"/api/v1/customers/{created.Id}/status", reactivatePayload);
        Assert.Equal(HttpStatusCode.OK, reactivateResp.StatusCode);

        var reactivated = await reactivateResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(reactivated);
        Assert.Equal(CustomerStatus.Active, reactivated.Status);
        Assert.Null(reactivated.SuspendedReason);
        Assert.Null(reactivated.SuspendedAt);
    }

    [Fact]
    public async Task UpdateCustomerStatus_WhenNotFound_Returns404NotFound()
    {
        var nonExistentId = Guid.NewGuid();
        var payload = new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = "Không tồn tại"
        };

        var response = await _client.PatchAsJsonAsync($"/api/customers/{nonExistentId}/status", payload);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task GetCustomers_WithPagination_Returns200OkWithPagedResult()
    {
        var response = await _client.GetAsync("/api/customers?pageIndex=1&pageSize=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var paged = await response.Content.ReadFromJsonAsync<PagedResult<CustomerDto>>(JsonOptions);
        Assert.NotNull(paged);
        Assert.NotNull(paged.Items);
        Assert.Equal(1, paged.PageIndex);
        Assert.Equal(5, paged.PageSize);
        Assert.True(paged.TotalCount >= 0);
    }

    [Fact]
    public async Task GetCustomers_WithSearchTerm_ReturnsMatchingCustomer()
    {
        // 1. Tạo khách hàng có từ khóa tìm kiếm duy nhất
        var uniqueSuffix = Guid.NewGuid().ToString("N")[..8];
        var uniqueName = $"Công ty Tìm Kiếm {uniqueSuffix}";
        var code = $"SR{Random.Shared.Next(1000, 9999)}";
        var tax = $"08{Random.Shared.Next(10000000, 99999999)}";

        var payload = new CreateCustomerRequest
        {
            Code = code,
            Name = uniqueName,
            TaxCode = tax,
            Address = "Đà Nẵng",
            RepresentativeName = "Đại diện Tìm Kiếm"
        };

        var createResp = await _client.PostAsJsonAsync("/api/customers", payload);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        // 2. Tìm kiếm theo từ khóa duy nhất
        var searchResp = await _client.GetAsync($"/api/customers?searchTerm={uniqueSuffix}");
        Assert.Equal(HttpStatusCode.OK, searchResp.StatusCode);

        var paged = await searchResp.Content.ReadFromJsonAsync<PagedResult<CustomerDto>>(JsonOptions);
        Assert.NotNull(paged);
        Assert.Single(paged.Items);
        Assert.Equal(code, paged.Items[0].Code);
        Assert.Equal(uniqueName, paged.Items[0].Name);
    }

    [Fact]
    public async Task GetCustomers_WithStatusFilter_ReturnsOnlyMatchingStatus()
    {
        // 1. Tạo 1 khách hàng và tạm ngưng
        var code = $"SF{Random.Shared.Next(1000, 9999)}";
        var tax = $"09{Random.Shared.Next(10000000, 99999999)}";

        var createPayload = new CreateCustomerRequest
        {
            Code = code,
            Name = "Khách Hàng Tạm Ngưng Lọc",
            TaxCode = tax,
            Address = "Cần Thơ",
            RepresentativeName = "Đại diện Cần Thơ"
        };

        var createResp = await _client.PostAsJsonAsync("/api/customers", createPayload);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(created);

        // Tạm ngưng
        var suspendResp = await _client.PatchAsJsonAsync($"/api/customers/{created.Id}/status", new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = "Lọc kiểm thử"
        });
        Assert.Equal(HttpStatusCode.OK, suspendResp.StatusCode);

        // 2. Lọc theo trạng thái Suspended
        var filterResp = await _client.GetAsync("/api/customers?status=Suspended");
        Assert.Equal(HttpStatusCode.OK, filterResp.StatusCode);

        var paged = await filterResp.Content.ReadFromJsonAsync<PagedResult<CustomerDto>>(JsonOptions);
        Assert.NotNull(paged);
        Assert.NotEmpty(paged.Items);
        Assert.All(paged.Items, item => Assert.Equal(CustomerStatus.Suspended, item.Status));
    }
}
