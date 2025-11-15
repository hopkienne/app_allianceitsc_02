using ChatApp.Application.Abstractions;
using ChatApp.Application.Features.CreateConversationGroup;
using ChatApp.Domain.Enum;
using MediatR;

namespace ChatApp.Application.Features.CreateConversationGroupFromExternalSystem;

public class
    CreateConversationGroupFromExternalSystemCommandHandler(IUsersRepository usersRepository, IMediator mediator) : IRequestHandler<
    CreateConversationGroupFromExternalSystemCommand, bool>
{
    public async Task<bool> Handle(CreateConversationGroupFromExternalSystemCommand request,
        CancellationToken cancellationToken)
    {
        var userNamesExist = await usersRepository.GetListUserByConditionAsync(
            u => u,
            u => request.UserNames.Contains(u.UserName),
            cancellationToken);
        if (userNamesExist.Count != request.UserNames.Count)
            return false;

        var command = new CreateConversationGroupCommand
        {
            ConversationType = ConversationType.EXTERNAL_GROUP,
            CreatedByDisplayName = "External System",
            CreatedByUserId = Contracts.Utils.System.SystemId,
            IsExternal = true,
            GroupName = request.Name,
            MemberIds = userNamesExist
                .Select(u => u.Id)
                .ToList()
        };
        
        var result = await mediator.Send(command, cancellationToken);
        return true;
    }
}