using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.Modules.Contracts.Entities;

namespace Qtkd.Modules.Contracts.Persistence.Configurations;

public class ContractAttachmentConfiguration : IEntityTypeConfiguration<ContractAttachment>
{
    public void Configure(EntityTypeBuilder<ContractAttachment> builder)
    {
        builder.ToTable("contract_attachments", table =>
        {
            table.HasCheckConstraint("ck_contract_attachments_size_positive", "size_bytes > 0");
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.FileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.SizeBytes).IsRequired();
        builder.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Checksum).HasMaxLength(64);
        builder.Property(x => x.IsMainDocument).IsRequired().HasDefaultValue(false);

        builder.HasOne(x => x.Addendum)
            .WithMany(x => x.Attachments)
            .HasForeignKey(x => x.AddendumId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contract_attachments_contract_addenda_addendum_id");

        builder.HasIndex(x => x.ContractId).HasDatabaseName("ix_contract_attachments_contract_id");
        builder.HasIndex(x => x.AddendumId).HasDatabaseName("ix_contract_attachments_addendum_id");
    }
}
