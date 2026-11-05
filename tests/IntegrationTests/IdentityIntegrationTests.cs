using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Qtkd.Modules.Identity.Configuration;
using Qtkd.Modules.Identity.Constants;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Identity.Services;
using Xunit;

namespace Qtkd.IntegrationTests;

public class IdentityIntegrationTests : IClassFixture<QtkdWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly IJwtTokenService _jwtTokenService;

    public IdentityIntegrationTests(QtkdWebApplicationFactory factory)
    {
        _client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<JwtOptions>>();
        _jwtTokenService = new JwtTokenService(options);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_ShouldReturn401Unauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/identity/me");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminOnlyEndpoint_WithoutToken_ShouldReturn401Unauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/identity/rbac/admin-only");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task StaffRole_AccessingAdminOnly_ShouldReturn403Forbidden()
    {
        // Arrange: Tạo token cho user có vai trò STAFF
        var staffUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "staff_test",
            FullName = "Nhân viên kiểm thử",
            Email = "staff.test@qtkd.com",
            DepartmentId = Guid.NewGuid()
        };
        var token = _jwtTokenService.GenerateAccessToken(staffUser, new[] { RoleConstants.Staff }, []);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/identity/rbac/admin-only");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert: 403 Forbidden vì user có token hợp lệ nhưng không đủ quyền ADMIN
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task StaffRole_AccessingStaffOnly_ShouldReturn200Ok()
    {
        // Arrange
        var staffUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "staff_test",
            FullName = "Nhân viên kiểm thử",
            Email = "staff.test@qtkd.com",
            DepartmentId = Guid.NewGuid()
        };
        var token = _jwtTokenService.GenerateAccessToken(staffUser, new[] { RoleConstants.Staff }, []);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/identity/rbac/staff-only");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("staff_test", content);
    }

    [Fact]
    public async Task AdminRole_AccessingAdminOnly_ShouldReturn200Ok()
    {
        // Arrange: Tạo token cho user có vai trò ADMIN
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin_test",
            FullName = "Admin kiểm thử",
            Email = "admin.test@qtkd.com",
            DepartmentId = Guid.NewGuid()
        };
        var token = _jwtTokenService.GenerateAccessToken(adminUser, new[] { RoleConstants.Admin }, []);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/identity/rbac/admin-only");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert: 200 OK
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("admin_test", content);
        Assert.Contains("ADMIN", content);
    }

    [Fact]
    public async Task IdentityInfo_ShouldReturnListOfAuthEndpoints()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/identity/info");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Identity", content);
        Assert.Contains("/api/v1/identity/login", content);
        Assert.Contains("/api/v1/identity/me", content);
    }
}

