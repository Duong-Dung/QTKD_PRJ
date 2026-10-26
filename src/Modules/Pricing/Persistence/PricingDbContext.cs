using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Pricing.Entities;

namespace Qtkd.Modules.Pricing.Persistence;

public class PricingDbContext : ModuleDbContext
{
    public PricingDbContext(DbContextOptions<PricingDbContext> options) : base(options)
    {
    }

    public DbSet<PriceList> PriceLists => Set<PriceList>();
    public DbSet<PriceItem> PriceItems => Set<PriceItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("pricing");

        modelBuilder.Entity<PriceList>(entity =>
        {
            entity.ToTable("price_lists");
            entity.HasIndex(p => p.Code).IsUnique();
            entity.Property(p => p.Code).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Name).HasMaxLength(256).IsRequired();
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(30);

            entity.HasMany(p => p.Items)
                .WithOne(i => i.PriceList)
                .HasForeignKey(i => i.PriceListId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PriceItem>(entity =>
        {
            entity.ToTable("price_items");
            entity.Property(i => i.ServiceCode).HasMaxLength(50).IsRequired();
            entity.Property(i => i.ServiceName).HasMaxLength(256).IsRequired();
            entity.Property(i => i.Unit).HasMaxLength(50).IsRequired();
            entity.Property(i => i.UnitPrice).HasPrecision(18, 2);
        });
    }
}
