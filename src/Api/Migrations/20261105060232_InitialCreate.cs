using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qtkd.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "customers",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    tax_code = table.Column<string>(type: "character varying(14)", maxLength: 14, nullable: false),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    representative_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    representative_title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    contact_person = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    contact_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    suspended_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    suspended_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customers", x => x.id);
                    table.CheckConstraint("ck_customers_status", "status IN ('Active', 'Suspended')");
                    table.CheckConstraint("ck_customers_tax_code_format", "tax_code ~ '^[0-9]{10}(-[0-9]{3})?$'");
                });

            migrationBuilder.CreateTable(
                name: "departments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_departments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    module = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "workflow_definitions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workflow_definitions", x => x.id);
                    table.CheckConstraint("ck_workflow_definitions_entity_type", "entity_type IN ('Contract', 'Addendum', 'PriceList', 'PaymentStatement')");
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    full_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    department_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    last_login_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.ForeignKey(
                        name: "fk_users_departments_department_id",
                        column: x => x.department_id,
                        principalSchema: "public",
                        principalTable: "departments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "public",
                columns: table => new
                {
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_role_permissions", x => new { x.role_id, x.permission_id });
                    table.ForeignKey(
                        name: "fk_role_permissions_permissions_permission_id",
                        column: x => x.permission_id,
                        principalSchema: "public",
                        principalTable: "permissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_role_permissions_roles_role_id",
                        column: x => x.role_id,
                        principalSchema: "public",
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "contracts",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    effective_from = table.Column<DateOnly>(type: "date", nullable: false),
                    effective_to = table.Column<DateOnly>(type: "date", nullable: false),
                    contract_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "char(3)", nullable: false, defaultValue: "VND"),
                    payment_terms = table.Column<string>(type: "text", nullable: true),
                    service_terms = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    revision_of_contract_id = table.Column<Guid>(type: "uuid", nullable: true),
                    cancelled_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_contracts", x => x.id);
                    table.CheckConstraint("ck_contracts_effective_dates", "effective_from <= effective_to");
                    table.CheckConstraint("ck_contracts_status", "status IN ('Draft', 'Submitted', 'UnderReview', 'Approved', 'Active', 'Expired', 'Rejected', 'RevisionRequested', 'Cancelled')");
                    table.CheckConstraint("ck_contracts_value_non_negative", "contract_value >= 0");
                    table.ForeignKey(
                        name: "fk_contracts_contracts_revision_of_contract_id",
                        column: x => x.revision_of_contract_id,
                        principalSchema: "public",
                        principalTable: "contracts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_contracts_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "public",
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_contracts_users_owner_user_id",
                        column: x => x.owner_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "idempotency_records",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    request_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    response_status = table.Column<int>(type: "integer", nullable: false),
                    response_body = table.Column<string>(type: "jsonb", nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_idempotency_records", x => x.id);
                    table.ForeignKey(
                        name: "fk_idempotency_records_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_refresh_tokens_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                schema: "public",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roles", x => new { x.user_id, x.role_id });
                    table.ForeignKey(
                        name: "fk_user_roles_roles_role_id",
                        column: x => x.role_id,
                        principalSchema: "public",
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_user_roles_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "workflow_instances",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    current_step_order = table.Column<int>(type: "integer", nullable: false),
                    started_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workflow_instances", x => x.id);
                    table.CheckConstraint("ck_workflow_instances_entity_type", "entity_type IN ('Contract', 'Addendum', 'PriceList', 'PaymentStatement')");
                    table.CheckConstraint("ck_workflow_instances_status", "status IN ('Running', 'Approved', 'Rejected', 'RevisionRequested', 'Cancelled')");
                    table.ForeignKey(
                        name: "fk_workflow_instances_users_started_by_user_id",
                        column: x => x.started_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_instances_workflow_definitions_definition_id",
                        column: x => x.definition_id,
                        principalSchema: "public",
                        principalTable: "workflow_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "workflow_step_definitions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_order = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    assignee_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    assignee_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    assignee_role_id = table.Column<Guid>(type: "uuid", nullable: true),
                    assignee_department_id = table.Column<Guid>(type: "uuid", nullable: true),
                    on_reject = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workflow_step_definitions", x => x.id);
                    table.CheckConstraint("ck_workflow_step_definitions_assignee_by_type", "(assignee_type = 'User'\n    AND assignee_user_id IS NOT NULL\n    AND assignee_role_id IS NULL\n    AND assignee_department_id IS NULL)\nOR\n(assignee_type = 'RoleInDepartment'\n    AND assignee_user_id IS NULL\n    AND assignee_role_id IS NOT NULL\n    AND assignee_department_id IS NOT NULL)");
                    table.CheckConstraint("ck_workflow_step_definitions_assignee_type", "assignee_type IN ('User', 'RoleInDepartment')");
                    table.CheckConstraint("ck_workflow_step_definitions_on_reject", "on_reject IN ('Rejected', 'RevisionRequested')");
                    table.CheckConstraint("ck_workflow_step_definitions_step_order", "step_order >= 1");
                    table.ForeignKey(
                        name: "fk_workflow_step_definitions_departments_assignee_department_id",
                        column: x => x.assignee_department_id,
                        principalSchema: "public",
                        principalTable: "departments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_step_definitions_roles_assignee_role_id",
                        column: x => x.assignee_role_id,
                        principalSchema: "public",
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_step_definitions_users_assignee_user_id",
                        column: x => x.assignee_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_step_definitions_workflow_definitions_definition_id",
                        column: x => x.definition_id,
                        principalSchema: "public",
                        principalTable: "workflow_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "contract_addenda",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    contract_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    change_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    effective_from = table.Column<DateOnly>(type: "date", nullable: false),
                    new_effective_to = table.Column<DateOnly>(type: "date", nullable: true),
                    new_payment_terms = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_contract_addenda", x => x.id);
                    table.CheckConstraint("ck_contract_addenda_change_type", "change_type IN ('PriceChange', 'ExtendTerm', 'PaymentTerms', 'AddService')");
                    table.CheckConstraint("ck_contract_addenda_status", "status IN ('Draft', 'Submitted', 'UnderReview', 'Approved', 'Active', 'Expired', 'Rejected', 'RevisionRequested', 'Cancelled')");
                    table.ForeignKey(
                        name: "fk_contract_addenda_contracts_contract_id",
                        column: x => x.contract_id,
                        principalSchema: "public",
                        principalTable: "contracts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_contract_addenda_users_owner_user_id",
                        column: x => x.owner_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "workflow_step_instances",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_order = table.Column<int>(type: "integer", nullable: false),
                    assignee_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    acted_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    acted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workflow_step_instances", x => x.id);
                    table.CheckConstraint("ck_workflow_step_instances_comment_required", "status NOT IN ('Rejected', 'RevisionRequested') OR (comment IS NOT NULL AND length(btrim(comment)) > 0)");
                    table.CheckConstraint("ck_workflow_step_instances_status", "status IN ('Waiting', 'Pending', 'Approved', 'Rejected', 'RevisionRequested')");
                    table.ForeignKey(
                        name: "fk_workflow_step_instances_step_definition_id",
                        column: x => x.step_definition_id,
                        principalSchema: "public",
                        principalTable: "workflow_step_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_step_instances_users_acted_by_user_id",
                        column: x => x.acted_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_step_instances_users_assignee_user_id",
                        column: x => x.assignee_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_step_instances_workflow_instances_instance_id",
                        column: x => x.instance_id,
                        principalSchema: "public",
                        principalTable: "workflow_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "contract_attachments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    contract_id = table.Column<Guid>(type: "uuid", nullable: false),
                    addendum_id = table.Column<Guid>(type: "uuid", nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    storage_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    checksum = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    is_main_document = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_contract_attachments", x => x.id);
                    table.CheckConstraint("ck_contract_attachments_size_positive", "size_bytes > 0");
                    table.ForeignKey(
                        name: "fk_contract_attachments_contract_addenda_addendum_id",
                        column: x => x.addendum_id,
                        principalSchema: "public",
                        principalTable: "contract_addenda",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_contract_attachments_contracts_contract_id",
                        column: x => x.contract_id,
                        principalSchema: "public",
                        principalTable: "contracts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "workflow_history",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    instance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_instance_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    to_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workflow_history", x => x.id);
                    table.CheckConstraint("ck_workflow_history_action", "action IN ('Submit', 'Approve', 'Reject', 'RequestRevision', 'Cancel')");
                    table.ForeignKey(
                        name: "fk_workflow_history_users_actor_user_id",
                        column: x => x.actor_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_history_workflow_instances_instance_id",
                        column: x => x.instance_id,
                        principalSchema: "public",
                        principalTable: "workflow_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_workflow_history_workflow_step_instances_step_instance_id",
                        column: x => x.step_instance_id,
                        principalSchema: "public",
                        principalTable: "workflow_step_instances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_contract_addenda_contract_id",
                schema: "public",
                table: "contract_addenda",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "ix_contract_addenda_owner_user_id",
                schema: "public",
                table: "contract_addenda",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "uq_contract_addenda_code",
                schema: "public",
                table: "contract_addenda",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_contract_attachments_addendum_id",
                schema: "public",
                table: "contract_attachments",
                column: "addendum_id");

            migrationBuilder.CreateIndex(
                name: "ix_contract_attachments_contract_id",
                schema: "public",
                table: "contract_attachments",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "ix_contracts_customer_id",
                schema: "public",
                table: "contracts",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_contracts_owner_user_id",
                schema: "public",
                table: "contracts",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_contracts_revision_of_contract_id",
                schema: "public",
                table: "contracts",
                column: "revision_of_contract_id");

            migrationBuilder.CreateIndex(
                name: "uq_contracts_code",
                schema: "public",
                table: "contracts",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_customers_code",
                schema: "public",
                table: "customers",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_customers_tax_code",
                schema: "public",
                table: "customers",
                column: "tax_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_departments_code",
                schema: "public",
                table: "departments",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_idempotency_records_user_id",
                schema: "public",
                table: "idempotency_records",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "uq_idempotency_records_user_id_idempotency_key",
                schema: "public",
                table: "idempotency_records",
                columns: new[] { "user_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_permissions_code",
                schema: "public",
                table: "permissions",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_user_id",
                schema: "public",
                table: "refresh_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "uq_refresh_tokens_token_hash",
                schema: "public",
                table: "refresh_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_role_permissions_permission_id",
                schema: "public",
                table: "role_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "uq_roles_code",
                schema: "public",
                table: "roles",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_roles_role_id",
                schema: "public",
                table: "user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_department_id",
                schema: "public",
                table: "users",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "uq_users_email_lower",
                schema: "public",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_users_username_lower",
                schema: "public",
                table: "users",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_workflow_definitions_code_version",
                schema: "public",
                table: "workflow_definitions",
                columns: new[] { "code", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_workflow_definitions_entity_type_active",
                schema: "public",
                table: "workflow_definitions",
                column: "entity_type",
                unique: true,
                filter: "is_active = TRUE");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_history_actor_user_id",
                schema: "public",
                table: "workflow_history",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_history_instance_id",
                schema: "public",
                table: "workflow_history",
                column: "instance_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_history_step_instance_id",
                schema: "public",
                table: "workflow_history",
                column: "step_instance_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_instances_definition_id",
                schema: "public",
                table: "workflow_instances",
                column: "definition_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_instances_started_by_user_id",
                schema: "public",
                table: "workflow_instances",
                column: "started_by_user_id");

            migrationBuilder.CreateIndex(
                name: "uq_workflow_instances_entity_running",
                schema: "public",
                table: "workflow_instances",
                columns: new[] { "entity_type", "entity_id" },
                unique: true,
                filter: "status = 'Running'");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_definitions_assignee_department_id",
                schema: "public",
                table: "workflow_step_definitions",
                column: "assignee_department_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_definitions_assignee_role_id",
                schema: "public",
                table: "workflow_step_definitions",
                column: "assignee_role_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_definitions_assignee_user_id",
                schema: "public",
                table: "workflow_step_definitions",
                column: "assignee_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_definitions_definition_id",
                schema: "public",
                table: "workflow_step_definitions",
                column: "definition_id");

            migrationBuilder.CreateIndex(
                name: "uq_workflow_step_definitions_definition_id_step_order",
                schema: "public",
                table: "workflow_step_definitions",
                columns: new[] { "definition_id", "step_order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_instances_acted_by_user_id",
                schema: "public",
                table: "workflow_step_instances",
                column: "acted_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_instances_assignee_user_id",
                schema: "public",
                table: "workflow_step_instances",
                column: "assignee_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_workflow_step_instances_step_definition_id",
                schema: "public",
                table: "workflow_step_instances",
                column: "step_definition_id");

            migrationBuilder.CreateIndex(
                name: "uq_workflow_step_instances_instance_pending",
                schema: "public",
                table: "workflow_step_instances",
                column: "instance_id",
                unique: true,
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "uq_workflow_step_instances_instance_step_order",
                schema: "public",
                table: "workflow_step_instances",
                columns: new[] { "instance_id", "step_order" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contract_attachments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "idempotency_records",
                schema: "public");

            migrationBuilder.DropTable(
                name: "refresh_tokens",
                schema: "public");

            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_roles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "workflow_history",
                schema: "public");

            migrationBuilder.DropTable(
                name: "contract_addenda",
                schema: "public");

            migrationBuilder.DropTable(
                name: "permissions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "workflow_step_instances",
                schema: "public");

            migrationBuilder.DropTable(
                name: "contracts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "workflow_step_definitions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "workflow_instances",
                schema: "public");

            migrationBuilder.DropTable(
                name: "customers",
                schema: "public");

            migrationBuilder.DropTable(
                name: "roles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "users",
                schema: "public");

            migrationBuilder.DropTable(
                name: "workflow_definitions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "departments",
                schema: "public");
        }
    }
}
