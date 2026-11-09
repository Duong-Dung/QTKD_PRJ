using Microsoft.EntityFrameworkCore;

namespace Qtkd.BuildingBlocks.Persistence;

public static class PostgresDbContextOptions
{
    public const string FallbackConnectionString =
        "Host=localhost;Port=5432;Database=qtkd_db;Username=postgres;Password=postgres";

    public static void Configure(
        DbContextOptionsBuilder options,
        string connectionString,
        string? migrationsHistorySchema = null)
    {
        options.UseNpgsql(connectionString, npgsql =>
        {
            if (!string.IsNullOrWhiteSpace(migrationsHistorySchema))
            {
                npgsql.MigrationsHistoryTable("__ef_migrations_history", migrationsHistorySchema);
            }
        });
        options.UseSnakeCaseNamingConvention();
    }
}
