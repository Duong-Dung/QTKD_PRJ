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
    public DbSet<ContractAttachment> ContractAttachments => Set<ContractAttachment>();
    public DbSet<ContractAddendum> ContractAddenda => Set<ContractAddendum>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ContractsDbContext).Assembly);
    }
}
