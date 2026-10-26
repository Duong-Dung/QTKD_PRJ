using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Common;

namespace Qtkd.BuildingBlocks.Persistence;

/// <summary>
/// Lớp cơ sở DbContext dùng chung cho các Module trong hệ thống Modular Monolith.
/// Tự động cập nhật CreatedAt, UpdatedAt và cấu hình xmin làm Concurrency Token trên PostgreSQL.
/// </summary>
public abstract class ModuleDbContext : DbContext
{
    protected ModuleDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tự động cấu hình xmin làm Concurrency Token cho mọi thực thể kế thừa BaseEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property<uint>(nameof(BaseEntity.RowVersion))
                    .IsRowVersion();
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
