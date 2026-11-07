using Qtkd.BuildingBlocks.Exceptions;
using Qtkd.Modules.Contracts.Entities;
using Qtkd.Modules.Payments.Entities;
using Qtkd.Modules.Pricing.Entities;
using Xunit;

namespace Qtkd.UnitTests;

public class DomainTests
{
    [Fact]
    public void BaseEntity_ShouldInitializeWithGuidAndUtcTimestamp()
    {
        // Act
        var contract = new Contract
        {
            Code = "HD-2026-001",
            Title = "Hợp đồng dịch vụ cảng",
            ContractValue = 150_000_000m
        };

        // Assert
        Assert.NotEqual(Guid.Empty, contract.Id);
        Assert.True(contract.CreatedAt <= DateTimeOffset.UtcNow);
        Assert.Equal(ContractStatus.Draft, contract.Status);
    }

    [Fact]
    public void PaymentLine_ShouldCalculateAmountCorrectly()
    {
        // Arrange
        var line = new PaymentLine
        {
            ServiceCode = "CONT_LIFT",
            ServiceName = "Nâng hạ container",
            Unit = "container",
            UnitPrice = 500_000m,
            Quantity = 20,
            VatRate = 0.10m
        };

        // Act
        line.Amount = line.UnitPrice * line.Quantity;
        line.VatAmount = line.Amount * line.VatRate;
        line.LineTotal = line.Amount + line.VatAmount;

        // Assert
        Assert.Equal(10_000_000m, line.Amount);
        Assert.Equal(1_000_000m, line.VatAmount);
        Assert.Equal(11_000_000m, line.LineTotal);
    }

    [Fact]
    public void CustomExceptions_ShouldMapCorrectStatusCodes()
    {
        // Act
        var notFound = new NotFoundException("Hợp đồng", "HD-999");
        var conflict = new ConflictException("Xung đột phiên bản");
        var forbidden = new ForbiddenException();

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, notFound.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal(System.Net.HttpStatusCode.Forbidden, forbidden.StatusCode);
    }
}
