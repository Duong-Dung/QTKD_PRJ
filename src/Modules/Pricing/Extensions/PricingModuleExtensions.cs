using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.Modules.Pricing.Persistence;

namespace Qtkd.Modules.Pricing.Extensions;

public static class PricingModuleExtensions
{
    public static IServiceCollection AddPricingModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Port=5432;Database=qtkd_db;Username=postgres;Password=postgres";

        services.AddDbContext<PricingDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "pricing");
            }));

        return services;
    }
}
