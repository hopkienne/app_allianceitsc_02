using MediatR;

namespace ChatApp.Application.Features.CreateConversationGroup;

public class CreateConversationGroupCommand : IRequest<CreateConversationGroupResponse>
{
    public string GroupName { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public string CreatedByDisplayName { get; set; } = "";
    public List<Guid> MemberIds { get; set; } = [];
}