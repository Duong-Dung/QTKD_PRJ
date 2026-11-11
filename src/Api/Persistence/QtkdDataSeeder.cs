using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Qtkd.Modules.Customers.Entities;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Workflow.Entities;

namespace Qtkd.Api.Persistence;

/// <summary>
/// TASK-14: Seed dữ liệu mẫu hệ thống (Phòng ban, Vai trò, Quyền hạn, Người dùng mẫu, Khách hàng & Workflow mẫu).
/// </summary>
public static class QtkdDataSeeder
{
    // =========================================================================
    // 1. Deterministic GUIDs (Hằng số định danh cố định để tham chiếu nhất quán)
    // =========================================================================
    public static class Ids
    {
        // 6 Phòng ban (Departments)
        public static readonly Guid DeptBanGiamDoc = Guid.Parse("019318a0-0001-7000-8000-000000000001");
        public static readonly Guid DeptKinhDoanh = Guid.Parse("019318a0-0002-7000-8000-000000000002");
        public static readonly Guid DeptPhapChe = Guid.Parse("019318a0-0003-7000-8000-000000000003");
        public static readonly Guid DeptKhaiThac = Guid.Parse("019318a0-0004-7000-8000-000000000004");
        public static readonly Guid DeptKeToan = Guid.Parse("019318a0-0005-7000-8000-000000000005");
        public static readonly Guid DeptQuanTriHeThong = Guid.Parse("019318a0-0006-7000-8000-000000000006");

        // 4 Vai trò (Roles)
        public static readonly Guid RoleAdmin = Guid.Parse("019318a0-0010-7000-8000-000000000010");
        public static readonly Guid RoleDirector = Guid.Parse("019318a0-0020-7000-8000-000000000020");
        public static readonly Guid RoleManager = Guid.Parse("019318a0-0030-7000-8000-000000000030");
        public static readonly Guid RoleStaff = Guid.Parse("019318a0-0040-7000-8000-000000000040");

        // Người dùng mẫu (Sample Users)
        public static readonly Guid UserAdmin = Guid.Parse("019318a0-0100-7000-8000-000000000100");
        public static readonly Guid UserGiamDoc = Guid.Parse("019318a0-0200-7000-8000-000000000200");
        public static readonly Guid UserTpKinhDoanh = Guid.Parse("019318a0-0300-7000-8000-000000000300");
        public static readonly Guid UserNvKinhDoanh = Guid.Parse("019318a0-0400-7000-8000-000000000400");
        public static readonly Guid UserTpPhapChe = Guid.Parse("019318a0-0500-7000-8000-000000000500");
        public static readonly Guid UserTpKetoan = Guid.Parse("019318a0-0600-7000-8000-000000000600");
        public static readonly Guid UserNvKhaiThac = Guid.Parse("019318a0-0700-7000-8000-000000000700");

        // Khách hàng mẫu (Sample Customers)
        public static readonly Guid CustomerBienDong = Guid.Parse("019318a0-0800-7000-8000-000000000800");
        public static readonly Guid CustomerNamA = Guid.Parse("019318a0-0801-7000-8000-000000000801");

        // Workflow mẫu (Sample Workflow)
        public static readonly Guid WorkflowContractApproval = Guid.Parse("019318a0-0900-7000-8000-000000000900");
        public static readonly Guid WorkflowStepPhapCheReview = Guid.Parse("019318a0-0901-7000-8000-000000000901");
        public static readonly Guid WorkflowStepGiamDocApprove = Guid.Parse("019318a0-0902-7000-8000-000000000902");
    }

    public const string DefaultPassword = "P@ssword123!";

    /// <summary>
    /// Thực hiện seed toàn bộ dữ liệu mẫu một cách Idempotent.
    /// </summary>
    public static async Task SeedAsync(QtkdDbContext context)
    {
        await SeedDepartmentsAsync(context);
        await SeedRolesAsync(context);
        await SeedPermissionsAsync(context);
        await SeedUsersAsync(context);
        await SeedCustomersAsync(context);
        await SeedWorkflowDefinitionsAsync(context);
    }

