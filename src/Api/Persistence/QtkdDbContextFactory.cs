using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Qtkd.BuildingBlocks.Persistence;

namespace Qtkd.Api.Persistence;

public class QtkdDbContextFactory : IDesignTimeDbContextFactory<QtkdDbContext>
{
    public QtkdDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        var optionsBuilder = new DbContextOptionsBuilder<QtkdDbContext>();
        PostgresDbContextOptions.Configure(optionsBuilder, connectionString, "public");
        return new QtkdDbContext(optionsBuilder.Options);
    }
}
