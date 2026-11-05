using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.Modules.Identity.Entities;

namespace Qtkd.Modules.Identity.Persistence.Configurations;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions");
        builder.HasKey(x => new { x.RoleId, x.PermissionId });

        builder.HasOne(x => x.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_role_permissions_roles_role_id");

        builder.HasOne(x => x.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(x => x.PermissionId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_role_permissions_permissions_permission_id");

        builder.HasIndex(x => x.PermissionId).HasDatabaseName("ix_role_permissions_permission_id");
    }
}