    // =========================================================================
    // 2. Seed 6 Phòng ban (Departments)
    // =========================================================================
    private static async Task SeedDepartmentsAsync(QtkdDbContext context)
    {
        var existingCodes = await context.Departments.Select(d => d.Code).ToListAsync();

        var departments = new List<Department>
        {
            new() { Id = Ids.DeptBanGiamDoc, Code = "BGD", Name = "Ban Giám đốc", IsActive = true },
            new() { Id = Ids.DeptKinhDoanh, Code = "KD", Name = "Phòng Kinh doanh", IsActive = true },
            new() { Id = Ids.DeptPhapChe, Code = "PC", Name = "Phòng Pháp chế", IsActive = true },
            new() { Id = Ids.DeptKhaiThac, Code = "KT", Name = "Phòng Khai thác", IsActive = true },
            new() { Id = Ids.DeptKeToan, Code = "TCKT", Name = "Phòng Tài chính Kế toán", IsActive = true },
            new() { Id = Ids.DeptQuanTriHeThong, Code = "QT", Name = "Phòng Quản trị hệ thống", IsActive = true }
        };

        var toAdd = departments.Where(d => !existingCodes.Contains(d.Code)).ToList();
        if (toAdd.Count > 0)
        {
            await context.Departments.AddRangeAsync(toAdd);
            await context.SaveChangesAsync();
        }
    }

    // =========================================================================
    // 3. Seed 4 Vai trò (Roles)
    // =========================================================================
    private static async Task SeedRolesAsync(QtkdDbContext context)
    {
        var existingCodes = await context.Roles.Select(r => r.Code).ToListAsync();

        var roles = new List<Role>
        {
            new() { Id = Ids.RoleAdmin, Code = "ADMIN", Name = "Quản trị viên hệ thống" },
            new() { Id = Ids.RoleDirector, Code = "DIRECTOR", Name = "Giám đốc" },
            new() { Id = Ids.RoleManager, Code = "MANAGER", Name = "Trưởng phòng / Quản lý" },
            new() { Id = Ids.RoleStaff, Code = "STAFF", Name = "Chuyên viên / Nhân viên" }
        };

        var toAdd = roles.Where(r => !existingCodes.Contains(r.Code)).ToList();
        if (toAdd.Count > 0)
        {
            await context.Roles.AddRangeAsync(toAdd);
            await context.SaveChangesAsync();
        }
    }

    // =========================================================================
    // 4. Seed Danh mục Quyền hạn (Permissions) & Gán cho Vai trò (RolePermissions)
    // =========================================================================
    private static async Task SeedPermissionsAsync(QtkdDbContext context)
    {
        var existingCodes = await context.Permissions.Select(p => p.Code).ToListAsync();

        var permissions = new List<Permission>
        {
            // Contracts
            new() { Code = "contract.create", Module = "Contracts", Description = "Tạo mới hồ sơ hợp đồng" },
            new() { Code = "contract.read", Module = "Contracts", Description = "Xem thông tin và tệp đính kèm hợp đồng" },
            new() { Code = "contract.update", Module = "Contracts", Description = "Chỉnh sửa nội dung hợp đồng" },
            new() { Code = "contract.submit", Module = "Contracts", Description = "Gửi phê duyệt hợp đồng" },
            new() { Code = "contract.approve", Module = "Contracts", Description = "Phê duyệt hợp đồng" },
            new() { Code = "contract.reject", Module = "Contracts", Description = "Từ chối phê duyệt hợp đồng" },
            new() { Code = "contract.cancel", Module = "Contracts", Description = "Hủy hợp đồng" },

            // Customers
            new() { Code = "customer.create", Module = "Customers", Description = "Thêm mới khách hàng" },
            new() { Code = "customer.read", Module = "Customers", Description = "Xem thông tin khách hàng" },
            new() { Code = "customer.update", Module = "Customers", Description = "Cập nhật thông tin khách hàng" },
            new() { Code = "customer.manage", Module = "Customers", Description = "Quản lý trạng thái khách hàng (tạm ngưng/kích hoạt)" },

            // Workflow
            new() { Code = "workflow.read", Module = "Workflow", Description = "Xem tiến trình quy trình phê duyệt" },
            new() { Code = "workflow.approve", Module = "Workflow", Description = "Thao tác duyệt bước trong quy trình" },
            new() { Code = "workflow.reject", Module = "Workflow", Description = "Thao tác từ chối bước trong quy trình" },
            new() { Code = "workflow.configure", Module = "Workflow", Description = "Cấu hình định nghĩa quy trình duyệt" },

            // Identity & System
            new() { Code = "user.manage", Module = "Identity", Description = "Quản lý tài khoản người dùng" },
            new() { Code = "role.manage", Module = "Identity", Description = "Quản lý vai trò và quyền hạn" },
            new() { Code = "audit.read", Module = "Audit", Description = "Xem nhật ký kiểm toán hệ thống" },

            // Pricing & Payments
            new() { Code = "pricing.manage", Module = "Pricing", Description = "Quản lý biểu giá dịch vụ" },
            new() { Code = "payment.manage", Module = "Payments", Description = "Quản lý bảng thanh toán đối soát" }
        };

        var toAddPerms = permissions.Where(p => !existingCodes.Contains(p.Code)).ToList();
        if (toAddPerms.Count > 0)
        {
            await context.Permissions.AddRangeAsync(toAddPerms);
            await context.SaveChangesAsync();
        }

        // Cập nhật bảng nối RolePermissions
        var allPerms = await context.Permissions.ToListAsync();
        var existingRolePerms = await context.RolePermissions
            .Select(rp => new { rp.RoleId, rp.PermissionId })
            .ToListAsync();

        var rolePermsToAdd = new List<RolePermission>();

        void Assign(Guid roleId, params string[] codes)
        {
            foreach (var code in codes)
            {
                var perm = allPerms.FirstOrDefault(p => p.Code == code);
                if (perm != null && !existingRolePerms.Any(x => x.RoleId == roleId && x.PermissionId == perm.Id))
                {
                    rolePermsToAdd.Add(new RolePermission { RoleId = roleId, PermissionId = perm.Id });
                }
            }
        }

        // 1. ADMIN: Toàn bộ quyền
        Assign(Ids.RoleAdmin, allPerms.Select(p => p.Code).ToArray());

        // 2. DIRECTOR: Duyệt cấp cao, ký hợp đồng, xem báo cáo & kiểm toán
        Assign(Ids.RoleDirector,
            "contract.read", "contract.approve", "contract.reject", "contract.cancel",
            "customer.read",
            "workflow.read", "workflow.approve", "workflow.reject",
            "audit.read", "pricing.manage", "payment.manage");

        // 3. MANAGER: Quản lý phòng ban, rà soát hợp đồng, thao tác bước duyệt
        Assign(Ids.RoleManager,
            "contract.create", "contract.read", "contract.update", "contract.submit", "contract.approve", "contract.reject",
            "customer.create", "customer.read", "customer.update",
            "workflow.read", "workflow.approve", "workflow.reject",
            "pricing.manage", "payment.manage");

        // 4. STAFF: Soạn thảo hợp đồng, gửi duyệt, quản lý khách hàng
        Assign(Ids.RoleStaff,
            "contract.create", "contract.read", "contract.update", "contract.submit",
            "customer.create", "customer.read", "customer.update",
            "workflow.read");

        if (rolePermsToAdd.Count > 0)
        {
            await context.RolePermissions.AddRangeAsync(rolePermsToAdd);
            await context.SaveChangesAsync();
        }
    }

