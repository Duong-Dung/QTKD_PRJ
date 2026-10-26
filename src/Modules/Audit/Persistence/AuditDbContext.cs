using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Audit.Entities;

namespace Qtkd.Modules.Audit.Persistence;

public class AuditDbContext : ModuleDbContext
{
    public AuditDbContext(DbContextOptions<AuditDbContext> options) : base(options)
    {
    }

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("audit");

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs");
            entity.HasIndex(a => new { a.EntityType, a.EntityId });
            entity.HasIndex(a => a.Timestamp);

            entity.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(a => a.EntityId).HasMaxLength(100).IsRequired();
            entity.Property(a => a.Action).HasMaxLength(50).IsRequired();
            entity.Property(a => a.Actor).HasMaxLength(150).IsRequired();
            entity.Property(a => a.BeforeJson).HasColumnType("jsonb");
            entity.Property(a => a.AfterJson).HasColumnType("jsonb");
            entity.Property(a => a.Note).HasMaxLength(1000);
            entity.Property(a => a.CorrelationId).HasMaxLength(100);
        });
    }
}
