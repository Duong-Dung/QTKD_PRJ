using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Contracts.Persistence;

namespace Qtkd.Modules.Contracts.Extensions;

public static class ContractsModuleExtensions
{
    public static IServiceCollection AddContractsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<ContractsDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        return services;
    }
}
