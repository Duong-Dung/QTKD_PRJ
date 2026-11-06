using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Contracts.Entities;

namespace Qtkd.Modules.Contracts.Persistence.Configurations;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.ToTable("contracts", table =>
        {
            table.HasCheckConstraint("ck_contracts_effective_dates", "effective_from <= effective_to");
            table.HasCheckConstraint("ck_contracts_value_non_negative", "contract_value >= 0");
            table.HasStatusCheck<Contract, ContractStatus>("ck_contracts_status");
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(250).IsRequired();
        builder.Property(x => x.ContractValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.Currency).HasColumnType("char(3)").IsRequired().HasDefaultValue("VND");
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.CancelledReason).HasMaxLength(500);

        builder.HasOne(x => x.RevisionOfContract)
            .WithMany(x => x.Revisions)
            .HasForeignKey(x => x.RevisionOfContractId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contracts_contracts_revision_of_contract_id");

        builder.HasMany(x => x.Attachments)
            .WithOne(x => x.Contract)
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contract_attachments_contracts_contract_id");

        builder.HasMany(x => x.Addenda)
            .WithOne(x => x.Contract)
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contract_addenda_contracts_contract_id");

        builder.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_contracts_code");
        builder.HasIndex(x => x.CustomerId).HasDatabaseName("ix_contracts_customer_id");
        builder.HasIndex(x => x.OwnerUserId).HasDatabaseName("ix_contracts_owner_user_id");
        builder.HasIndex(x => x.RevisionOfContractId).HasDatabaseName("ix_contracts_revision_of_contract_id");
    }
}
