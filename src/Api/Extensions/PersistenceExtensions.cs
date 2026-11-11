using Microsoft.EntityFrameworkCore;
using Qtkd.Api.Persistence;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Identity.Services;

namespace Qtkd.Api.Extensions;

public static class PersistenceExtensions
{
    public static IServiceCollection AddQtkdPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<QtkdDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString, "public"));

        return services;
    }

    public static WebApplication ApplyQtkdMigrations(this WebApplication app)
    {
        var shouldMigrate = app.Configuration.GetValue<bool?>("Database:MigrateOnStartup")
            ?? app.Environment.IsDevelopment();

        if (!shouldMigrate)
        {
            return app;
        }

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<QtkdDbContext>();
        db.Database.Migrate();

        // Tự động khởi tạo dữ liệu mẫu cho Identity nếu chưa có (TASK-14 / TASK-18)
        var seeder = scope.ServiceProvider.GetService<IdentityDbSeeder>();
        seeder?.SeedAsync().GetAwaiter().GetResult();

        return app;
    }

    public static async Task<WebApplication> SeedQtkdDataAsync(this WebApplication app)
    {
        var shouldMigrate = app.Configuration.GetValue<bool?>("Database:MigrateOnStartup")
            ?? app.Environment.IsDevelopment();

        var shouldSeed = app.Configuration.GetValue<bool?>("Database:SeedOnStartup")
            ?? shouldMigrate;

        if (!shouldSeed)
        {
            return app;
        }

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<QtkdDbContext>();
        await QtkdDataSeeder.SeedAsync(db);
        return app;
    }
}
