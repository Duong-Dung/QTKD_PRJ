using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Payments.Entities;

namespace Qtkd.Modules.Payments.Persistence;

public class PaymentsDbContext : ModuleDbContext
{
    public PaymentsDbContext(DbContextOptions<PaymentsDbContext> options) : base(options)
    {
    }

    public DbSet<PaymentStatement> Statements => Set<PaymentStatement>();
    public DbSet<PaymentLine> Lines => Set<PaymentLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("payments");

        modelBuilder.Entity<PaymentStatement>(entity =>
        {
            entity.ToTable("payment_statements");
            entity.HasIndex(s => s.StatementNumber).IsUnique();
            entity.Property(s => s.StatementNumber).HasMaxLength(100).IsRequired();
            entity.Property(s => s.TotalAmount).HasPrecision(18, 2);
            entity.Property(s => s.VatAmount).HasPrecision(18, 2);
            entity.Property(s => s.GrandTotal).HasPrecision(18, 2);
            entity.Property(s => s.Status).HasConversion<string>().HasMaxLength(30);

            entity.HasMany(s => s.Lines)
                .WithOne(l => l.Statement)
                .HasForeignKey(l => l.StatementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaymentLine>(entity =>
        {
            entity.ToTable("payment_lines");
            entity.Property(l => l.ServiceCode).HasMaxLength(50).IsRequired();
            entity.Property(l => l.ServiceName).HasMaxLength(256).IsRequired();
            entity.Property(l => l.Unit).HasMaxLength(50).IsRequired();
            entity.Property(l => l.UnitPrice).HasPrecision(18, 2);
            entity.Property(l => l.Quantity).HasPrecision(18, 4);
            entity.Property(l => l.Amount).HasPrecision(18, 2);
            entity.Property(l => l.VatRate).HasPrecision(5, 4);
            entity.Property(l => l.VatAmount).HasPrecision(18, 2);
            entity.Property(l => l.LineTotal).HasPrecision(18, 2);
        });
    }
}
