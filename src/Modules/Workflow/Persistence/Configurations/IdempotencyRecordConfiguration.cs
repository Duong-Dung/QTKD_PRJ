using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence.Configurations;

public class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
    {
        builder.ToTable("idempotency_records");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IdempotencyKey).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RequestHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ResponseStatus).IsRequired();
        builder.Property(x => x.ResponseBody).HasColumnType("jsonb");
        builder.Property(x => x.ExpiresAt).IsRequired();

        builder.HasIndex(x => new { x.UserId, x.IdempotencyKey })
            .IsUnique()
            .HasDatabaseName("uq_idempotency_records_user_id_idempotency_key");
        builder.HasIndex(x => x.UserId).HasDatabaseName("ix_idempotency_records_user_id");
    }
}
