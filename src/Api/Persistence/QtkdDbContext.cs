using Microsoft.EntityFrameworkCore;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Contracts.Entities;
using Qtkd.Modules.Contracts.Persistence;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Customers.Persistence;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Identity.Persistence;
using Qtkd.Modules.Workflow.Entities;
using Qtkd.Modules.Workflow.Persistence;

namespace Qtkd.Api.Persistence;

/// <summary>
/// DbContext thống nhất Sprint 1 (TASK-13): Khớp 17 bảng ERD (18 bảng trên PostgreSQL bao gồm __ef_migrations_history).
/// Bao gồm 4 nhóm: Tài khoản (7), Khách hàng (1), Hợp đồng (3), Workflow (6) trên schema public.
/// </summary>
public class QtkdDbContext : ModuleDbContext
{
    public QtkdDbContext(DbContextOptions<QtkdDbContext> options) : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractAttachment> ContractAttachments => Set<ContractAttachment>();
    public DbSet<ContractAddendum> ContractAddenda => Set<ContractAddendum>();
    public DbSet<WorkflowDefinition> WorkflowDefinitions => Set<WorkflowDefinition>();
    public DbSet<WorkflowStepDefinition> WorkflowStepDefinitions => Set<WorkflowStepDefinition>();
    public DbSet<WorkflowInstance> WorkflowInstances => Set<WorkflowInstance>();
    public DbSet<WorkflowStepInstance> WorkflowStepInstances => Set<WorkflowStepInstance>();
    public DbSet<WorkflowHistory> WorkflowHistory => Set<WorkflowHistory>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(IdentityDbContext).Assembly);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CustomersDbContext).Assembly);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ContractsDbContext).Assembly);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WorkflowDbContext).Assembly);

        ConfigureCrossModuleRelationships(modelBuilder);
    }

    private static void ConfigureCrossModuleRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Contract>()
            .HasOne<Customer>()
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contracts_customers_customer_id");

        modelBuilder.Entity<Contract>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contracts_users_owner_user_id");

        modelBuilder.Entity<ContractAddendum>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_contract_addenda_users_owner_user_id");

        modelBuilder.Entity<WorkflowStepDefinition>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.AssigneeUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_definitions_users_assignee_user_id");

        modelBuilder.Entity<WorkflowStepDefinition>()
            .HasOne<Role>()
            .WithMany()
            .HasForeignKey(x => x.AssigneeRoleId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_definitions_roles_assignee_role_id");

        modelBuilder.Entity<WorkflowStepDefinition>()
            .HasOne<Department>()
            .WithMany()
            .HasForeignKey(x => x.AssigneeDepartmentId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_definitions_departments_assignee_department_id");

        modelBuilder.Entity<WorkflowInstance>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.StartedByUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_instances_users_started_by_user_id");

        modelBuilder.Entity<WorkflowStepInstance>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.AssigneeUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_instances_users_assignee_user_id");

        modelBuilder.Entity<WorkflowStepInstance>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.ActedByUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_step_instances_users_acted_by_user_id");

        modelBuilder.Entity<WorkflowHistory>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_workflow_history_users_actor_user_id");

        modelBuilder.Entity<IdempotencyRecord>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_idempotency_records_users_user_id");
    }
}
