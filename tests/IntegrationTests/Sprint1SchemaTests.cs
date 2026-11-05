using Microsoft.EntityFrameworkCore;
using Qtkd.Api.Persistence;
using Qtkd.BuildingBlocks.Persistence;

namespace Qtkd.IntegrationTests;

public class Sprint1SchemaTests
{
    [Fact]
    public void QtkdDbContext_ShouldMapSprint1Tables()
    {
        var options = new DbContextOptionsBuilder<QtkdDbContext>();
        PostgresDbContextOptions.Configure(options, PostgresDbContextOptions.FallbackConnectionString, "public");

        using var db = new QtkdDbContext(options.Options);
        var tables = db.Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct()
            .OrderBy(name => name)
            .ToList();

        // 17 bang Sprint 1 theo dung ERD:
        // Khach hang (1): customers
        // Hop dong (3): contracts, contract_attachments, contract_addenda
        // Tai khoan (7): departments, roles, permissions, role_permissions, users, user_roles, refresh_tokens
        // Workflow (6): workflow_definitions, workflow_step_definitions, workflow_instances, workflow_step_instances, workflow_history, idempotency_records
        Assert.Equal(17, tables.Count);
        Assert.Contains("customers", tables);
        Assert.Contains("contracts", tables);
        Assert.Contains("contract_attachments", tables);
        Assert.Contains("contract_addenda", tables);
        Assert.Contains("departments", tables);
        Assert.Contains("roles", tables);
        Assert.Contains("permissions", tables);
        Assert.Contains("role_permissions", tables);
        Assert.Contains("users", tables);
        Assert.Contains("user_roles", tables);
        Assert.Contains("refresh_tokens", tables);
        Assert.Contains("workflow_definitions", tables);
        Assert.Contains("workflow_step_definitions", tables);
        Assert.Contains("workflow_instances", tables);
        Assert.Contains("workflow_step_instances", tables);
        Assert.Contains("workflow_history", tables);
        Assert.Contains("idempotency_records", tables);
    }
}
