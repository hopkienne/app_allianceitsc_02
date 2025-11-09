using MediatR;
using Action = ChatApp.Domain.Enum.Action;

namespace ChatApp.Application.Features.LeaveConversationGroup;

public class LeaveConversationGroupCommand(Guid conversationId, Guid memberId, string? displayName) : IRequest<bool>
{
    public Guid ConversationId { get; set; } = conversationId;
    public Guid? KickedByMemberId { get; set; }
    public string? KickedByDisplayName { get; set; }
    public Guid MemberId { get; set; } = memberId;
    public string? DisplayName { get; set; } = displayName;
    public Action Action { get; set; } = Action.LEAVE;

    public LeaveConversationGroupCommand(Guid conversationId, Guid memberId, string? displayName, Action action, Guid? kickedByMemberId, string? kickedByDisplayName) : this(conversationId,
        memberId, displayName)
    {
        ConversationId = conversationId;
        MemberId = memberId;
        DisplayName = displayName;
        Action = action;
        KickedByMemberId = kickedByMemberId;
        KickedByDisplayName = kickedByDisplayName;
    }
}