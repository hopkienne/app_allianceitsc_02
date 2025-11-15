using ChatApp.Application.Abstractions;
using ChatApp.Application.Abstractions.Services;
using ChatApp.Application.Exceptions;
using ChatApp.Domain.Enum;
using MediatR;

namespace ChatApp.Application.Features.CreateConversationGroup;

public class CreateConversationGroupCommandHandler(
    IConversationRepository conversationRepository,
    IUsersRepository usersRepository,
    IChatNotificationService chatNotificationService)
    : IRequestHandler<CreateConversationGroupCommand, CreateConversationGroupResponse>
{
    public async Task<CreateConversationGroupResponse> Handle(CreateConversationGroupCommand request,
        CancellationToken cancellationToken)
    {
        // Validate all users exist (including creator)
        var listUserCheck = new List<Guid>(request.MemberIds);
        if (!request.IsExternal)
        {
            listUserCheck.Add(request.CreatedByUserId);
        }
        
        var isUsersNotExist = await usersRepository
            .CheckUsersExistsByIdAsync(listUserCheck, cancellationToken);
        if (isUsersNotExist.Count < listUserCheck.Count)
        {
            throw new NotFoundException("One or more users do not exist.");
        }

        // Create conversation group
        var conversationGroup =
            new Domain.Entities.Conversations(request.ConversationType, request.GroupName, listUserCheck,
                request.CreatedByUserId, request.CreatedByDisplayName);

        var conversationGroupId = await conversationRepository
            .CreateConversationAsync(conversationGroup, cancellationToken);

        // Notify all members about the new group via SignalR
        await chatNotificationService.NotifyGroupCreatedAsync(
            conversationGroupId,
            request.GroupName,
            request.CreatedByUserId,
            listUserCheck,
            cancellationToken);

        // Return the response
        return new CreateConversationGroupResponse
        {
            ConversationId = conversationGroupId,
            GroupName = request.GroupName,
            CreatedByUserId = request.CreatedByUserId,
            MemberIds = listUserCheck,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}