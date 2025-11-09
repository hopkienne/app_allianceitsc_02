using ChatApp.Application.Features.AddMembersToConversation;
using Action = ChatApp.Domain.Enum.Action;

namespace ChatApp.Application.Abstractions.Services;

/// <summary>
/// Service for sending real-time chat notifications via SignalR
/// </summary>
public interface IChatNotificationService
{
    /// <summary>
    /// Notify users that a new group conversation has been created
    /// </summary>
    /// <param name="conversationId">The ID of the newly created conversation</param>
    /// <param name="groupName">The name of the group</param>
    /// <param name="createdByUserId">The user who created the group</param>
    /// <param name="memberIds">All member IDs including the creator</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task NotifyGroupCreatedAsync(
        Guid conversationId,
        string groupName,
        Guid createdByUserId,
        IReadOnlyCollection<Guid> memberIds,
        CancellationToken cancellationToken = default);
    
    Task NotifyAddMembersToGroupAsync(
        Guid conversationId,
        string groupName,
        Guid addedByUserId,
        string addedByDisplayName,
        IReadOnlyCollection<Guid> oldMemberIds,
        IReadOnlyCollection<NewMemberInfo> newMembers,
        CancellationToken cancellationToken = default);
    
    Task NotifyMemberLeaveGroupAsync(
        Guid conversationId,
        string groupName,
        Action action,
        Guid? kickedByUserId,
        string? kickedByDisplayName,
        Guid memberId,
        string displayName,
        CancellationToken cancellationToken = default);
}
