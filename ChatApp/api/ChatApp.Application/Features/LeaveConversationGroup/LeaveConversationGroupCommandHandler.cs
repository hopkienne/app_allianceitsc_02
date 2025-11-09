using ChatApp.Application.Abstractions;
using ChatApp.Application.Abstractions.Services;
using ChatApp.Application.Exceptions;
using ChatApp.Domain.Entities;
using MediatR;
using Action = ChatApp.Domain.Enum.Action;

namespace ChatApp.Application.Features.LeaveConversationGroup;

public class LeaveConversationGroupCommandHandler(
    IConversationMembersRepository conversationMembersRepository,
    IConversationRepository conversationRepository,
    IMessageRepository messageRepository,
    IChatNotificationService chatNotificationService)
    : IRequestHandler<LeaveConversationGroupCommand, bool>
{
    public async Task<bool> Handle(LeaveConversationGroupCommand request, CancellationToken cancellationToken)
    {
        var conversation =
            await conversationRepository.GetConversationByIdAsync(request.ConversationId, cancellationToken);
        if (conversation is null)
        {
            throw new NotFoundException("Conversation not found");
        }

        var isLeaved = await conversationMembersRepository.DeleteMemberToConversation(request.ConversationId,
            request.MemberId,
            cancellationToken);

        if (isLeaved)
        {
            var content = request.Action == Action.KICK
                ? $"{request.DisplayName} was removed from the group by {request.KickedByDisplayName}"
                : $"{request.DisplayName} has left the group";
            //create system message
            var systemMessage = Messages.CreateMessageSystem(request.ConversationId, content);
            await messageRepository.CreateMessageAsync(systemMessage, cancellationToken);

            //bump to conversation
            await chatNotificationService.NotifyMemberLeaveGroupAsync(request.ConversationId, conversation.Name!,
                request.Action, request.KickedByMemberId, request.KickedByDisplayName, request.MemberId,
                request.DisplayName!, cancellationToken);
        }

        return isLeaved;
    }
}