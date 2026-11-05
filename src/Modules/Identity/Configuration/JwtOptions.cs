namespace Qtkd.Modules.Identity.Configuration;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; set; } = "QtkdAbcLogisticsSuperSecretKey2026ForModularMonolithMustBeAtLeast32Bytes!";
    public string Issuer { get; set; } = "QtkdSolution";
    public string Audience { get; set; } = "QtkdApp";
    public int ExpiryMinutes { get; set; } = 120;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}

