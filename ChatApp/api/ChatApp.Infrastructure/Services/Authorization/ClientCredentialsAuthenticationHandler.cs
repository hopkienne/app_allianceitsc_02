using System.Security.Claims;
using System.Text.Encodings.Web;
using ChatApp.Contracts.Settings;
using ChatApp.Contracts.Utils;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ChatApp.Infrastructure.Services.Authorization;

public class ClientCredentialsAuthenticationOptions : AuthenticationSchemeOptions
{
    public const string DefaultScheme = "ClientCredentials";
    public string ClientIdHeader { get; set; } = "X-Client-Id";
    public string ClientSecretHeader { get; set; } = "X-Client-Secret";
}

public class ClientCredentialsAuthenticationHandler : AuthenticationHandler<ClientCredentialsAuthenticationOptions>
{
    private readonly ChatDbContext _dbContext;
    private readonly HashingSettings _hashingSettings;

    public ClientCredentialsAuthenticationHandler(
        IOptionsMonitor<ClientCredentialsAuthenticationOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ChatDbContext dbContext,
        IOptions<HashingSettings> hashingSettings)
        : base(options, logger, encoder)
    {
        _dbContext = dbContext;
        _hashingSettings = hashingSettings.Value;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Extract client_id and client_secret from headers
        if (!Request.Headers.TryGetValue(Options.ClientIdHeader, out var clientIdValues))
        {
            return AuthenticateResult.Fail($"Missing {Options.ClientIdHeader} header");
        }

        if (!Request.Headers.TryGetValue(Options.ClientSecretHeader, out var clientSecretValues))
        {
            return AuthenticateResult.Fail($"Missing {Options.ClientSecretHeader} header");
        }

        var clientId = clientIdValues.FirstOrDefault();
        var clientSecret = clientSecretValues.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return AuthenticateResult.Fail("Invalid client credentials");
        }

        // Find the client in the database
        var client = await _dbContext.OAuthClients
            .Include(c => c.Secrets)
            .FirstOrDefaultAsync(c => c.ClientId == clientId && c.IsActive);

        if (client == null)
        {
            return AuthenticateResult.Fail("Invalid client_id");
        }

        // Verify the client_secret against stored secrets
        var validSecret = client.Secrets
            .Where(s => s.IsActive)
            .Where(s => s.NotBefore == null || s.NotBefore <= DateTimeOffset.UtcNow)
            .Where(s => s.ExpiresAt == null || s.ExpiresAt > DateTimeOffset.UtcNow)
            .Any(s => VerifySecret(clientSecret, s.SecretHash, s.Salt, s.Iterations));

        if (!validSecret)
        {
            return AuthenticateResult.Fail("Invalid client_secret");
        }

        // Update last used timestamp
        client.LastUsedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Create claims for the authenticated client
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, client.Id.ToString()),
            new("client_id", client.ClientId),
            new("client_name", client.ClientName),
        };

        // Add scope claims
        foreach (var scope in client.Scopes)
        {
            claims.Add(new Claim("scope", scope));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }

    private bool VerifySecret(string providedSecret, string storedHash, byte[]? salt, int? iterations)
    {
        try
        {
            // Verify using Argon2id
            return Hashing.VerifyArgon2IdHash(providedSecret, storedHash);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error verifying client secret");
            return false;
        }
    }
}
