using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Notification.Entities;

namespace Qtkd.Modules.Notification.Persistence;

public class NotificationDbContext : ModuleDbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<NotificationMessage> Notifications => Set<NotificationMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("notifications");

        modelBuilder.Entity<NotificationMessage>(entity =>
        {
            entity.ToTable("notification_messages");
            entity.HasIndex(n => new { n.UserId, n.IsRead });
            entity.Property(n => n.Title).HasMaxLength(256).IsRequired();
            entity.Property(n => n.Content).HasMaxLength(1000).IsRequired();
            entity.Property(n => n.Type).HasMaxLength(50).IsRequired();
            entity.Property(n => n.ActionUrl).HasMaxLength(500);
        });
    }
}
