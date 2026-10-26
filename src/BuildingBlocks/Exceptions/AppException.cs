using System.Net;

namespace Qtkd.BuildingBlocks.Exceptions;

public abstract class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string Title { get; }

    protected AppException(string message, HttpStatusCode statusCode = HttpStatusCode.InternalServerError, string? title = null)
        : base(message)
    {
        StatusCode = statusCode;
        Title = title ?? "Lỗi hệ thống";
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string resourceName, object key)
        : base($"Không tìm thấy {resourceName} với mã định danh '{key}'.", HttpStatusCode.NotFound, "Không tìm thấy dữ liệu")
    {
    }

    public NotFoundException(string message)
        : base(message, HttpStatusCode.NotFound, "Không tìm thấy dữ liệu")
    {
    }
}

public class ConflictException : AppException
{
    public ConflictException(string message)
        : base(message, HttpStatusCode.Conflict, "Xung đột dữ liệu / Concurrency Conflict")
    {
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này trên hồ sơ hiện tại.")
        : base(message, HttpStatusCode.Forbidden, "Truy cập bị từ chối")
    {
    }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.")
        : base(message, HttpStatusCode.Unauthorized, "Chưa xác thực")
    {
    }
}

public class ValidationAppException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationAppException(IDictionary<string, string[]> errors, string message = "Dữ liệu yêu cầu không hợp lệ.")
        : base(message, HttpStatusCode.BadRequest, "Dữ liệu không hợp lệ")
    {
        Errors = errors;
    }

    public ValidationAppException(string field, string error)
        : base(error, HttpStatusCode.BadRequest, "Dữ liệu không hợp lệ")
    {
        Errors = new Dictionary<string, string[]>
        {
            { field, new[] { error } }
        };
    }
}
