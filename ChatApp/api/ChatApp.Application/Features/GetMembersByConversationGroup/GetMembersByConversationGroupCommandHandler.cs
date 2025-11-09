using ChatApp.Application.Abstractions;
using ChatApp.Application.Exceptions;
using MediatR;

namespace ChatApp.Application.Features.GetMembersByConversationGroup;

public class GetMembersByConversationGroupCommandHandler(
    IConversationMembersRepository conversationMembersRepository,
    IConversationRepository conversationRepository,
    IUsersRepository usersRepository)
    : IRequestHandler<GetMembersByConversationGroupCommand, List<GetMembersByConversationGroupResponse>>
{
    public async Task<List<GetMembersByConversationGroupResponse>> Handle(GetMembersByConversationGroupCommand request,
        CancellationToken cancellationToken)
    {
        //check exist conversation
        var conversation =
            await conversationRepository.GetConversationByIdAsync(request.ConversationId, cancellationToken);
        if (conversation is null)
        {
            throw new NotFoundException("Conversation not found");
        }
        
        var res = await conversationMembersRepository
            .GetMembersByConversationGroupAsync(request.ConversationId, conversation.CreatedByUserId, cancellationToken);
        
        return res;
    }
}