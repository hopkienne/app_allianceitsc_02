using ChatApp.Application.Abstractions;
using ChatApp.Application.Exceptions;
using ChatApp.Domain.Common;
using MediatR;

namespace ChatApp.Application.Features.GetMessageOfConversation;

public class GetMessageOfConversationQueryHandler(
    IMessageRepository messageRepository,
    IConversationRepository conversationRepository)
    : IRequestHandler<GetMessageOfConversationQuery, PagingResponse<GetMessageOfConversationResponse>>
{
    public async Task<PagingResponse<GetMessageOfConversationResponse>> Handle(GetMessageOfConversationQuery request,
        CancellationToken cancellationToken)
    {
        var (isMember, historyClearedAt) = await conversationRepository.IsMemberInConversationAsync(
            request.ConversationId,
            request.UserId, cancellationToken);
        if (!isMember)
            throw new ForbiddenException("User is not a member of the conversation.");

        var (count, data) = await messageRepository.GetMessageOfConversationAsync(request.ConversationId,
            historyClearedAt, request.UserId,
            request.PagingRequest, cancellationToken);
        var res = new PagingResponse<GetMessageOfConversationResponse>(count, data);
        return res;
    }
}