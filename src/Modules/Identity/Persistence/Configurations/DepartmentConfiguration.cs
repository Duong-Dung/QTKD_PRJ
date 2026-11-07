using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.Modules.Identity.Entities;

namespace Qtkd.Modules.Identity.Persistence.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("departments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_departments_code");
    }
}
