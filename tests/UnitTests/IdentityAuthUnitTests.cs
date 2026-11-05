using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Qtkd.Modules.Identity.Configuration;
using Qtkd.Modules.Identity.Constants;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Identity.Services;
using Xunit;

namespace Qtkd.UnitTests;

public class IdentityAuthUnitTests
{
    private readonly PasswordHasher _passwordHasher = new();
    private readonly JwtTokenService _jwtTokenService;

    public IdentityAuthUnitTests()
    {
        var options = Options.Create(new JwtOptions
        {
            SecretKey = "TestSuperSecretKeyForUnitTestsMustBeAtLeast32BytesLength!",
            Issuer = "QtkdTestIssuer",
            Audience = "QtkdTestAudience",
            ExpiryMinutes = 60,
            RefreshTokenExpiryDays = 7
        });
        _jwtTokenService = new JwtTokenService(options);
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
}
