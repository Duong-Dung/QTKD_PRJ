using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Customers.Persistence;
using Qtkd.Modules.Customers.Services;
using Qtkd.Modules.Customers.Validators;

namespace Qtkd.Modules.Customers.Extensions;

public static class CustomersModuleExtensions
{
    public static IServiceCollection AddCustomersModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<CustomersDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        // Đăng ký FluentValidation
        services.AddValidatorsFromAssemblyContaining<CreateCustomerValidator>();

        // Đăng ký Service nghiệp vụ
        services.AddScoped<ICustomerService, CustomerService>();

        return services;
    }
}
