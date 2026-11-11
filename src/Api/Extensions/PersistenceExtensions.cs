using Microsoft.EntityFrameworkCore;
using Qtkd.Api.Persistence;
using Qtkd.BuildingBlocks.Persistence;

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
