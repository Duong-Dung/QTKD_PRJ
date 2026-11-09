using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence.Configurations;

public class WorkflowStepInstanceConfiguration : IEntityTypeConfiguration<WorkflowStepInstance>
{
    public void Configure(EntityTypeBuilder<WorkflowStepInstance> builder)
    {
        builder.ToTable("workflow_step_instances", table =>
        {
            table.HasStatusCheck<WorkflowStepInstance, WorkflowStepStatus>("ck_workflow_step_instances_status");
            table.HasCheckConstraint(
                "ck_workflow_step_instances_comment_required",
                "status NOT IN ('Rejected', 'RevisionRequested') OR (comment IS NOT NULL AND length(btrim(comment)) > 0)");
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Comment).HasMaxLength(1000);

        builder.HasOne(x => x.StepDefinition)
            .WithMany(x => x.StepInstances)
            .HasForeignKey(x => x.StepDefinitionId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_instances_step_definition_id");

        builder.HasIndex(x => x.InstanceId).HasDatabaseName("ix_workflow_step_instances_instance_id");
        builder.HasIndex(x => x.StepDefinitionId).HasDatabaseName("ix_workflow_step_instances_step_definition_id");
        builder.HasIndex(x => x.AssigneeUserId).HasDatabaseName("ix_workflow_step_instances_assignee_user_id");
        builder.HasIndex(x => x.ActedByUserId).HasDatabaseName("ix_workflow_step_instances_acted_by_user_id");
        builder.HasIndex(x => new { x.InstanceId, x.StepOrder })
            .IsUnique()
            .HasDatabaseName("uq_workflow_step_instances_instance_step_order");
        builder.HasIndex(x => x.InstanceId)
            .IsUnique()
            .HasFilter("status = 'Pending'")
            .HasDatabaseName("uq_workflow_step_instances_instance_pending");
    }
}
