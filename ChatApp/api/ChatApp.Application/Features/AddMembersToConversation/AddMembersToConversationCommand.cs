using MediatR;

namespace ChatApp.Application.Features.AddMembersToConversation;

public class AddMembersToConversationCommand(
    Guid conversationId,
    Guid addByUserId,
    string addByDisplayName,
    List<Guid> memberIds) : IRequest<bool>
{
    public Guid ConversationId { get; set; } = conversationId;
    public Guid AddedByUserId { get; set; } = addByUserId;
    public string AddedByDisplayName { get; set; } = addByDisplayName;
    public List<Guid> MemberIds { get; set; } = memberIds;
}