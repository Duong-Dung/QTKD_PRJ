using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qtkd.Api.Persistence;
using Qtkd.Modules.Contracts.Entities;

namespace Qtkd.Api.Controllers;

/// <summary>
/// TASK-28: Store attachment bytes outside webroot; store metadata in contract_attachments.
/// Requires configured JWT authentication in the host (not yet present in snapshot TASK-13).
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/contracts/{contractId:guid}/attachments")]
[Tags("Contracts")]
public sealed class ContractAttachmentsController : ControllerBase
{
    private const long MaxFileBytes = 10 * 1024 * 1024;
    private readonly QtkdDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ContractAttachmentsController> _logger;

    public ContractAttachmentsController(QtkdDbContext db, IConfiguration configuration,
        ILogger<ContractAttachmentsController> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>Upload a PDF, JPEG or PNG file for a Draft/RevisionRequested contract owned by the caller.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxFileBytes + 1024 * 1024)]
    [ProducesResponseType(typeof(AttachmentResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Upload(Guid contractId, [FromForm] UploadContractAttachmentRequest request,
        CancellationToken cancellationToken)
    {
        // JWT claim convention must be confirmed with the Identity module before integration.
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdString, out var actorId))
            return Forbid();

        var contract = await _db.Contracts.AsNoTracking()
            .Where(x => x.Id == contractId)
            .Select(x => new { x.Id, x.Status, x.OwnerUserId })
            .FirstOrDefaultAsync(cancellationToken);
        if (contract is null) return NotFound(new { message = "Không tìm thấy hợp đồng." });
        if (contract.OwnerUserId != actorId) return Forbid();
        if (contract.Status is not (ContractStatus.Draft or ContractStatus.RevisionRequested))
            return Conflict(new { message = "Chỉ được đính kèm tệp khi hợp đồng ở Draft hoặc RevisionRequested (CTR-01)." });

        var file = request.File;
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Tệp không được để trống." });
        if (file.Length > MaxFileBytes)
            return StatusCode(StatusCodes.Status413PayloadTooLarge,
                new { message = "Tệp vượt quá 10 MiB." });

        // Never trust client-provided paths or extensions to decide the storage destination.
        var safeFileName = Path.GetFileName(file.FileName.Replace('\\', '/'));
        if (string.IsNullOrWhiteSpace(safeFileName) || safeFileName.Length > 255)
            return BadRequest(new { message = "Tên tệp không hợp lệ (tối đa 255 ký tự)." });
        var extension = Path.GetExtension(safeFileName).ToLowerInvariant();
        var expectedContentType = extension switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => null
        };
        if (expectedContentType is null)
            return BadRequest(new { message = "Chỉ hỗ trợ PDF, PNG, JPG/JPEG." });

        // Reject mismatched/unsupported bytes regardless of browser ContentType header.
        await using var input = file.OpenReadStream();
        var signature = new byte[8];
        var count = await input.ReadAsync(signature.AsMemory(), cancellationToken);
        var validSignature = extension switch
        {
            ".pdf" => count >= 5 && signature.AsSpan(0, 5).SequenceEqual("%PDF-"u8),
            ".png" => count >= 8 && signature.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            _ => count >= 3 && signature[0] == 0xFF && signature[1] == 0xD8 && signature[2] == 0xFF
        };
        if (!validSignature)
            return BadRequest(new { message = "Nội dung tệp không khớp với định dạng được hỗ trợ." });
        if (input.CanSeek) input.Position = 0;
        else return BadRequest(new { message = "Không thể đọc lại nội dung tệp." });

        if (request.IsMainDocument && await _db.ContractAttachments.AsNoTracking()
            .AnyAsync(x => x.ContractId == contractId && x.IsMainDocument, cancellationToken))
            return Conflict(new { message = "Hợp đồng đã có tệp chính. Cần thống nhất quy tắc thay thế tệp." });

        var root = _configuration["Attachments:StorageRoot"];
        if (string.IsNullOrWhiteSpace(root))
            return Problem("Chưa cấu hình Attachments:StorageRoot.", statusCode: 503);
        var absoluteRoot = Path.GetFullPath(root);
        var folder = Path.Combine(absoluteRoot, "contracts", contractId.ToString("N"));
        Directory.CreateDirectory(folder);
        var attachmentId = Guid.CreateVersion7();
        var storedName = attachmentId.ToString("N") + extension;
        var absolutePath = Path.Combine(folder, storedName);
        var relativePath = $"contracts/{contractId:N}/{storedName}";

        try
        {
            await using (var output = new FileStream(absolutePath, FileMode.CreateNew, FileAccess.Write,
                FileShare.None, 81920, FileOptions.Asynchronous))
            {
                await input.CopyToAsync(output, cancellationToken);
                await output.FlushAsync(cancellationToken);
            }

            string checksum;
            await using (var checksumInput = System.IO.File.OpenRead(absolutePath))
            {
                checksum = Convert.ToHexString(await SHA256.HashDataAsync(checksumInput, cancellationToken)).ToLowerInvariant();
            }

            var attachment = new ContractAttachment
            {
                Id = attachmentId, ContractId = contractId, AddendumId = null,
                FileName = safeFileName, ContentType = expectedContentType,
                SizeBytes = file.Length, StoragePath = relativePath,
                Checksum = checksum, IsMainDocument = request.IsMainDocument,
                CreatedBy = actorId
            };
            _db.ContractAttachments.Add(attachment);
            await _db.SaveChangesAsync(cancellationToken);
            return StatusCode(StatusCodes.Status201Created, ToResponse(attachment));
        }
        catch (DbUpdateException e)
        {
            DeleteQuietly(absolutePath);
            _logger.LogWarning(e, "Attachment metadata save failed for contract {ContractId}", contractId);
            return Conflict(new { message = "Không thể lưu metadata tệp (xung đột dữ liệu)." });
        }
        catch
        {
            DeleteQuietly(absolutePath);
            throw;
        }
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid contractId, CancellationToken cancellationToken)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdString, out var actorId)) return Forbid();
        var contract = await _db.Contracts.AsNoTracking()
            .Where(x => x.Id == contractId)
            .Select(x => new { x.OwnerUserId })
            .FirstOrDefaultAsync(cancellationToken);
        if (contract is null) return NotFound();
        if (contract.OwnerUserId != actorId) return Forbid();
        var files = await _db.ContractAttachments.AsNoTracking()
            .Where(x => x.ContractId == contractId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AttachmentResponse(x.Id, x.ContractId, x.FileName,
                x.ContentType, x.SizeBytes, x.Checksum, x.IsMainDocument, x.CreatedAt))
            .ToListAsync(cancellationToken);
        return Ok(files);
    }

    private static AttachmentResponse ToResponse(ContractAttachment item) =>
        new(item.Id, item.ContractId, item.FileName, item.ContentType,
            item.SizeBytes, item.Checksum, item.IsMainDocument, item.CreatedAt);

    private static void DeleteQuietly(string path)
    {
        try { if (System.IO.File.Exists(path)) System.IO.File.Delete(path); }
        catch (IOException) { /* Log or reconcile orphaned files operationally. */ }
        catch (UnauthorizedAccessException) { /* See operational reconciliation notes. */ }
    }
}

public sealed class UploadContractAttachmentRequest
{
    public IFormFile? File { get; set; }
    public bool IsMainDocument { get; set; }
}

public sealed record AttachmentResponse(Guid Id, Guid ContractId, string FileName,
    string ContentType, long SizeBytes, string? Checksum, bool IsMainDocument,
    DateTimeOffset CreatedAt);
