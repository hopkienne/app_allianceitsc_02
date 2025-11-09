using ChatApp.Application.Features.AddMembersToConversation;
using ChatApp.Application.Features.CreateConversationGroup;
using ChatApp.Application.Features.DeleteConversation;
using ChatApp.Application.Features.GetConversationByUser;
using ChatApp.Application.Features.GetConversationExist;
using ChatApp.Application.Features.GetMembersByConversationGroup;
using ChatApp.Application.Features.GetMessageOfConversation;
using ChatApp.Application.Features.LeaveConversationGroup;
using ChatApp.Domain.Common;
using ChatApp.Infrastructure.Services.User;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Action = ChatApp.Domain.Enum.Action;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConversationsController(IMediator mediator, ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("by-user/{userId}")]
    public async Task<IActionResult> GetConversationsByUser(Guid userId, CancellationToken cancellationToken)
    {
        var query = new GetConversationByUserQuery(userId);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("exists")]
    public async Task<IActionResult> CheckConversationExists([FromBody] GetConversationExistQuery query,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(query, cancellationToken);
        if (result == Guid.Empty)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpGet("{conversationId}/messages")]
    public async Task<IActionResult> GetMessagesOfConversation(Guid conversationId,
        [FromQuery] PagingRequest pagingRequest, CancellationToken cancellationToken = default)
    {
        var query = new GetMessageOfConversationQuery(conversationId, currentUserService.GetCurrentUserId(),
            pagingRequest);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{conversationId}")]
    public async Task<IActionResult> DeleteConversation(Guid conversationId, CancellationToken cancellationToken)
    {
        var command = new DeleteConversationCommand(conversationId, currentUserService.GetCurrentUserId());
        var result = await mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    #region Conversation Groups

    [HttpPost("groups")]
    public async Task<IActionResult> CreateConversationGroup([FromBody] CreateConversationGroupCommand command,
        CancellationToken cancellationToken)
    {
        command.CreatedByUserId = currentUserService.GetCurrentUserId();
        command.CreatedByDisplayName = currentUserService.GetCurrentDisplayName();
        var result = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetConversationsByUser),
            new { userId = command.CreatedByUserId },
            result);
    }
    
    [HttpPost("{conversationId}/members")]
    public async Task<IActionResult> AddMembersToConversationGroup(Guid conversationId, [FromBody] List<Guid> memberIds,
        CancellationToken cancellationToken)
    {
        var command = new AddMembersToConversationCommand(conversationId,
            currentUserService.GetCurrentUserId(), currentUserService.GetCurrentDisplayName(), memberIds);
        var result = await mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        
        return Ok(result);
    }

    [HttpPost("{conversationId}/leave")]
    public async Task<IActionResult> LeaveConversationGroup(Guid conversationId, CancellationToken cancellationToken)
    {
        var command = new LeaveConversationGroupCommand(conversationId, currentUserService.GetCurrentUserId(),
            currentUserService.GetCurrentDisplayName());
        var result = await mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{conversationId}/kick/{memberId}")]
    public async Task<IActionResult> KickMemberFromConversationGroup(Guid conversationId, Guid memberId, [FromBody] string displayName,
        CancellationToken cancellationToken)
    {
        var command = new LeaveConversationGroupCommand(conversationId, memberId, displayName, Action.KICK,
            currentUserService.GetCurrentUserId(), currentUserService.GetCurrentDisplayName());
        var result = await mediator.Send(command, cancellationToken);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
    
    [HttpGet("{conversationId}/members")]
    public async Task<IActionResult> GetMembersByConversationGroup(Guid conversationId, CancellationToken cancellationToken)
    {
        var query = new GetMembersByConversationGroupCommand(conversationId);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    #endregion
}