using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Identity.Configuration;
using Qtkd.Modules.Identity.Constants;
using Qtkd.Modules.Identity.DTOs;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Identity.Persistence;
using Qtkd.Modules.Identity.Services;
using Xunit;

namespace Qtkd.UnitTests;

public class IdentityAuthUnitTests
{
    private readonly PasswordHasher _passwordHasher = new();
    private readonly JwtTokenService _jwtTokenService;
    private readonly IOptions<JwtOptions> _jwtOptions;

    public IdentityAuthUnitTests()
    {
        _jwtOptions = Options.Create(new JwtOptions
        {
            SecretKey = "TestSuperSecretKeyForUnitTestsMustBeAtLeast32BytesLength!",
            Issuer = "QtkdTestIssuer",
            Audience = "QtkdTestAudience",
            ExpiryMinutes = 60,
            RefreshTokenExpiryDays = 7
        });
        _jwtTokenService = new JwtTokenService(_jwtOptions);
    }

    private static IdentityDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<IdentityDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new IdentityDbContext(options);
    }

    [Fact]
    public void PasswordHasher_ShouldHashAndVerifyPasswordCorrectly()
    {
        // Arrange
        const string rawPassword = "StrongPassword@2026";

        // Act
        var hash = _passwordHasher.HashPassword(rawPassword);
        var isValid = _passwordHasher.VerifyPassword(rawPassword, hash);
        var isInvalid = _passwordHasher.VerifyPassword("WrongPassword", hash);

        // Assert
        Assert.NotNull(hash);
        Assert.StartsWith("$2", hash); // BCrypt prefix
        Assert.True(isValid);
        Assert.False(isInvalid);
    }

    [Fact]
    public void JwtTokenService_ShouldGenerateValidAccessTokenWithRolesAndPermissions()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "dung_devops",
            FullName = "Nguyễn Văn Dũng",
            Email = "dung.devops@qtkd.com",
            DepartmentId = Guid.NewGuid(),
            Department = new Department { Code = "QTHU", Name = "Quản trị hệ thống" }
        };
        var roles = new[] { RoleConstants.Admin, RoleConstants.Director };
        var permissions = new[] { "users.manage", "contracts.approve" };

        // Act
        var tokenString = _jwtTokenService.GenerateAccessToken(user, roles, permissions);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(tokenString));

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        Assert.Equal("QtkdTestIssuer", jwtToken.Issuer);
        Assert.Contains("QtkdTestAudience", jwtToken.Audiences);

        // Claims check
        var claims = jwtToken.Claims.ToList();
        Assert.Contains(claims, c => (c.Type == "nameid" || c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier) && c.Value == user.Id.ToString());
        Assert.Contains(claims, c => (c.Type == "unique_name" || c.Type == ClaimTypes.Name) && c.Value == user.Username);
        Assert.Contains(claims, c => (c.Type == "email" || c.Type == ClaimTypes.Email) && c.Value == user.Email);
        Assert.Contains(claims, c => c.Type == "department_code" && c.Value == "QTHU");

        var roleClaims = claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value).ToList();
        Assert.Contains(RoleConstants.Admin, roleClaims);
        Assert.Contains(RoleConstants.Director, roleClaims);

        var permClaims = claims.Where(c => c.Type == "permission").Select(c => c.Value).ToList();
        Assert.Contains("users.manage", permClaims);
        Assert.Contains("contracts.approve", permClaims);
    }

    [Fact]
    public void JwtTokenService_ShouldGenerateSecureRefreshTokenAndHash()
    {
        // Act
        var (token, tokenHash, expiresAt) = _jwtTokenService.GenerateRefreshToken();

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.False(string.IsNullOrWhiteSpace(tokenHash));
        Assert.Equal(64, tokenHash.Length); // SHA-256 hex string is 64 characters
        Assert.True(expiresAt > DateTimeOffset.UtcNow);

        var recomputedHash = _jwtTokenService.HashRefreshToken(token);
        Assert.Equal(tokenHash, recomputedHash);
    }

    [Fact]
    public async Task AuthService_Login_WithValidCredentials_ShouldSucceed()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var dept = new Department { Id = Guid.NewGuid(), Code = "KD", Name = "Kinh doanh" };
        var role = new Role { Id = Guid.NewGuid(), Code = RoleConstants.Staff, Name = "Nhân viên" };
        var rawPassword = "Password123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "staff_user",
            Email = "staff@qtkd.com",
            PasswordHash = _passwordHasher.HashPassword(rawPassword),
            FullName = "Nguyễn Văn Staff",
            DepartmentId = dept.Id,
            IsActive = true
        };

        context.Departments.Add(dept);
        context.Roles.Add(role);
        context.Users.Add(user);
        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        await context.SaveChangesAsync();

        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act
        var response = await authService.LoginAsync(new LoginRequest
        {
            Username = "staff_user",
            Password = rawPassword
        });

        // Assert
        Assert.NotNull(response);
        Assert.False(string.IsNullOrWhiteSpace(response.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(response.RefreshToken));
        Assert.Equal("staff_user", response.User.Username);
        Assert.Contains(RoleConstants.Staff, response.User.Roles);
        Assert.NotNull(user.LastLoginAt);

        // Verify refresh token was saved in database
        var tokenCount = await context.RefreshTokens.CountAsync(rt => rt.UserId == user.Id);
        Assert.Equal(1, tokenCount);
    }

    [Fact]
    public async Task AuthService_Login_WithWrongPassword_ShouldThrowUnauthorized()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var dept = new Department { Id = Guid.NewGuid(), Code = "KD", Name = "Kinh doanh" };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "staff_user",
            Email = "staff@qtkd.com",
            PasswordHash = _passwordHasher.HashPassword("CorrectPassword"),
            FullName = "Nguyễn Văn Staff",
            DepartmentId = dept.Id,
            IsActive = true
        };
        context.Departments.Add(dept);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.LoginAsync(new LoginRequest { Username = "staff_user", Password = "WrongPassword" }));
    }

    [Fact]
    public async Task AuthService_Login_WithNonExistentUser_ShouldThrowUnauthorized()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.LoginAsync(new LoginRequest { Username = "non_existent_user", Password = "SomePassword" }));
    }

    [Fact]
    public async Task AuthService_Login_WithDisabledAccount_ShouldThrowForbidden()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var dept = new Department { Id = Guid.NewGuid(), Code = "QTHU", Name = "Quản trị" };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "disabled_user",
            Email = "disabled@qtkd.com",
            PasswordHash = _passwordHasher.HashPassword("Password123!"),
            FullName = "Tài khoản bị khóa",
            DepartmentId = dept.Id,
            IsActive = false // Account is locked/disabled
        };
        context.Departments.Add(dept);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            authService.LoginAsync(new LoginRequest { Username = "disabled_user", Password = "Password123!" }));
    }

    [Fact]
    public async Task AuthService_RefreshToken_WithValidToken_ShouldRotateSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var dept = new Department { Id = Guid.NewGuid(), Code = "QTHU", Name = "Quản trị" };
        var role = new Role { Id = Guid.NewGuid(), Code = RoleConstants.Admin, Name = "Admin" };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin_user",
            Email = "admin@qtkd.com",
            PasswordHash = "hash",
            FullName = "Admin",
            DepartmentId = dept.Id,
            IsActive = true
        };

        var (rawToken, tokenHash, expiresAt) = _jwtTokenService.GenerateRefreshToken();
        var initialRecord = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            RevokedAt = null
        };

        context.Departments.Add(dept);
        context.Roles.Add(role);
        context.Users.Add(user);
        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        context.RefreshTokens.Add(initialRecord);
        await context.SaveChangesAsync();

        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act: Refresh token
        var response = await authService.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = rawToken });

        // Assert
        Assert.NotNull(response);
        Assert.False(string.IsNullOrWhiteSpace(response.AccessToken));
        Assert.NotEqual(rawToken, response.RefreshToken); // Token must be rotated

        // Verify old token is revoked
        var oldTokenRecord = await context.RefreshTokens.FirstAsync(rt => rt.Id == initialRecord.Id);
        Assert.NotNull(oldTokenRecord.RevokedAt);

        // Verify new token exists in database
        var activeTokens = await context.RefreshTokens.Where(rt => rt.UserId == user.Id && rt.RevokedAt == null).ToListAsync();
        Assert.Single(activeTokens);
    }

    [Fact]
    public async Task AuthService_Login_WithNullOrEmptyCredentials_ShouldThrowUnauthorized()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.LoginAsync(new LoginRequest { Username = "", Password = "" }));
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.LoginAsync(new LoginRequest { Username = "user", Password = "   " }));
    }

    [Fact]
    public async Task AuthService_RefreshToken_WithEmptyToken_ShouldThrowUnauthorized()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = "" }));
    }

    [Fact]
    public async Task AuthService_GetCurrentUser_WithEmptyGuid_ShouldThrowUnauthorized()
    {
        // Arrange
        using var context = CreateInMemoryContext();
        var authService = new AuthService(context, _passwordHasher, _jwtTokenService, NullLogger<AuthService>.Instance);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            authService.GetCurrentUserAsync(Guid.Empty));
    }
}
