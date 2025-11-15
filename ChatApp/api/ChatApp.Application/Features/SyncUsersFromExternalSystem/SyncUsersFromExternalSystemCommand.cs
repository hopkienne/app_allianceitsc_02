using ChatApp.Contracts.Users;
using MediatR;

namespace ChatApp.Application.Features.SyncUsersFromExternalSystem;

public class SyncUsersFromExternalSystemCommand : IRequest<bool>
{
    public List<SyncUsersFromExternalSystemRequest> Users { get; set; } = [];
}