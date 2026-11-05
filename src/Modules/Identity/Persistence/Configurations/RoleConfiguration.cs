using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.Modules.Identity.Entities;

namespace Qtkd.Modules.Identity.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();

        builder.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_roles_code");
    }
}
