using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qtkd.Modules.Identity.Constants;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Identity.Persistence;

namespace Qtkd.Modules.Identity.Services;

public class IdentityDbSeeder
{
    private readonly IdentityDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<IdentityDbSeeder> _logger;

    public IdentityDbSeeder(
        IdentityDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<IdentityDbSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        // 1. Seed Phòng ban (Departments)
        if (!await _context.Departments.AnyAsync(ct))
        {
            var departments = new List<Department>
            {
                new() { Id = Guid.CreateVersion7(), Code = "KD", Name = "Phòng Kinh doanh", IsActive = true },
                new() { Id = Guid.CreateVersion7(), Code = "KT", Name = "Phòng Kế toán", IsActive = true },
                new() { Id = Guid.CreateVersion7(), Code = "PC", Name = "Phòng Pháp chế", IsActive = true },
                new() { Id = Guid.CreateVersion7(), Code = "BGD", Name = "Ban Giám đốc", IsActive = true },
                new() { Id = Guid.CreateVersion7(), Code = "QTHU", Name = "Phòng Quản trị hệ thống", IsActive = true },
                new() { Id = Guid.CreateVersion7(), Code = "KTNV", Name = "Phòng Kỹ thuật nghiệp vụ", IsActive = true }
            };

            await _context.Departments.AddRangeAsync(departments, ct);
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Đã khởi tạo thành công {Count} phòng ban mặc định.", departments.Count);
        }

        // 2. Seed Vai trò (Roles)
        if (!await _context.Roles.AnyAsync(ct))
        {
            var roles = new List<Role>
            {
                new() { Id = Guid.CreateVersion7(), Code = RoleConstants.Admin, Name = "Quản trị hệ thống" },
                new() { Id = Guid.CreateVersion7(), Code = RoleConstants.Director, Name = "Ban Giám đốc" },
                new() { Id = Guid.CreateVersion7(), Code = RoleConstants.Manager, Name = "Trưởng phòng" },
                new() { Id = Guid.CreateVersion7(), Code = RoleConstants.Staff, Name = "Nhân viên" }
            };

            await _context.Roles.AddRangeAsync(roles, ct);
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Đã khởi tạo thành công {Count} vai trò chuẩn RBAC.", roles.Count);
        }

        // 3. Seed Quyền hạn chi tiết (Permissions)
        if (!await _context.Permissions.AnyAsync(ct))
        {
            var permissions = new List<Permission>
            {
                new() { Id = Guid.CreateVersion7(), Code = "users.view", Module = "Identity", Description = "Xem danh sách người dùng" },
                new() { Id = Guid.CreateVersion7(), Code = "users.manage", Module = "Identity", Description = "Quản lý tài khoản và phân quyền" },
                new() { Id = Guid.CreateVersion7(), Code = "customers.view", Module = "Customers", Description = "Xem thông tin khách hàng" },
                new() { Id = Guid.CreateVersion7(), Code = "customers.manage", Module = "Customers", Description = "Thêm mới và chỉnh sửa khách hàng" },
                new() { Id = Guid.CreateVersion7(), Code = "contracts.view", Module = "Contracts", Description = "Xem hợp đồng và phụ lục" },
                new() { Id = Guid.CreateVersion7(), Code = "contracts.create", Module = "Contracts", Description = "Lập hợp đồng và gửi duyệt" },
                new() { Id = Guid.CreateVersion7(), Code = "contracts.approve", Module = "Contracts", Description = "Phê duyệt hợp đồng" },
                new() { Id = Guid.CreateVersion7(), Code = "workflow.approve", Module = "Workflow", Description = "Phê duyệt bước trong quy trình" },
                new() { Id = Guid.CreateVersion7(), Code = "workflow.reject", Module = "Workflow", Description = "Từ chối hoặc yêu cầu chỉnh sửa hồ sơ" }
            };

            await _context.Permissions.AddRangeAsync(permissions, ct);
            await _context.SaveChangesAsync(ct);

            // Gán quyền cho các vai trò
            var adminRole = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Admin, ct);
            var directorRole = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Director, ct);
            var managerRole = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Manager, ct);
            var staffRole = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Staff, ct);

            var rolePermissions = new List<RolePermission>();

            // Admin: full quyền
            foreach (var perm in permissions)
            {
                rolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = perm.Id });
            }

            // Director
            var directorPerms = permissions.Where(p => p.Code.Contains("approve") || p.Code.Contains("view") || p.Code.Contains("reject"));
            foreach (var perm in directorPerms)
            {
                rolePermissions.Add(new RolePermission { RoleId = directorRole.Id, PermissionId = perm.Id });
            }

            // Manager
            var managerPerms = permissions.Where(p => !p.Code.StartsWith("users.manage"));
            foreach (var perm in managerPerms)
            {
                rolePermissions.Add(new RolePermission { RoleId = managerRole.Id, PermissionId = perm.Id });
            }

            // Staff
            var staffPerms = permissions.Where(p => p.Code.Contains("view") || p.Code.Contains("create"));
            foreach (var perm in staffPerms)
            {
                rolePermissions.Add(new RolePermission { RoleId = staffRole.Id, PermissionId = perm.Id });
            }

            await _context.RolePermissions.AddRangeAsync(rolePermissions, ct);
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Đã khởi tạo và gán {Count} quyền hạn theo vai trò.", rolePermissions.Count);
        }

        // 4. Seed Người dùng mẫu (Users)
        if (!await _context.Users.AnyAsync(ct))
        {
            var deptQthu = await _context.Departments.FirstAsync(d => d.Code == "QTHU", ct);
            var deptBgd = await _context.Departments.FirstAsync(d => d.Code == "BGD", ct);
            var deptKd = await _context.Departments.FirstAsync(d => d.Code == "KD", ct);
            var deptPc = await _context.Departments.FirstAsync(d => d.Code == "PC", ct);
            var deptKt = await _context.Departments.FirstAsync(d => d.Code == "KT", ct);

            var roleAdmin = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Admin, ct);
            var roleDirector = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Director, ct);
            var roleManager = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Manager, ct);
            var roleStaff = await _context.Roles.FirstAsync(r => r.Code == RoleConstants.Staff, ct);

            var defaultPasswordHash = _passwordHasher.HashPassword("Password123!");

            var users = new List<(User user, Role role)>
            {
                (new User
                {
                    Id = Guid.CreateVersion7(),
                    Username = "admin",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Quản Trị Viên Hệ Thống",
                    Email = "admin@qtkd.com",
                    Phone = "0901000001",
                    DepartmentId = deptQthu.Id,
                    IsActive = true
                }, roleAdmin),

                (new User
                {
                    Id = Guid.CreateVersion7(),
                    Username = "giamdoc",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Nguyễn Văn Giám Đốc",
                    Email = "giamdoc@qtkd.com",
                    Phone = "0901000002",
                    DepartmentId = deptBgd.Id,
                    IsActive = true
                }, roleDirector),

                (new User
                {
                    Id = Guid.CreateVersion7(),
                    Username = "truongphong_kd",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Trần Thị Trưởng Phòng KD",
                    Email = "truongphong.kd@qtkd.com",
                    Phone = "0901000003",
                    DepartmentId = deptKd.Id,
                    IsActive = true
                }, roleManager),

                (new User
                {
                    Id = Guid.CreateVersion7(),
                    Username = "nhanvien_kd",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Lê Văn Kinh Doanh",
                    Email = "nhanvien.kd@qtkd.com",
                    Phone = "0901000004",
                    DepartmentId = deptKd.Id,
                    IsActive = true
                }, roleStaff),

                (new User
                {
                    Id = Guid.CreateVersion7(),
                    Username = "nhanvien_pc",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Phạm Thị Pháp Chế",
                    Email = "nhanvien.pc@qtkd.com",
                    Phone = "0901000005",
                    DepartmentId = deptPc.Id,
                    IsActive = true
                }, roleStaff),

                (new User
                {
                    Id = Guid.CreateVersion7(),
                    Username = "nhanvien_kt",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Hoàng Văn Kế Toán",
                    Email = "nhanvien.kt@qtkd.com",
                    Phone = "0901000006",
                    DepartmentId = deptKt.Id,
                    IsActive = true
                }, roleStaff)
            };

            foreach (var item in users)
            {
                await _context.Users.AddAsync(item.user, ct);
                await _context.UserRoles.AddAsync(new UserRole
                {
                    UserId = item.user.Id,
                    RoleId = item.role.Id
                }, ct);
            }

            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("Đã khởi tạo thành công {Count} người dùng mẫu với mật khẩu 'Password123!'.", users.Count);
        }
    }
}
