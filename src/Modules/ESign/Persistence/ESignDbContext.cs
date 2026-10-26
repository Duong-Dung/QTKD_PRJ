using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.ESign.Entities;

namespace Qtkd.Modules.ESign.Persistence;

public class ESignDbContext : ModuleDbContext
{
    public ESignDbContext(DbContextOptions<ESignDbContext> options) : base(options)
    {
    }

    public DbSet<EsignSession> Sessions => Set<EsignSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("esign");

        modelBuilder.Entity<EsignSession>(entity =>
        {
            entity.ToTable("esign_sessions");
            entity.Property(s => s.DocumentType).HasMaxLength(50).IsRequired();
            entity.Property(s => s.DocumentHash).HasMaxLength(256).IsRequired();
            entity.Property(s => s.SignerEmail).HasMaxLength(256).IsRequired();
            entity.Property(s => s.SignerName).HasMaxLength(150).IsRequired();
            entity.Property(s => s.Status).HasConversion<string>().HasMaxLength(30);
        });
    }
}
