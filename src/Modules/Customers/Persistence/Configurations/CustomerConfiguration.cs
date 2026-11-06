using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Customers.Entities;

namespace Qtkd.Modules.Customers.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers", table =>
        {
            table.HasCheckConstraint(
                "ck_customers_tax_code_format",
                "tax_code ~ '^[0-9]{10}(-[0-9]{3})?$'");
            table.HasStatusCheck<Customer, CustomerStatus>("ck_customers_status");
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.TaxCode).HasMaxLength(14).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500).IsRequired();
        builder.Property(x => x.RepresentativeName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.RepresentativeTitle).HasMaxLength(100);
        builder.Property(x => x.ContactPerson).HasMaxLength(150);
        builder.Property(x => x.ContactPhone).HasMaxLength(20);
        builder.Property(x => x.ContactEmail).HasMaxLength(150);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.SuspendedReason).HasMaxLength(500);

        builder.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_customers_code");
        builder.HasIndex(x => x.TaxCode).IsUnique().HasDatabaseName("uq_customers_tax_code");
    }
}
