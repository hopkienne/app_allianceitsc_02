using Microsoft.AspNetCore.Authorization;

namespace ChatApp.Infrastructure.Services.Authorization;

public class HasScopeRequirement(string scope) : IAuthorizationRequirement
{
    public string Scope { get; } = scope ?? throw new ArgumentNullException(nameof(scope));
}