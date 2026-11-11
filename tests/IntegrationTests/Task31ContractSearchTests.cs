using System.Net;
using System.Net.Http.Json;
using Qtkd.BuildingBlocks.Common;
using Qtkd.Modules.Contracts.DTOs;
using Qtkd.Modules.Contracts.Entities;
using Qtkd.Modules.Customers.DTOs;
using Xunit;

namespace Qtkd.IntegrationTests;

/// <summary>TASK-31: kiểm thử qua HTTP với InMemory Test Factory hiện có.</summary>
public class Task31ContractSearchTests : IClassFixture<QtkdWebApplicationFactory>
{
    private readonly HttpClient _client;
    public Task31ContractSearchTests(QtkdWebApplicationFactory factory) => _client = factory.CreateClient();

    private async Task<ContractDto> CreateContractAsync(string title)
    {
        var customerResponse = await _client.PostAsJsonAsync("/api/v1/customers", new CreateCustomerRequest
        {
            Code = "KH" + Guid.NewGuid().ToString("N")[..10],
            Name = "Khách hàng TASK-31",
            TaxCode = $"03{Random.Shared.Next(10000000,99999999)}",
            Address = "TP.HCM",
            RepresentativeName = "Người đại diện"
        });
        customerResponse.EnsureSuccessStatusCode();
        var customer = await customerResponse.Content.ReadFromJsonAsync<CustomerDto>();
        Assert.NotNull(customer);

        var response = await _client.PostAsJsonAsync("/api/v1/contracts", new CreateContractRequest
        {
            CustomerId = customer!.Id,
            Title = title,
            EffectiveFrom = new DateOnly(2026, 11, 1),
            EffectiveTo = new DateOnly(2027, 11, 1),
            ContractValue = 1000000
        });
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ContractDto>();
        Assert.NotNull(result);
        return result!;
    }

    [Fact]
    public async Task Search_ByTitleAndStatus_ReturnsMatchingContract()
    {
        var unique = "T31" + Guid.NewGuid().ToString("N")[..10];
        var created = await CreateContractAsync(unique);
        var response = await _client.GetAsync($"/api/v1/contracts?keyword={unique}&status=Draft&pageIndex=1&pageSize=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.Content.ReadFromJsonAsync<PagedResult<ContractDto>>();
        Assert.NotNull(page);
        Assert.Contains(page!.Items, c => c.Id == created.Id);
        Assert.All(page.Items, c => Assert.Equal(ContractStatus.Draft, c.Status));
    }

    [Fact]
    public async Task Search_InvalidPageSize_Returns400()
    {
        var response = await _client.GetAsync("/api/v1/contracts?pageSize=101");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Detail_ExistingAndMissing_Return200And404()
    {
        var created = await CreateContractAsync("Chi tiết hợp đồng TASK31");
        var found = await _client.GetAsync($"/api/v1/contracts/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, found.StatusCode);
        var detail = await found.Content.ReadFromJsonAsync<ContractDto>();
        Assert.Equal(created.Id, detail!.Id);
        Assert.NotNull(detail.CustomerName);

        var missing = await _client.GetAsync($"/api/v1/contracts/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }
}
