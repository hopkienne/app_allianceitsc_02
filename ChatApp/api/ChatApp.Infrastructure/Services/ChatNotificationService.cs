using ChatApp.Application.Abstractions.Services;
using ChatApp.Application.Features.AddMembersToConversation;
using ChatApp.Domain.Enum;
using ChatApp.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Action = ChatApp.Domain.Enum.Action;

namespace ChatApp.Infrastructure.Services;

/// <summary>
/// Implementation of chat notification service using SignalR
/// </summary>
public class ChatNotificationService(IHubContext<ChatHub> hubContext) : IChatNotificationService
{
    public async Task NotifyGroupCreatedAsync(
        Guid conversationId,
        string groupName,
        Guid createdByUserId,
        IReadOnlyCollection<Guid> memberIds,
        CancellationToken cancellationToken = default)
    {
        // Prepare the notification payload
        var notification = new
        {
            ConversationId = conversationId,
            GroupName = groupName,
            CreatedByUserId = createdByUserId,
            MemberIds = memberIds,
            Type = ConversationType.GROUP,
            CreatedAt = DateTimeOffset.UtcNow
        };

        // Send notification to each member's personal group
        foreach (var memberId in memberIds)
        {
            await hubContext.Clients
                .Group($"User::{memberId}")
                .SendAsync("GroupCreated", notification, cancellationToken);
        }
    }

    public async Task NotifyAddMembersToGroupAsync(Guid conversationId, string groupName, Guid addedByUserId,
        string addedByDisplayName,
        IReadOnlyCollection<Guid> oldMemberIds,
        IReadOnlyCollection<NewMemberInfo> newMembers, CancellationToken cancellationToken = default)
    {
        var notificationTasks = new List<Task>();
        var notificationForOldMember = new
        {
            ConversationId = conversationId,
            GroupName = groupName,
            AddedByUserId = addedByUserId,
            AddedByDisplayName = addedByDisplayName,
            NewMembers = newMembers,
            Type = ConversationType.GROUP,
            AddAt = DateTimeOffset.UtcNow
        };

        // notify to conversation for all old members
        notificationTasks.Add(hubContext.Clients.Group(conversationId.ToString()).SendAsync("MembersAddedToGroup",
            notificationForOldMember, cancellationToken));

        var notificationForNewMembers = new
        {
            ConversationId = conversationId,
            GroupName = groupName,
            AddedByUserId = addedByUserId,
            AddedByDisplayName = addedByDisplayName,
            Type = ConversationType.GROUP,
            AddAt = DateTimeOffset.UtcNow
        };

        // Notify new members that they have been added to the group
        foreach (var newMember in newMembers)
        {
            var task = hubContext.Clients
                .Group($"User::{newMember.MemberId}")
                .SendAsync("AddedToGroup", notificationForNewMembers, cancellationToken);
            notificationTasks.Add(task);
        }

        await Task.WhenAll(notificationTasks);
    }

    public async Task NotifyMemberLeaveGroupAsync(Guid conversationId, string groupName,
        Action action, Guid? kickedByUserId, string? kickByDisplayName, Guid memberId, string displayName,
        CancellationToken cancellationToken = default)
    {
        if (action == Action.KICK)
        {
            await hubContext.Clients
                .Group($"User::{memberId}") 
                .SendAsync("KickedFromGroup", new
                {
                    ConversationId = conversationId,
                    Message = $"You have been removed from the group {groupName} by {kickByDisplayName}.",
                }, cancellationToken);

            var kickNotification = new
            {
                ConversationId = conversationId,
                ConversationName = groupName,
                MemberId = memberId, 
                DisplayName = displayName, 
                KickedByDisplayName = kickByDisplayName,
                Message = $"{displayName} has been deleted by {kickByDisplayName}.",
            };
        
            // Gửi đến group của cuộc trò chuyện
            await hubContext.Clients.Groups(conversationId.ToString())
                .SendAsync("MemberKicked", kickNotification, cancellationToken);
        }
        else
        {
            var notification = new
            {
                ConversationId = conversationId,
                ConversationName = groupName,
                MemberId = memberId, // Nên gửi cả ID
                DisplayName = displayName,
                Message = $"{displayName} has left the group {groupName}.",
            };
        
            await hubContext.Clients.Groups(conversationId.ToString())
                .SendAsync("GroupLeave", notification, cancellationToken);
        }
    }
}