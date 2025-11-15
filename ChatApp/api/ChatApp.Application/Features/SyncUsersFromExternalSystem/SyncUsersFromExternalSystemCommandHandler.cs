using ChatApp.Application.Abstractions;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.SyncUsersFromExternalSystem;

public class SyncUsersFromExternalSystemCommandHandler(IUsersRepository usersRepository)
    : IRequestHandler<SyncUsersFromExternalSystemCommand, bool>
{
    public async Task<bool> Handle(SyncUsersFromExternalSystemCommand request, CancellationToken cancellationToken)
    {
        //check user exists in db 
        var userNames = request.Users.Select(u => u.UserName);
        var existingUsers = await usersRepository.GetListUserByConditionAsync(
            u => u.UserName,
            u => userNames.Contains(u.UserName),
            cancellationToken);

        //remove existing users from the list
        var newUsersRequests = request.Users
            .Where(u => !existingUsers.Contains(u.UserName))
            .ToList();

        var newUsers = Users.MappingFromExternalSystem(newUsersRequests);
        return await usersRepository.AddRangeUserAsync(newUsers, cancellationToken);
    }
}