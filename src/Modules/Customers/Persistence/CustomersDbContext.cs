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

        modelBuilder.HasDefaultSchema("customers");

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");
            entity.HasIndex(c => c.Code).IsUnique();
            entity.HasIndex(c => c.TaxCode).IsUnique();
            entity.Property(c => c.Code).HasMaxLength(50).IsRequired();
            entity.Property(c => c.Name).HasMaxLength(256).IsRequired();
            entity.Property(c => c.TaxCode).HasMaxLength(20).IsRequired();
            entity.Property(c => c.Representative).HasMaxLength(150);
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(30);
        });
    }
}
