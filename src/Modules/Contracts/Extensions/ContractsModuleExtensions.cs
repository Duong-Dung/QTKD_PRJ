using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Contracts.Persistence;
using Qtkd.Modules.Contracts.Services;
using Qtkd.Modules.Contracts.Validators;

namespace Qtkd.Modules.Contracts.Extensions;

public static class ContractsModuleExtensions
{
    public static IServiceCollection AddContractsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<ContractsDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        // Đăng ký FluentValidation
        services.AddValidatorsFromAssemblyContaining<CreateContractValidator>();

        // Đăng ký Service nghiệp vụ
        services.AddScoped<IContractCodeGenerator, ContractCodeGenerator>();
        services.AddScoped<IContractService, ContractService>();

        return services;
    }
}