    // =========================================================================
    // 5. Seed Người dùng mẫu (Users) & Gán vai trò (UserRoles)
    // =========================================================================
    private static async Task SeedUsersAsync(QtkdDbContext context)
    {
        var existingUsernames = await context.Users.Select(u => u.Username.ToLower()).ToListAsync();
        var hasher = new PasswordHasher<User>();

        var sampleUsers = new List<(User User, Guid RoleId)>
        {
            (
                new User
                {
                    Id = Ids.UserAdmin,
                    Username = "admin",
                    FullName = "Nguyễn Quản Trị",
                    Email = "admin@qtkd.com",
                    Phone = "0901000001",
                    DepartmentId = Ids.DeptQuanTriHeThong,
                    IsActive = true
                },
                Ids.RoleAdmin
            ),
            (
                new User
                {
                    Id = Ids.UserGiamDoc,
                    Username = "giamdoc",
                    FullName = "Trần Giám Đốc",
                    Email = "director@qtkd.com",
                    Phone = "0902000002",
                    DepartmentId = Ids.DeptBanGiamDoc,
                    IsActive = true
                },
                Ids.RoleDirector
            ),
            (
                new User
                {
                    Id = Ids.UserTpKinhDoanh,
                    Username = "tp_kinhdoanh",
                    FullName = "Lê Trưởng Kinh Doanh",
                    Email = "manager.kd@qtkd.com",
                    Phone = "0903000003",
                    DepartmentId = Ids.DeptKinhDoanh,
                    IsActive = true
                },
                Ids.RoleManager
            ),
            (
                new User
                {
                    Id = Ids.UserNvKinhDoanh,
                    Username = "nv_kinhdoanh",
                    FullName = "Phạm Nhân Viên KD",
                    Email = "staff.kd@qtkd.com",
                    Phone = "0904000004",
                    DepartmentId = Ids.DeptKinhDoanh,
                    IsActive = true
                },
                Ids.RoleStaff
            ),
            (
                new User
                {
                    Id = Ids.UserTpPhapChe,
                    Username = "tp_phapche",
                    FullName = "Hoàng Pháp Chế",
                    Email = "manager.pc@qtkd.com",
                    Phone = "0905000005",
                    DepartmentId = Ids.DeptPhapChe,
                    IsActive = true
                },
                Ids.RoleManager
            ),
            (
                new User
                {
                    Id = Ids.UserTpKetoan,
                    Username = "tp_ketoan",
                    FullName = "Đỗ Kế Toán Trưởng",
                    Email = "manager.tc@qtkd.com",
                    Phone = "0906000006",
                    DepartmentId = Ids.DeptKeToan,
                    IsActive = true
                },
                Ids.RoleManager
            ),
            (
                new User
                {
                    Id = Ids.UserNvKhaiThac,
                    Username = "nv_khaithac",
                    FullName = "Vũ Khai Thác",
                    Email = "staff.kt@qtkd.com",
                    Phone = "0907000007",
                    DepartmentId = Ids.DeptKhaiThac,
                    IsActive = true
                },
                Ids.RoleStaff
            )
        };

        foreach (var (user, roleId) in sampleUsers)
        {
            if (existingUsernames.Contains(user.Username.ToLower()))
            {
                continue;
            }

            user.PasswordHash = hasher.HashPassword(user, DefaultPassword);
            await context.Users.AddAsync(user);

            var userRole = new UserRole
            {
                UserId = user.Id,
                RoleId = roleId
            };
            await context.UserRoles.AddAsync(userRole);
        }

        await context.SaveChangesAsync();
    }

