using MediatR;

namespace ChatApp.Application.Features.GetMembersByConversationGroup;

public class GetMembersByConversationGroupCommand(Guid conversationId) : IRequest<List<GetMembersByConversationGroupResponse>>
{
    public Guid ConversationId { get; set; } = conversationId;
}