using ChatApp.Application.Features.CreateConversationGroupFromExternalSystem;
using ChatApp.Application.Features.SyncUsersFromExternalSystem;
using ChatApp.Contracts;
using ChatApp.Infrastructure.Services.Authorization;
using ChatApp.Infrastructure.Services.User;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExternalSystemController(IMediator mediator, ICurrentUserService currentUserService) : ControllerBase
{
    [Authorize(AuthenticationSchemes = ClientCredentialsAuthenticationOptions.DefaultScheme,
        Policy = Scopes.Users.Write)]
    [HttpPost("sync-from-external")]
    public async Task<IActionResult> SyncUsersFromExternalSystem([FromBody] SyncUsersFromExternalSystemCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }

    [Authorize(AuthenticationSchemes = ClientCredentialsAuthenticationOptions.DefaultScheme,
        Policy = Scopes.ExternalConversation.Write)]
    [HttpPost("create-conversation-group")]
    public async Task<IActionResult> CreateConversationGroupFromExternalSystem(
        [FromBody] CreateConversationGroupFromExternalSystemCommand command)
    {
        command.ClientId = currentUserService.GetClientId();
        var result = await mediator.Send(command);
        if (!result)
        {
            return BadRequest("One or more usernames do not exist.");
        }

        return Ok(result);
    }
}