    // =========================================================================
    // 6. Seed Khách hàng mẫu (Customers)
    // =========================================================================
    private static async Task SeedCustomersAsync(QtkdDbContext context)
    {
        var existingCodes = await context.Customers.Select(c => c.Code).ToListAsync();

        var customers = new List<Customer>
        {
            new()
            {
                Id = Ids.CustomerBienDong,
                Code = "CUST-0001",
                Name = "Công ty Cổ phần Vận tải Biển Đông",
                TaxCode = "0101234567",
                Address = "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                RepresentativeName = "Nguyễn Văn Đông",
                RepresentativeTitle = "Giám đốc điều hành",
                ContactPerson = "Trần Thị Mai",
                ContactPhone = "0912345678",
                ContactEmail = "contact@biendongshipping.vn",
                Status = CustomerStatus.Active
            },
            new()
            {
                Id = Ids.CustomerNamA,
                Code = "CUST-0002",
                Name = "Công ty TNHH Logistics Nam Á",
                TaxCode = "0309876543-001",
                Address = "Lô C2, Đường K1, KCN Cát Lái 2, TP. Thủ Đức, TP. Hồ Chí Minh",
                RepresentativeName = "Trần Nam Á",
                RepresentativeTitle = "Tổng Giám đốc",
                ContactPerson = "Lê Văn Hùng",
                ContactPhone = "0987654321",
                ContactEmail = "logistics@nama.com.vn",
                Status = CustomerStatus.Active
            }
        };

        var toAdd = customers.Where(c => !existingCodes.Contains(c.Code)).ToList();
        if (toAdd.Count > 0)
        {
            await context.Customers.AddRangeAsync(toAdd);
            await context.SaveChangesAsync();
        }
    }

    // =========================================================================
    // 7. Seed Quy trình phê duyệt mẫu (Workflow Definition & Steps)
    // =========================================================================
    private static async Task SeedWorkflowDefinitionsAsync(QtkdDbContext context)
    {
        var exists = await context.WorkflowDefinitions
            .AnyAsync(w => w.Code == "CONTRACT_APPROVAL" && w.Version == 1);

        if (exists)
        {
            return;
        }

        var workflow = new WorkflowDefinition
        {
            Id = Ids.WorkflowContractApproval,
            Code = "CONTRACT_APPROVAL",
            EntityType = WorkflowEntityType.Contract,
            Name = "Quy trình phê duyệt hợp đồng dịch vụ logistics",
            Version = 1,
            IsActive = true,
            Steps = new List<WorkflowStepDefinition>
            {
                new()
                {
                    Id = Ids.WorkflowStepPhapCheReview,
                    StepOrder = 1,
                    Name = "Pháp chế rà soát hồ sơ & pháp lý",
                    AssigneeType = AssigneeType.RoleInDepartment,
                    AssigneeRoleId = Ids.RoleManager,
                    AssigneeDepartmentId = Ids.DeptPhapChe,
                    OnReject = OnRejectAction.RevisionRequested
                },
                new()
                {
                    Id = Ids.WorkflowStepGiamDocApprove,
                    StepOrder = 2,
                    Name = "Ban Giám đốc phê duyệt hợp đồng",
                    AssigneeType = AssigneeType.RoleInDepartment,
                    AssigneeRoleId = Ids.RoleDirector,
                    AssigneeDepartmentId = Ids.DeptBanGiamDoc,
                    OnReject = OnRejectAction.Rejected
                }
            }
        };

        await context.WorkflowDefinitions.AddAsync(workflow);
        await context.SaveChangesAsync();
    }
}
