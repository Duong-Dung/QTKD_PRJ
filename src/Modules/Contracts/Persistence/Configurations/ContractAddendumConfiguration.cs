using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Contracts.Entities;

namespace Qtkd.Modules.Contracts.Persistence.Configurations;

public class ContractAddendumConfiguration : IEntityTypeConfiguration<ContractAddendum>
{
    public void Configure(EntityTypeBuilder<ContractAddendum> builder)
    {
        builder.ToTable("contract_addenda", table =>
        {
            table.HasStatusCheck<ContractAddendum, ContractStatus>("ck_contract_addenda_status");
            table.HasCheckConstraint(
                "ck_contract_addenda_change_type",
                RelationalCheck.InEnum<AddendumChangeType>("change_type"));
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(30).IsRequired();
        builder.Property(x => x.ChangeType).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();

        builder.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_contract_addenda_code");
        builder.HasIndex(x => x.ContractId).HasDatabaseName("ix_contract_addenda_contract_id");
        builder.HasIndex(x => x.OwnerUserId).HasDatabaseName("ix_contract_addenda_owner_user_id");
    }
}
