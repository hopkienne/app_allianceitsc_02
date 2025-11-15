using ChatApp.Application.Abstractions;
using ChatApp.Contracts.Settings;
using ChatApp.Contracts.Utils;
using ChatApp.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ChatApp.Application.Features.CreateClient;

public class CreateClientCommandHandler(
    ILogger<CreateClientCommandHandler> logger,
    IOAuthClientsRepository clientsRepository, IOptions<HashingSettings> hashingSettings)
    : IRequestHandler<CreateClientCommand, CreateClientResponse>
{
    private readonly HashingSettings _hashingSettings = hashingSettings.Value;
    
    public async Task<CreateClientResponse> Handle(CreateClientCommand request, CancellationToken cancellationToken)
    {
        var existClient = await clientsRepository.GetClientByNameAsync(request.Name, cancellationToken);
        if (existClient is not null)
        {
            throw new InvalidOperationException($"Client with name {request.Name} already exists.");
        }
        
        var client = new OAuthClients
        {
            Id = Guid.CreateVersion7(),
            ClientId = Guid.CreateVersion7().ToString(),
            ClientName = request.Name,
            Scopes = request.Scopes,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        
        // Generate a random plain-text secret (this will be returned to the user)
        var plainTextSecret = Guid.NewGuid().ToString("N"); // 32-character hex string
        
        var clientSecret = new OAuthClientSecrets
        {
            Id = Guid.CreateVersion7(),
            ClientId = client.Id,
            SecretHash = Hashing.Argon2IdHasherSecretKey(plainTextSecret), // Hash the plain-text secret
            CreatedAt = DateTimeOffset.UtcNow,
            NotBefore = DateTimeOffset.UtcNow,
            ExpiresAt = request.ExpiresAt,
            IsActive = true
        };

        client.Secrets = [clientSecret];
        
        var addedClient = await clientsRepository.AddClientAsync(client, cancellationToken);
        if (!addedClient)
        {
            logger.LogError("Failed to create client {ClientName}", request.Name);
            throw new Exception("Failed to create client.");
        }
        logger.LogInformation("Client {ClientName} created successfully with ClientId {ClientId}", 
            request.Name, client.ClientId);
        
        return new CreateClientResponse
        {
            Id = client.Id,  // Database primary key
            ClientId = client.ClientId,  // The client_id string for X-Client-Id header
            ClientSecret = plainTextSecret // Return the plain-text secret (NOT the hash)
        };
    }
}