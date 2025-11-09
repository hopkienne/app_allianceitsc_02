using ChatApp.Application.Features.GetMembersByConversationGroup;

namespace ChatApp.Application.Abstractions;

public interface IConversationMembersRepository
{
    Task<bool> UpdateHistoryClearedAtAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken);
    Task<bool> DeleteMemberToConversation(Guid conversationId, Guid memberId, CancellationToken cancellationToken);

    Task<(bool addSuccess, List<Guid> oldMembers)> AddMembersToConversation(Guid conversationId, Guid addByUserId, string addByDisplayName, List<Guid> memberIds,
        CancellationToken cancellationToken);

    Task<List<GetMembersByConversationGroupResponse>> GetMembersByConversationGroupAsync(Guid conversationId, Guid createdUserId,
        CancellationToken cancellationToken);
}