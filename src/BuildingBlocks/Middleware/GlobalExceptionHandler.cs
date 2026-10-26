using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Qtkd.BuildingBlocks.Exceptions;

namespace Qtkd.BuildingBlocks.Middleware;

/// <summary>
/// Bộ xử lý ngoại lệ toàn cục theo chuẩn RFC 7807 (ProblemDetails).
/// Bắt mọi exception trong pipeline, ghi log có cấu trúc qua Serilog và trả về định dạng chuẩn.
/// </summary>
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        var problemDetails = new ProblemDetails
        {
            Instance = httpContext.Request.Path,
            Extensions =
            {
                ["traceId"] = traceId,
                ["timestamp"] = DateTimeOffset.UtcNow
            }
        };

        switch (exception)
        {
            case ValidationAppException valEx:
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                problemDetails.Status = StatusCodes.Status400BadRequest;
                problemDetails.Title = valEx.Title;
                problemDetails.Detail = valEx.Message;
                problemDetails.Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1";
                problemDetails.Extensions["errors"] = valEx.Errors;
                _logger.LogWarning(exception, "Dữ liệu yêu cầu không hợp lệ tại {Path}. TraceId: {TraceId}", httpContext.Request.Path, traceId);
                break;

            case AppException appEx:
                httpContext.Response.StatusCode = (int)appEx.StatusCode;
                problemDetails.Status = (int)appEx.StatusCode;
                problemDetails.Title = appEx.Title;
                problemDetails.Detail = appEx.Message;
                problemDetails.Type = $"https://httpstatuses.com/{(int)appEx.StatusCode}";
                _logger.LogWarning(exception, "Lỗi nghiệp vụ [{StatusCode}] tại {Path}: {Message}. TraceId: {TraceId}", 
                    (int)appEx.StatusCode, httpContext.Request.Path, appEx.Message, traceId);
                break;

            case OperationCanceledException:
                httpContext.Response.StatusCode = StatusCodes.Status499ClientClosedRequest;
                problemDetails.Status = StatusCodes.Status499ClientClosedRequest;
                problemDetails.Title = "Yêu cầu bị hủy";
                problemDetails.Detail = "Thao tác đã bị hủy bởi phía người dùng hoặc hết thời gian chờ.";
                _logger.LogInformation("Request bị hủy bởi client tại {Path}. TraceId: {TraceId}", httpContext.Request.Path, traceId);
                break;

            default:
                httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
                problemDetails.Status = StatusCodes.Status500InternalServerError;
                problemDetails.Title = "Lỗi hệ thống máy chủ nội bộ";
                problemDetails.Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1";
                problemDetails.Detail = _environment.IsDevelopment()
                    ? $"{exception.Message} \n {exception.StackTrace}"
                    : "Đã xảy ra sự cố không mong muốn. Vui lòng liên hệ quản trị viên kèm mã TraceId để được hỗ trợ.";
                _logger.LogError(exception, "Lỗi chưa được xử lý tại {Path}. TraceId: {TraceId}", httpContext.Request.Path, traceId);
                break;
        }

        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: cancellationToken);

        return true;
    }
}
