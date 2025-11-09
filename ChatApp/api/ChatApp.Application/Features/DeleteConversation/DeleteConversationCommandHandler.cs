using ChatApp.Application.Abstractions;
using ChatApp.Domain.Enum;
using MediatR;

namespace ChatApp.Application.Features.DeleteConversation;

public class DeleteConversationCommandHandler(IConversationRepository conversationRepository, IConversationMembersRepository conversationMemberRepository)
    : IRequestHandler<DeleteConversationCommand, bool>
{
    public async Task<bool> Handle(DeleteConversationCommand request, CancellationToken cancellationToken)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(request.ConversationId, cancellationToken);
        if (conversation is null)
            throw new Exception("Conversation not found");

        if (conversation.Type is ConversationType.GROUP or ConversationType.EXTERNAL_GROUP)
        {
            return await conversationMemberRepository.UpdateHistoryClearedAtAsync(request.ConversationId, request.CurrentUserId, cancellationToken);
        }
        
        return await conversationRepository.DeleteConversationAsync(conversation, cancellationToken);
    }
}