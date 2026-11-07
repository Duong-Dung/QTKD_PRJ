using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.Modules.Identity.Entities;

namespace Qtkd.Modules.Identity.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.ExpiresAt).IsRequired();

        builder.HasOne(x => x.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_refresh_tokens_users_user_id");

        builder.HasIndex(x => x.TokenHash).IsUnique().HasDatabaseName("uq_refresh_tokens_token_hash");
        builder.HasIndex(x => x.UserId).HasDatabaseName("ix_refresh_tokens_user_id");
    }
}
