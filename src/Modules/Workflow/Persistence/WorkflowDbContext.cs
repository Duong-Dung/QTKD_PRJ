using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence;

public class WorkflowDbContext : ModuleDbContext
{
    public WorkflowDbContext(DbContextOptions<WorkflowDbContext> options) : base(options)
    {
    }

    public DbSet<WorkflowDefinition> Definitions => Set<WorkflowDefinition>();
    public DbSet<StepDefinition> StepDefinitions => Set<StepDefinition>();
    public DbSet<WorkflowInstance> Instances => Set<WorkflowInstance>();
    public DbSet<StepInstance> StepInstances => Set<StepInstance>();
    public DbSet<WorkflowHistory> Histories => Set<WorkflowHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("workflow");

        modelBuilder.Entity<WorkflowDefinition>(entity =>
        {
            entity.ToTable("definitions");
            entity.HasIndex(d => new { d.Code, d.Version }).IsUnique();
            entity.Property(d => d.Code).HasMaxLength(100).IsRequired();
            entity.Property(d => d.Name).HasMaxLength(256).IsRequired();
            entity.Property(d => d.EntityType).HasMaxLength(100).IsRequired();

            entity.HasMany(d => d.Steps)
                .WithOne(s => s.WorkflowDefinition)
                .HasForeignKey(s => s.WorkflowDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StepDefinition>(entity =>
        {
            entity.ToTable("step_definitions");
            entity.Property(s => s.StepName).HasMaxLength(150).IsRequired();
            entity.Property(s => s.RequiredRole).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<WorkflowInstance>(entity =>
        {
            entity.ToTable("instances");
            entity.Property(i => i.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(i => i.Status).HasConversion<string>().HasMaxLength(30);

            entity.HasMany(i => i.Steps)
                .WithOne(s => s.WorkflowInstance)
                .HasForeignKey(s => s.WorkflowInstanceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(i => i.Histories)
                .WithOne(h => h.WorkflowInstance)
                .HasForeignKey(h => h.WorkflowInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StepInstance>(entity =>
        {
            entity.ToTable("step_instances");
            entity.Property(s => s.StepName).HasMaxLength(150).IsRequired();
            entity.Property(s => s.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<WorkflowHistory>(entity =>
        {
            entity.ToTable("histories");
            entity.Property(h => h.Action).HasMaxLength(50).IsRequired();
            entity.Property(h => h.ActorName).HasMaxLength(150).IsRequired();
            entity.Property(h => h.Comment).HasMaxLength(1000);
        });
    }
}
