using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Identity.Configuration;
using Qtkd.Modules.Identity.Constants;
using Qtkd.Modules.Identity.Persistence;
using Qtkd.Modules.Identity.Services;

namespace Qtkd.Modules.Identity.Extensions;

public static class IdentityModuleExtensions
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        // 1. Cấu hình DbContext Identity
        services.AddDbContext<IdentityDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        // 2. Cấu hình JWT Options
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        var secretKey = jwtSection.GetValue<string>("SecretKey")
            ?? "QtkdAbcLogisticsSuperSecretKey2026ForModularMonolithMustBeAtLeast32Bytes!";
        var issuer = jwtSection.GetValue<string>("Issuer") ?? "QtkdSolution";
        var audience = jwtSection.GetValue<string>("Audience") ?? "QtkdApp";

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        // 3. Đăng ký các dịch vụ cốt lõi (TASK-18)
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IdentityDbSeeder>();

        // 4. Cấu hình Xác thực JWT Bearer (TASK-18)
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
                RoleClaimType = ClaimTypes.Role,
                NameClaimType = ClaimTypes.Name
            };
        });

        // 5. Cấu hình Phân quyền RBAC (TASK-19)
        services.AddAuthorization(options =>
        {
            options.AddPolicy(RoleConstants.RequireAdmin, policy =>
                policy.RequireRole(RoleConstants.Admin));

            options.AddPolicy(RoleConstants.RequireDirector, policy =>
                policy.RequireRole(RoleConstants.Director, RoleConstants.Admin));

            options.AddPolicy(RoleConstants.RequireManager, policy =>
                policy.RequireRole(RoleConstants.Manager, RoleConstants.Director, RoleConstants.Admin));

            options.AddPolicy(RoleConstants.RequireStaff, policy =>
                policy.RequireRole(RoleConstants.Staff, RoleConstants.Manager, RoleConstants.Director, RoleConstants.Admin));
        });

        return services;
    }

    /// <summary>
    /// Khởi tạo dữ liệu mẫu phòng ban, vai trò, quyền hạn và tài khoản thử nghiệm (TASK-14 / TASK-18 / TASK-19)
    /// </summary>
    public static async Task SeedIdentityAsync(this IServiceProvider serviceProvider, CancellationToken ct = default)
    {
        using var scope = serviceProvider.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<IdentityDbSeeder>();
        await seeder.SeedAsync(ct);
    }
}
