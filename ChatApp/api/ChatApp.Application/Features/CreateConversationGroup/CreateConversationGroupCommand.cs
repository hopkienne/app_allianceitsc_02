using ChatApp.Domain.Enum;
using MediatR;

namespace ChatApp.Application.Features.CreateConversationGroup;

public class CreateConversationGroupCommand : IRequest<CreateConversationGroupResponse>
{
    public string GroupName { get; set; } = null!;
    public ConversationType ConversationType { get; set; } = ConversationType.GROUP;
    public Guid CreatedByUserId { get; set; }
    public string CreatedByDisplayName { get; set; } = "";
    public List<Guid> MemberIds { get; set; } = [];
    public bool IsExternal { get; set; } = false;
}