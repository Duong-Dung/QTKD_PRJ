using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Qtkd.Modules.Contracts.DTOs;
using Qtkd.Modules.Contracts.Entities;
using Qtkd.Modules.Customers.DTOs;
using Qtkd.Modules.Customers.Entities;
using Xunit;

namespace Qtkd.IntegrationTests;

/// <summary>
/// Bộ kiểm thử tích hợp cho API Hợp đồng (TASK-27 - CTR-01)
/// </summary>
public class ContractIntegrationTests : IClassFixture<QtkdWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ContractIntegrationTests(QtkdWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<CustomerDto> CreateActiveCustomerAsync()
    {
        var randomCode = $"KH{Random.Shared.Next(10000, 99999)}";
        var randomTax = $"02{Random.Shared.Next(10000000, 99999999)}";

        var payload = new CreateCustomerRequest
        {
            Code = randomCode,
            Name = "Công ty TNHH Tiếp Vận Hàng Hải Tân Cảng",
            TaxCode = randomTax,
            Address = "Số 1295 Nguyễn Thị Định, Cát Lái, TP.HCM",
            RepresentativeName = "Nguyễn Văn Đại Diện"
        };

        var response = await _client.PostAsJsonAsync("/api/customers", payload);
        response.EnsureSuccessStatusCode();

        var customer = await response.Content.ReadFromJsonAsync<CustomerDto>(JsonOptions);
        Assert.NotNull(customer);
        return customer!;
    }

    [Fact]
    public async Task CreateContract_WithValidData_Returns201CreatedAndLocationHeader()
    {
        // 1. Tạo khách hàng Active
        var customer = await CreateActiveCustomerAsync();

        // 2. Gọi POST /api/contracts
        var payload = new CreateContractRequest
        {
            CustomerId = customer.Id,
            Title = "Hợp đồng dịch vụ logistics cảng biển 2026",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 500_000_000m,
            Currency = "VND",
            PaymentTerms = "Thanh toán theo từng đợt 30 ngày",
            ServiceTerms = "Bốc dỡ và lưu kho container"
        };

        var response = await _client.PostAsJsonAsync("/api/contracts", payload);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var body = await response.Content.ReadFromJsonAsync<ContractDto>(JsonOptions);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.Id);
        Assert.StartsWith("HD-2026-", body.Code);
        Assert.Equal(ContractStatus.Draft, body.Status);
        Assert.Equal("Draft", body.StatusName);
        Assert.Equal(customer.Id, body.CustomerId);
        Assert.Equal(customer.Name, body.CustomerName);
        Assert.Equal(500_000_000m, body.ContractValue);
    }

    [Fact]
    public async Task CreateContract_WhenCustomerIsSuspended_Returns409Conflict()
    {
        // 1. Tạo khách hàng và chuyển sang Suspended
        var customer = await CreateActiveCustomerAsync();

        var patchResp = await _client.PatchAsJsonAsync($"/api/customers/{customer.Id}/status", new UpdateCustomerStatusRequest
        {
            Status = CustomerStatus.Suspended,
            Reason = "Tạm ngưng do nợ xấu"
        });
        patchResp.EnsureSuccessStatusCode();

        // 2. Thử tạo hợp đồng với khách hàng đã bị tạm ngưng
        var payload = new CreateContractRequest
        {
            CustomerId = customer.Id,
            Title = "Hợp đồng thử nghiệm khách hàng tạm ngưng",
            EffectiveFrom = new DateOnly(2026, 2, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 100_000_000m
        };

        var response = await _client.PostAsJsonAsync("/api/contracts", payload);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Contains("tạm ngưng", problem.Detail);
    }

    [Fact]
    public async Task CreateContract_WhenCustomerDoesNotExist_Returns404NotFound()
    {
        var nonExistentId = Guid.NewGuid();
        var payload = new CreateContractRequest
        {
            CustomerId = nonExistentId,
            Title = "Hợp đồng khách hàng không tồn tại",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 100_000_000m
        };

        var response = await _client.PostAsJsonAsync("/api/contracts", payload);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateContract_WhenEffectiveToLessThanEffectiveFrom_Returns400BadRequest()
    {
        var customer = await CreateActiveCustomerAsync();

        var payload = new CreateContractRequest
        {
            CustomerId = customer.Id,
            Title = "Hợp đồng lỗi ngày hiệu lực",
            EffectiveFrom = new DateOnly(2026, 12, 31),
            EffectiveTo = new DateOnly(2026, 1, 1), // Kết thúc < Bắt đầu
            ContractValue = 100_000_000m
        };

        var response = await _client.PostAsJsonAsync("/api/contracts", payload);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
    }

    [Fact]
    public async Task CreateContract_WhenDuplicateCode_Returns409Conflict()
    {
        var customer = await CreateActiveCustomerAsync();
        var manualCode = $"HD-MANUAL-{Random.Shared.Next(10000, 99999)}";

        var payload1 = new CreateContractRequest
        {
            Code = manualCode,
            CustomerId = customer.Id,
            Title = "Hợp đồng thủ công 1",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 100_000_000m
        };

        var resp1 = await _client.PostAsJsonAsync("/api/contracts", payload1);
        Assert.Equal(HttpStatusCode.Created, resp1.StatusCode);

        // Tạo hợp đồng 2 trùng mã thủ công
        var payload2 = new CreateContractRequest
        {
            Code = manualCode,
            CustomerId = customer.Id,
            Title = "Hợp đồng thủ công 2 trùng mã",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            EffectiveTo = new DateOnly(2026, 12, 31),
            ContractValue = 200_000_000m
        };

        var resp2 = await _client.PostAsJsonAsync("/api/contracts", payload2);
        Assert.Equal(HttpStatusCode.Conflict, resp2.StatusCode);
    }

    [Fact]
    public async Task GetContractById_WhenExists_Returns200OkWithCustomerDetails()
    {
        var customer = await CreateActiveCustomerAsync();

        var payload = new CreateContractRequest
        {
            CustomerId = customer.Id,
            Title = "Hợp đồng kiểm tra GetById",
            EffectiveFrom = new DateOnly(2026, 5, 1),
            EffectiveTo = new DateOnly(2027, 4, 30),
            ContractValue = 888_000_000m
        };

        var createResp = await _client.PostAsJsonAsync("/api/v1/contracts", payload);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var created = await createResp.Content.ReadFromJsonAsync<ContractDto>(JsonOptions);
        Assert.NotNull(created);

        // GET theo ID
        var getResp = await _client.GetAsync($"/api/contracts/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        var fetched = await getResp.Content.ReadFromJsonAsync<ContractDto>(JsonOptions);
        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal(created.Code, fetched.Code);
        Assert.Equal(customer.Name, fetched.CustomerName);
        Assert.Equal("Draft", fetched.StatusName);
    }
}