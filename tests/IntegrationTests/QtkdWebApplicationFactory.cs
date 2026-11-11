using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Qtkd.Api.Persistence;
using Qtkd.Modules.Contracts.Persistence;
using Qtkd.Modules.Customers.Persistence;
using Qtkd.Modules.Identity.Persistence;
using Qtkd.Modules.Workflow.Persistence;

namespace Qtkd.IntegrationTests;

public class QtkdWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"IntegrationTests_Db_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Database:MigrateOnStartup", "false");
        builder.UseEnvironment("Development");
        builder.ConfigureTestServices(services =>
        {
            // Sử dụng một internal service provider riêng cho InMemory database để tránh xung đột
            // với Npgsql PostgreSQL provider đã được đăng ký ở root container (System.InvalidOperationException).
            var inMemoryServiceProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            services.RemoveAll<DbContextOptions<CustomersDbContext>>();
            services.AddDbContext<CustomersDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName)
                       .UseInternalServiceProvider(inMemoryServiceProvider);
            });

            services.RemoveAll<DbContextOptions<QtkdDbContext>>();
            services.AddDbContext<QtkdDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName)
                       .UseInternalServiceProvider(inMemoryServiceProvider);
            });

            services.RemoveAll<DbContextOptions<IdentityDbContext>>();
            services.AddDbContext<IdentityDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName)
                       .UseInternalServiceProvider(inMemoryServiceProvider);
            });

            services.RemoveAll<DbContextOptions<ContractsDbContext>>();
            services.AddDbContext<ContractsDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName)
                       .UseInternalServiceProvider(inMemoryServiceProvider);
            });

            services.RemoveAll<DbContextOptions<WorkflowDbContext>>();
            services.AddDbContext<WorkflowDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName)
                       .UseInternalServiceProvider(inMemoryServiceProvider);
            });
        });
    }
}
