using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence.Configurations;

public class WorkflowHistoryConfiguration : IEntityTypeConfiguration<WorkflowHistory>
{
    public void Configure(EntityTypeBuilder<WorkflowHistory> builder)
    {
        builder.ToTable("workflow_history", table =>
        {
            table.HasCheckConstraint(
                "ck_workflow_history_action",
                RelationalCheck.InEnum<WorkflowAction>("action"));
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.FromStatus).HasMaxLength(30);
        builder.Property(x => x.ToStatus).HasMaxLength(30);
        builder.Property(x => x.Comment).HasMaxLength(1000);
        builder.Property(x => x.OccurredAt).IsRequired();

        builder.HasOne(x => x.StepInstance)
            .WithMany(x => x.History)
            .HasForeignKey(x => x.StepInstanceId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_history_workflow_step_instances_step_instance_id");

        builder.HasIndex(x => x.InstanceId).HasDatabaseName("ix_workflow_history_instance_id");
        builder.HasIndex(x => x.StepInstanceId).HasDatabaseName("ix_workflow_history_step_instance_id");
        builder.HasIndex(x => x.ActorUserId).HasDatabaseName("ix_workflow_history_actor_user_id");
    }
}
