using ChatApp.Application.Abstractions;
using ChatApp.Application.Abstractions.Services;
using ChatApp.Application.Exceptions;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.AddMembersToConversation;

public class AddMembersToConversationCommandHandler(
    IConversationMembersRepository conversationMembersRepository,
    IConversationRepository conversationRepository,
    IMessageRepository messageRepository,
    IUsersRepository usersRepository,
    IChatNotificationService chatNotificationService)
    : IRequestHandler<AddMembersToConversationCommand, bool>
{
    public async Task<bool> Handle(AddMembersToConversationCommand request, CancellationToken cancellationToken)
    {
        var conversationExists = await conversationRepository
            .GetConversationByIdAsync(request.ConversationId, cancellationToken);
        if (conversationExists is null)
        {
            throw new NotFoundException("Conversation not found.");
        }

        //check newMembers has user
        var memberInfo = await usersRepository.GetListUserByConditionAsync(x => new NewMemberInfo
        {
            MemberId = x.Id,
            DisplayName = x.DisplayName
        }, (x => x.IsActive && request.MemberIds.Contains(x.Id)), cancellationToken);

        if (memberInfo.Count < request.MemberIds.Count)
        {
            throw new Exception("Invalid members");
        }

        var (addSuccess, oldMembers) = await conversationMembersRepository.AddMembersToConversation(
            request.ConversationId, request.AddedByUserId, request.AddedByDisplayName,
            request.MemberIds,
            cancellationToken);

        if (addSuccess)
        {
            //create message system about new members added
            var content = $"{request.AddedByDisplayName} added " +
                                $"{string.Join(", ", memberInfo.Select(x => x.DisplayName))} to the group.";
            var newMessage = Messages.CreateMessageSystem(request.ConversationId, content);
            await messageRepository.CreateMessageAsync(newMessage, cancellationToken);
            
            //bump to conversation and new members
            await chatNotificationService.NotifyAddMembersToGroupAsync(
                request.ConversationId,
                conversationExists.Name!,
                request.AddedByUserId,
                request.AddedByDisplayName,
                oldMembers,
                memberInfo,
                cancellationToken);
        }

        return addSuccess;
    }
}