using MediatR;

namespace ChatApp.Application.Features.CreateClient;

public sealed class CreateClientCommand(string name, string[] scopes,DateTimeOffset? expiresAt)
    : IRequest<CreateClientResponse>
{
    public string Name { get; set; } = name;
    public string[] Scopes { get; set; } = scopes;
    public DateTimeOffset ? ExpiresAt { get; set; } = expiresAt;
}

public class CreateClientResponse
{
    public Guid Id { get; set; }  // The database primary key
    public string ClientId { get; set; } = default!;  // The client_id to use in X-Client-Id header
    public string ClientSecret { get; set; } = default!;  // The plain-text secret to use in X-Client-Secret header
}