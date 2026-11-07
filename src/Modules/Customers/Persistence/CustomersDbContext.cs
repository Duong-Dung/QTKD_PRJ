using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Customers.Entities;

namespace Qtkd.Modules.Customers.Persistence;

public class CustomersDbContext : ModuleDbContext
{
    public CustomersDbContext(DbContextOptions<CustomersDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CustomersDbContext).Assembly);
    }
}
