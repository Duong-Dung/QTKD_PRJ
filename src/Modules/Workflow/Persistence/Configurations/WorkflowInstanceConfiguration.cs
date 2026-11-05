using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence.Configurations;

public class WorkflowInstanceConfiguration : IEntityTypeConfiguration<WorkflowInstance>
{
    public void Configure(EntityTypeBuilder<WorkflowInstance> builder)
    {
        builder.ToTable("workflow_instances", table =>
        {
            table.HasStatusCheck<WorkflowInstance, WorkflowInstanceStatus>("ck_workflow_instances_status");
            table.HasCheckConstraint(
                "ck_workflow_instances_entity_type",
                RelationalCheck.InEnum<WorkflowEntityType>("entity_type"));
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.EntityType).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.StartedByUserId).IsRequired();
        builder.Property(x => x.StartedAt).IsRequired();

        builder.HasMany(x => x.Steps)
            .WithOne(x => x.Instance)
            .HasForeignKey(x => x.InstanceId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_instances_workflow_instances_instance_id");

        builder.HasMany(x => x.History)
            .WithOne(x => x.Instance)
            .HasForeignKey(x => x.InstanceId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_history_workflow_instances_instance_id");

        builder.HasIndex(x => x.DefinitionId).HasDatabaseName("ix_workflow_instances_definition_id");
        builder.HasIndex(x => x.StartedByUserId).HasDatabaseName("ix_workflow_instances_started_by_user_id");
        builder.HasIndex(x => new { x.EntityType, x.EntityId })
            .IsUnique()
            .HasFilter("status = 'Running'")
            .HasDatabaseName("uq_workflow_instances_entity_running");
    }
}
