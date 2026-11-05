using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Identity.Constants;
using Qtkd.Modules.Identity.DTOs;
using Qtkd.Modules.Identity.Services;

namespace Qtkd.Modules.Identity.Controllers;

[ApiController]
[Route("api/v1/identity")]
[Tags("Identity")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng nhập hệ thống bằng Tên đăng nhập hoặc Email và Mật khẩu (TASK-18)
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var response = await _authService.LoginAsync(request, ct);
        return Ok(response);
    }

    /// <summary>
    /// Làm mới Access Token bằng Refresh Token (TASK-18)
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var response = await _authService.RefreshTokenAsync(request, ct);
        return Ok(response);
    }

    /// <summary>
    /// Lấy thông tin tài khoản người dùng hiện tại từ JWT Bearer token (TASK-18)
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("Mã định danh người dùng trong Token không hợp lệ.");
        }

        var user = await _authService.GetCurrentUserAsync(userId, ct);
        return Ok(user);
    }

    /// <summary>
    /// Lấy danh sách toàn bộ người dùng trong hệ thống (Dành cho ADMIN và MANAGER) (TASK-19)
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers(CancellationToken ct)
    {
        var users = await _authService.GetUsersAsync(ct);
        return Ok(users);
    }

    /// <summary>
    /// Lấy danh mục các vai trò và quyền hạn trong hệ thống (TASK-19)
    /// </summary>
    [HttpGet("roles")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<RoleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var roles = await _authService.GetRolesAsync(ct);
        return Ok(roles);
    }

    /// <summary>
    /// Endpoint kiểm tra phân quyền RBAC: Chỉ vai trò ADMIN (TASK-19)
    /// </summary>
    [HttpGet("rbac/admin-only")]
    [Authorize(Roles = RoleConstants.Admin)]
    public IActionResult CheckAdminAccess()
    {
        return Ok(new
        {
            Message = "Truy cập thành công! Bạn có đặc quyền Quản trị viên (ADMIN).",
            User = User.Identity?.Name,
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });
    }

    /// <summary>
    /// Endpoint kiểm tra phân quyền RBAC: Ban Giám đốc (DIRECTOR) hoặc ADMIN (TASK-19)
    /// </summary>
    [HttpGet("rbac/director-only")]
    [Authorize(Roles = $"{RoleConstants.Director},{RoleConstants.Admin}")]
    public IActionResult CheckDirectorAccess()
    {
        return Ok(new
        {
            Message = "Truy cập thành công! Bạn thuộc cấp Ban Giám đốc (DIRECTOR / ADMIN).",
            User = User.Identity?.Name,
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });
    }

    /// <summary>
    /// Endpoint kiểm tra phân quyền RBAC: Trưởng phòng (MANAGER), DIRECTOR hoặc ADMIN (TASK-19)
    /// </summary>
    [HttpGet("rbac/manager-only")]
    [Authorize(Roles = $"{RoleConstants.Manager},{RoleConstants.Director},{RoleConstants.Admin}")]
    public IActionResult CheckManagerAccess()
    {
        return Ok(new
        {
            Message = "Truy cập thành công! Bạn thuộc cấp Quản lý (MANAGER / DIRECTOR / ADMIN).",
            User = User.Identity?.Name,
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });
    }

    /// <summary>
    /// Endpoint kiểm tra phân quyền RBAC: Mọi nhân viên có vai trò hợp lệ (TASK-19)
    /// </summary>
    [HttpGet("rbac/staff-only")]
    [Authorize(Roles = $"{RoleConstants.Staff},{RoleConstants.Manager},{RoleConstants.Director},{RoleConstants.Admin}")]
    public IActionResult CheckStaffAccess()
    {
        return Ok(new
        {
            Message = "Truy cập thành công! Bạn là nhân sự chính thức của Công ty ABC.",
            User = User.Identity?.Name,
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value)
        });
    }

    /// <summary>
    /// Thông tin phân hệ Identity
    /// </summary>
    [HttpGet("info")]
    [AllowAnonymous]
    public IActionResult GetModuleInfo()
    {
        return Ok(new
        {
            Module = "Identity",
            Status = "Active",
            Description = "Quản lý định danh, xác thực JWT và phân quyền RBAC (TASK-18, TASK-19)",
            Endpoints = new[]
            {
                "POST /api/v1/identity/login",
                "POST /api/v1/identity/refresh-token",
                "GET /api/v1/identity/me",
                "GET /api/v1/identity/users",
                "GET /api/v1/identity/roles",
                "GET /api/v1/identity/rbac/admin-only",
                "GET /api/v1/identity/rbac/director-only",
                "GET /api/v1/identity/rbac/manager-only",
                "GET /api/v1/identity/rbac/staff-only"
            }
        });
    }
}
