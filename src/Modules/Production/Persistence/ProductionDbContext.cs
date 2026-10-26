using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Production.Entities;

namespace Qtkd.Modules.Production.Persistence;

public class ProductionDbContext : ModuleDbContext
{
    public ProductionDbContext(DbContextOptions<ProductionDbContext> options) : base(options)
    {
    }

    public DbSet<ProductionPeriod> Periods => Set<ProductionPeriod>();
    public DbSet<ProductionRecord> Records => Set<ProductionRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("production");

        modelBuilder.Entity<ProductionPeriod>(entity =>
        {
            entity.ToTable("production_periods");
            entity.HasIndex(p => p.PeriodCode).IsUnique();
            entity.Property(p => p.PeriodCode).HasMaxLength(50).IsRequired();
            entity.Property(p => p.Name).HasMaxLength(150).IsRequired();

            entity.HasMany(p => p.Records)
                .WithOne(r => r.Period)
                .HasForeignKey(r => r.PeriodId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductionRecord>(entity =>
        {
            entity.ToTable("production_records");
            entity.Property(r => r.ServiceCode).HasMaxLength(50).IsRequired();
            entity.Property(r => r.Quantity).HasPrecision(18, 4);
            entity.Property(r => r.Unit).HasMaxLength(50).IsRequired();
            entity.Property(r => r.Source).HasMaxLength(100);
        });
    }
}
