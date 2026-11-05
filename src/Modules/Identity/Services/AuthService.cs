using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Identity.DTOs;
using Qtkd.Modules.Identity.Entities;
using Qtkd.Modules.Identity.Persistence;

namespace Qtkd.Modules.Identity.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<UserDto>> GetUsersAsync(CancellationToken ct = default);
    Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly IdentityDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IdentityDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var inputIdentifier = request.Username.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role!)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission!)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == inputIdentifier || u.Email.ToLower() == inputIdentifier, ct);

        if (user == null)
        {
            _logger.LogWarning("Đăng nhập thất bại: Tài khoản '{Username}' không tồn tại trong hệ thống.", request.Username);
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Đăng nhập thất bại: Tài khoản '{Username}' đang bị khóa/vô hiệu hóa.", request.Username);
            throw new ForbiddenException("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            _logger.LogWarning("Đăng nhập thất bại: Mật khẩu không chính xác cho tài khoản '{Username}'.", request.Username);
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role!.Code)
            .Distinct()
            .ToList();

        var permissions = user.UserRoles
            .Where(ur => ur.Role != null)
            .SelectMany(ur => ur.Role!.RolePermissions)
            .Where(rp => rp.Permission != null)
            .Select(rp => rp.Permission!.Code)
            .Distinct()
            .ToList();

        var accessToken = _jwtTokenService.GenerateAccessToken(user, roles, permissions);
        var (rawRefreshToken, tokenHash, expiresAt) = _jwtTokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            RevokedAt = null
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        user.LastLoginAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Người dùng '{Username}' (Id: {UserId}) đăng nhập thành công lúc {LoginAt}.",
            user.Username, user.Id, user.LastLoginAt);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            TokenType = "Bearer",
            ExpiresIn = 7200, // 120 phút
            User = MapToDto(user, roles, permissions)
        };
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var tokenHash = _jwtTokenService.HashRefreshToken(request.RefreshToken.Trim());

        var tokenRecord = await _context.RefreshTokens
            .Include(rt => rt.User!)
                .ThenInclude(u => u.Department)
            .Include(rt => rt.User!)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role!)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission!)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, ct);

        if (tokenRecord == null || tokenRecord.RevokedAt != null || tokenRecord.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn.");
        }

        var user = tokenRecord.User;
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedException("Tài khoản người dùng không hợp lệ hoặc đã bị khóa.");
        }

        // Thu hồi token cũ (rotate refresh token)
        tokenRecord.RevokedAt = DateTimeOffset.UtcNow;

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role!.Code)
            .Distinct()
            .ToList();

        var permissions = user.UserRoles
            .Where(ur => ur.Role != null)
            .SelectMany(ur => ur.Role!.RolePermissions)
            .Where(rp => rp.Permission != null)
            .Select(rp => rp.Permission!.Code)
            .Distinct()
            .ToList();

        var newAccessToken = _jwtTokenService.GenerateAccessToken(user, roles, permissions);
        var (newRawRefreshToken, newTokenHash, newExpiresAt) = _jwtTokenService.GenerateRefreshToken();

        var newRefreshTokenRecord = new RefreshToken
        {
            Id = Guid.CreateVersion7(),
            UserId = user.Id,
            TokenHash = newTokenHash,
            ExpiresAt = newExpiresAt,
            RevokedAt = null
        };

        _context.RefreshTokens.Add(newRefreshTokenRecord);
        await _context.SaveChangesAsync(ct);

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRawRefreshToken,
            TokenType = "Bearer",
            ExpiresIn = 7200,
            User = MapToDto(user, roles, permissions)
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role!)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission!)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            throw new NotFoundException("Người dùng", userId);
        }

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role!.Code)
            .Distinct()
            .ToList();

        var permissions = user.UserRoles
            .Where(ur => ur.Role != null)
            .SelectMany(ur => ur.Role!.RolePermissions)
            .Where(rp => rp.Permission != null)
            .Select(rp => rp.Permission!.Code)
            .Distinct()
            .ToList();

        return MapToDto(user, roles, permissions);
    }

    public async Task<IReadOnlyList<UserDto>> GetUsersAsync(CancellationToken ct = default)
    {
        var users = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role!)
            .OrderBy(u => u.Username)
            .ToListAsync(ct);

        return users.Select(u =>
        {
            var roles = u.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role!.Code).ToList();
            return MapToDto(u, roles, []);
        }).ToList();
    }

    public async Task<IReadOnlyList<RoleDto>> GetRolesAsync(CancellationToken ct = default)
    {
        var roles = await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission!)
            .OrderBy(r => r.Code)
            .ToListAsync(ct);

        return roles.Select(r => new RoleDto
        {
            Id = r.Id,
            Code = r.Code,
            Name = r.Name,
            Permissions = r.RolePermissions.Where(rp => rp.Permission != null).Select(rp => rp.Permission!.Code).ToList()
        }).ToList();
    }

    private static UserDto MapToDto(User user, IReadOnlyList<string> roles, IReadOnlyList<string> permissions)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            LastLoginAt = user.LastLoginAt,
            Department = user.Department == null ? null : new DepartmentDto
            {
                Id = user.Department.Id,
                Code = user.Department.Code,
                Name = user.Department.Name
            },
            Roles = roles,
            Permissions = permissions
        };
    }
}
