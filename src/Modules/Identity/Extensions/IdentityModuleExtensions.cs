using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Identity.Persistence;

namespace Qtkd.Modules.Identity.Extensions;

public static class IdentityModuleExtensions
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<IdentityDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        return services;
    }
}
