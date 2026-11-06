using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Persistence;

namespace Qtkd.Modules.Workflow.Extensions;

public static class WorkflowModuleExtensions
{
    public static IServiceCollection AddWorkflowModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? PostgresDbContextOptions.FallbackConnectionString;

        services.AddDbContext<WorkflowDbContext>(options =>
            PostgresDbContextOptions.Configure(options, connectionString));

        return services;
    }
}
