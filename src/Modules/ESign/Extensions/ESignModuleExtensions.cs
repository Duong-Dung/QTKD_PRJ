using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.Modules.ESign.Persistence;

namespace Qtkd.Modules.ESign.Extensions;

public static class ESignModuleExtensions
{
    public static IServiceCollection AddESignModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Port=5432;Database=qtkd_db;Username=postgres;Password=postgres";

        services.AddDbContext<ESignDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "esign");
            }));

        return services;
    }
}
