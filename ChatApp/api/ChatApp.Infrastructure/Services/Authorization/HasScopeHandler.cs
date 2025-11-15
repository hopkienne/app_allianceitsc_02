using Microsoft.AspNetCore.Authorization;

namespace ChatApp.Infrastructure.Services.Authorization;

public class HasScopeHandler : AuthorizationHandler<HasScopeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        HasScopeRequirement requirement)
    {
        // Check if the user is authenticated
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            context.Fail();
            return Task.CompletedTask;
        }

        // Get all scope claims from the authenticated user
        var scopes = context.User.FindAll(c => c.Type == "scope")
            .Select(c => c.Value)
            .ToList();

        // Check if the required scope exists in the user's scopes
        if (scopes.Contains(requirement.Scope))
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }

        return Task.CompletedTask;
    }
}