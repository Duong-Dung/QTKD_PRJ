using System.Net;

namespace Qtkd.IntegrationTests;

public class ApiIntegrationTests : IClassFixture<QtkdWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(QtkdWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SwaggerEndpoint_ShouldReturnSuccessAndOpenApiJson()
    {
        // Act
        var response = await _client.GetAsync("/swagger/v1/swagger.json");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("QTKD ABC Logistics API", content);
        Assert.Contains("v1", content);
    }

    [Fact]
    public async Task HealthCheck_ShouldReturnHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", content);
    }

    [Fact]
    public async Task SystemStatus_ShouldReturnOperationalStatus()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/system/status");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Modular Monolith", content);
        Assert.Contains("Operational", content);
    }

    [Theory]
    [InlineData("/api/v1/identity/info")]
    [InlineData("/api/v1/customers/info")]
    [InlineData("/api/v1/contracts/info")]
    [InlineData("/api/v1/pricing/info")]
    [InlineData("/api/v1/production/info")]
    [InlineData("/api/v1/payments/info")]
    [InlineData("/api/v1/workflow/info")]
    [InlineData("/api/v1/audit/info")]
    [InlineData("/api/v1/esign/info")]
    [InlineData("/api/v1/notifications/info")]
    public async Task AllModules_ShouldReturnModuleInfo(string url)
    {
        // Act
        var response = await _client.GetAsync(url);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Active", content);
    }
}
