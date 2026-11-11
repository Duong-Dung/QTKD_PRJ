using Microsoft.OpenApi;
using Serilog;
using Qtkd.Api.Extensions;
using Qtkd.BuildingBlocks.Middleware;
using Qtkd.Modules.Identity.Extensions;
using Qtkd.Modules.Customers.Extensions;
using Qtkd.Modules.Contracts.Extensions;
using Qtkd.Modules.Pricing.Extensions;
using Qtkd.Modules.Production.Extensions;
using Qtkd.Modules.Payments.Extensions;
using Qtkd.Modules.Workflow.Extensions;
using Qtkd.Modules.Audit.Extensions;
using Qtkd.Modules.ESign.Extensions;
using Qtkd.Modules.Notification.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Serilog Logger có cấu trúc
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

try
{
    Log.Information("Đang khởi động QTKD ABC Logistics API (Modular Monolith)...");

    // 2. Global Exception Handler & ProblemDetails (RFC 7807)
    builder.Services.AddProblemDetails();
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

    // 3. Health Checks
    builder.Services.AddHealthChecks();

    // 4. Cấu hình Controllers
    builder.Services.AddControllers();

    // 5. Cấu hình CORS cho Frontend React/Vite
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });

    // 6. Cấu hình Swagger / OpenAPI với Swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "QTKD ABC Logistics API",
            Version = "v1",
            Description = "Hệ thống Quản trị Kinh doanh - Công ty Cổ phần ABC (Kiến trúc Modular Monolith)",
            Contact = new OpenApiContact
            {
                Name = "HCMUS QTKD Solution Team",
                Url = new Uri("https://github.com/Duong-Dung/QTKD_PRJ")
            }
        });

        var scheme = new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header sử dụng scheme Bearer. Ví dụ: 'Bearer {token}'",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        };
        options.AddSecurityDefinition("Bearer", scheme);

        options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecuritySchemeReference("Bearer"),
                new List<string>()
            }
        });
    });

    // 7. DbContext thống nhất Sprint 1 + các Module độc lập
    builder.Services.AddQtkdPersistence(builder.Configuration);
    builder.Services.AddIdentityModule(builder.Configuration);
    builder.Services.AddCustomersModule(builder.Configuration);
    builder.Services.AddContractsModule(builder.Configuration);
    builder.Services.AddPricingModule(builder.Configuration);
    builder.Services.AddProductionModule(builder.Configuration);
    builder.Services.AddPaymentsModule(builder.Configuration);
    builder.Services.AddWorkflowModule(builder.Configuration);
    builder.Services.AddAuditModule(builder.Configuration);
    builder.Services.AddESignModule(builder.Configuration);
    builder.Services.AddNotificationModule(builder.Configuration);

    var app = builder.Build();

    app.ApplyQtkdMigrations();
    await app.SeedQtkdDataAsync();

    // 8. Pipeline xử lý HTTP Requests
    app.UseSerilogRequestLogging();

    // Global Exception Handling trả về ProblemDetails
    app.UseExceptionHandler();
    app.UseStatusCodePages();

    // Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "QTKD API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "QTKD ABC API Documentation";
    });

    // Chuyển hướng root '/' sang '/swagger' để mở nhanh trên trình duyệt
    app.MapGet("/", () => Results.Redirect("/swagger"));

    app.UseRouting();
    app.UseCors("AllowAll");
    app.UseAuthentication();
    app.UseAuthorization();

    // Health check endpoint
    app.MapHealthChecks("/health");

    // Endpoint thông tin hệ thống tổng quát
    app.MapGet("/api/v1/system/status", () => Results.Ok(new
    {
        System = "QTKD ABC Logistics Solution",
        Architecture = "Modular Monolith",
        Modules = new[]
        {
            "Identity", "Customers", "Contracts", "Pricing",
            "Production", "Payments", "Workflow", "Audit", "ESign", "Notification"
        },
        Environment = app.Environment.EnvironmentName,
        Timestamp = DateTimeOffset.UtcNow,
        Status = "Operational"
    })).WithTags("System");

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Ứng dụng QTKD API gặp lỗi nghiêm trọng và bị dừng đột ngột!");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }

