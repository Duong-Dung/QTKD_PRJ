using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Contracts.Entities;

namespace Qtkd.Modules.Contracts.Persistence;

public class ContractsDbContext : ModuleDbContext
{
    public ContractsDbContext(DbContextOptions<ContractsDbContext> options) : base(options)
    {
    }

    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractAttachment> Attachments => Set<ContractAttachment>();
    public DbSet<ContractAddendum> Addendums => Set<ContractAddendum>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("contracts");

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.ToTable("contracts");
            entity.HasIndex(c => c.ContractNumber).IsUnique();
            entity.Property(c => c.ContractNumber).HasMaxLength(100).IsRequired();
            entity.Property(c => c.CustomerCode).HasMaxLength(50).IsRequired();
            entity.Property(c => c.Value).HasPrecision(18, 2);
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(30);

            entity.HasMany(c => c.Attachments)
                .WithOne(a => a.Contract)
                .HasForeignKey(a => a.ContractId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.Addendums)
                .WithOne(a => a.Contract)
                .HasForeignKey(a => a.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContractAttachment>(entity =>
        {
            entity.ToTable("contract_attachments");
            entity.Property(a => a.FileName).HasMaxLength(256).IsRequired();
            entity.Property(a => a.StoragePath).HasMaxLength(500).IsRequired();
        });

        modelBuilder.Entity<ContractAddendum>(entity =>
        {
            entity.ToTable("contract_addendums");
            entity.Property(a => a.AddendumNumber).HasMaxLength(100).IsRequired();
            entity.Property(a => a.NewValue).HasPrecision(18, 2);
            entity.Property(a => a.Status).HasConversion<string>().HasMaxLength(30);
        });
    }
}
