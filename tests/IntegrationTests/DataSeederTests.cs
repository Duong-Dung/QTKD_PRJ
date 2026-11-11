using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Qtkd.Api.Persistence;
using Qtkd.BuildingBlocks.Persistence;
using Qtkd.Modules.Identity.Entities;

namespace Qtkd.IntegrationTests;

public class DataSeederTests
{
    private static QtkdDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<QtkdDbContext>();
        PostgresDbContextOptions.Configure(options, PostgresDbContextOptions.FallbackConnectionString, "public");
        return new QtkdDbContext(options.Options);
    }

    [Fact]
    public async Task SeedAsync_ShouldSeedAllMasterDataAndSampleUsers()
    {
        await using var db = CreateDbContext();

        // 1. Chạy Seeder lần 1
        await QtkdDataSeeder.SeedAsync(db);

        // 2. Kiểm tra 6 phòng ban
        var departments = await db.Departments.ToListAsync();
        Assert.Equal(6, departments.Count);
        Assert.Contains(departments, d => d.Code == "BGD" && d.Name == "Ban Giám đốc");
        Assert.Contains(departments, d => d.Code == "KD" && d.Name == "Phòng Kinh doanh");
        Assert.Contains(departments, d => d.Code == "PC" && d.Name == "Phòng Pháp chế");
        Assert.Contains(departments, d => d.Code == "KT" && d.Name == "Phòng Khai thác");
        Assert.Contains(departments, d => d.Code == "TCKT" && d.Name == "Phòng Tài chính Kế toán");
        Assert.Contains(departments, d => d.Code == "QT" && d.Name == "Phòng Quản trị hệ thống");

        // 3. Kiểm tra 4 vai trò
        var roles = await db.Roles.ToListAsync();
        Assert.Equal(4, roles.Count);
        Assert.Contains(roles, r => r.Code == "ADMIN");
        Assert.Contains(roles, r => r.Code == "DIRECTOR");
        Assert.Contains(roles, r => r.Code == "MANAGER");
        Assert.Contains(roles, r => r.Code == "STAFF");

        // 4. Kiểm tra danh mục quyền hạn
        var permissions = await db.Permissions.ToListAsync();
        Assert.True(permissions.Count >= 20);
        Assert.Contains(permissions, p => p.Code == "contract.create");
        Assert.Contains(permissions, p => p.Code == "contract.approve");
        Assert.Contains(permissions, p => p.Code == "workflow.approve");

        // 5. Kiểm tra người dùng mẫu và băm mật khẩu
        var users = await db.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
            .ToListAsync();

        Assert.True(users.Count >= 7);

        var hasher = new PasswordHasher<User>();
        var admin = users.FirstOrDefault(u => u.Username == "admin");
        Assert.NotNull(admin);
        Assert.Equal("admin@qtkd.com", admin.Email);
        Assert.Equal("QT", admin.Department?.Code);
        Assert.Equal(
            PasswordVerificationResult.Success,
            hasher.VerifyHashedPassword(admin, admin.PasswordHash, QtkdDataSeeder.DefaultPassword));

        var giamdoc = users.FirstOrDefault(u => u.Username == "giamdoc");
        Assert.NotNull(giamdoc);
        Assert.Equal("BGD", giamdoc.Department?.Code);

        var nvKinhDoanh = users.FirstOrDefault(u => u.Username == "nv_kinhdoanh");
        Assert.NotNull(nvKinhDoanh);
        Assert.Equal("KD", nvKinhDoanh.Department?.Code);

        // 6. Kiểm tra khách hàng mẫu
        var customers = await db.Customers.ToListAsync();
        Assert.True(customers.Count >= 2);
        Assert.Contains(customers, c => c.Code == "CUST-0001");
        Assert.Contains(customers, c => c.Code == "CUST-0002");

        // 7. Kiểm tra workflow mẫu
        var workflow = await db.WorkflowDefinitions
            .Include(w => w.Steps)
            .FirstOrDefaultAsync(w => w.Code == "CONTRACT_APPROVAL");
        Assert.NotNull(workflow);
        Assert.Equal(2, workflow.Steps.Count);

        // 8. Kiểm tra tính Idempotent (chạy lại không ném lỗi trùng khóa và không nhân đôi dữ liệu)
        await QtkdDataSeeder.SeedAsync(db);
        var deptCountAfterSecondRun = await db.Departments.CountAsync();
        Assert.Equal(6, deptCountAfterSecondRun);
    }
}
