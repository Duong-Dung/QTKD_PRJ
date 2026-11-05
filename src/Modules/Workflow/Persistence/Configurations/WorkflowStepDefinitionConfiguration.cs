using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence.Configurations;

public class WorkflowStepDefinitionConfiguration : IEntityTypeConfiguration<WorkflowStepDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowStepDefinition> builder)
    {
        builder.ToTable("workflow_step_definitions", table =>
        {
            table.HasCheckConstraint("ck_workflow_step_definitions_step_order", "step_order >= 1");
            table.HasCheckConstraint(
                "ck_workflow_step_definitions_assignee_type",
                RelationalCheck.InEnum<AssigneeType>("assignee_type"));
            table.HasCheckConstraint(
                "ck_workflow_step_definitions_on_reject",
                RelationalCheck.InEnum<OnRejectAction>("on_reject"));
            table.HasCheckConstraint(
                "ck_workflow_step_definitions_assignee_by_type",
                """
                (assignee_type = 'User'
                    AND assignee_user_id IS NOT NULL
                    AND assignee_role_id IS NULL
                    AND assignee_department_id IS NULL)
                OR
                (assignee_type = 'RoleInDepartment'
                    AND assignee_user_id IS NULL
                    AND assignee_role_id IS NOT NULL
                    AND assignee_department_id IS NOT NULL)
                """);
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.AssigneeType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.OnReject).HasConversion<string>().HasMaxLength(30).IsRequired();

        builder.HasIndex(x => new { x.DefinitionId, x.StepOrder })
            .IsUnique()
            .HasDatabaseName("uq_workflow_step_definitions_definition_id_step_order");

        builder.HasIndex(x => x.DefinitionId).HasDatabaseName("ix_workflow_step_definitions_definition_id");
        builder.HasIndex(x => x.AssigneeUserId).HasDatabaseName("ix_workflow_step_definitions_assignee_user_id");
        builder.HasIndex(x => x.AssigneeRoleId).HasDatabaseName("ix_workflow_step_definitions_assignee_role_id");
        builder.HasIndex(x => x.AssigneeDepartmentId).HasDatabaseName("ix_workflow_step_definitions_assignee_department_id");
    }
}
