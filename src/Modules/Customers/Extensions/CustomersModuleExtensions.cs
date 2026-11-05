using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Customers.Persistence;

namespace Qtkd.Modules.Customers.Extensions;

public static class CustomersModuleExtensions
{
    public static IServiceCollection AddCustomersModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<CustomersDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        return services;
    }
}
