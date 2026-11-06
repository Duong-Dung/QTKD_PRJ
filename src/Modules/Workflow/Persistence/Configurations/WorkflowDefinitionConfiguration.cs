using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Modules.Workflow.Persistence.Configurations;

public class WorkflowDefinitionConfiguration : IEntityTypeConfiguration<WorkflowDefinition>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinition> builder)
    {
        builder.ToTable("workflow_definitions", table =>
        {
            table.HasCheckConstraint(
                "ck_workflow_definitions_entity_type",
                RelationalCheck.InEnum<WorkflowEntityType>("entity_type"));
        });

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.EntityType).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.HasMany(x => x.Steps)
            .WithOne(x => x.Definition)
            .HasForeignKey(x => x.DefinitionId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_definitions_workflow_definitions_definition_id");

        builder.HasMany(x => x.Instances)
            .WithOne(x => x.Definition)
            .HasForeignKey(x => x.DefinitionId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_instances_workflow_definitions_definition_id");

        builder.HasIndex(x => new { x.Code, x.Version })
            .IsUnique()
            .HasDatabaseName("uq_workflow_definitions_code_version");

        builder.HasIndex(x => x.EntityType)
            .IsUnique()
            .HasFilter("is_active = TRUE")
            .HasDatabaseName("uq_workflow_definitions_entity_type_active");
    }
}
