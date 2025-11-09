using ChatApp.Application.Abstractions;
using ChatApp.Application.Exceptions;
using ChatApp.Application.Features.AddMembersToConversation;
using ChatApp.Application.Features.GetMembersByConversationGroup;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence;

public class ConversationMembersRepository(ChatDbContext context) : IConversationMembersRepository
{
    public async Task<bool> UpdateHistoryClearedAtAsync(Guid conversationId, Guid userId,
        CancellationToken cancellationToken)
    {
        var conversationMember = await context.ConversationMembers
            .FirstOrDefaultAsync(cm => cm.ConversationId == conversationId && cm.UserId == userId, cancellationToken);

        if (conversationMember == null)
            throw new NotFoundException("Conversation member not found.");

        conversationMember.HistoryClearedAt = DateTimeOffset.UtcNow;
        context.ConversationMembers.Update(conversationMember);
        return await context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<bool> DeleteMemberToConversation(Guid conversationId, Guid memberId,
        CancellationToken cancellationToken)
    {
        var memberToDelete = await context.ConversationMembers
            .FirstOrDefaultAsync(cm => cm.ConversationId == conversationId && cm.UserId == memberId, cancellationToken);

        if (memberToDelete is null)
        {
            throw new NotFoundException("Member not found.");
        }

        context.ConversationMembers.Remove(memberToDelete);
        return await context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<(bool addSuccess, List<Guid> oldMembers)> AddMembersToConversation(Guid conversationId,
        Guid addByUserId, string addByDisplayName,
        List<Guid> memberIds, CancellationToken cancellationToken)
    {
        var oldMembers = await context.ConversationMembers
            .Where(cm => cm.ConversationId == conversationId && cm.IsActive)
            .Select(cm => cm.UserId)
            .ToListAsync(cancellationToken);

        var existingMemberIds = oldMembers.Any(memberIds.Contains);

        if (existingMemberIds)
            throw new ExistException("Some members are already in the conversation.");

        var newMembers = memberIds.Select(m => new ConversationMembers
        {
            ConversationId = conversationId,
            UserId = m,
            IsActive = true,
            JoinedAt = DateTimeOffset.UtcNow,
            AddedByUserId = addByUserId,
            AddedByUserName = addByDisplayName
        });

        await context.ConversationMembers.AddRangeAsync(newMembers, cancellationToken);
        var addSuccess = await context.SaveChangesAsync(cancellationToken) > 0;

        return (addSuccess, oldMembers);
    }

    public async Task<List<GetMembersByConversationGroupResponse>> GetMembersByConversationGroupAsync(
        Guid conversationId,
        Guid createdUserId, CancellationToken cancellationToken)
    {
        var data = await context.ConversationMembers.Where(cm => cm.ConversationId == conversationId && cm.IsActive)
            .Select(cm => new GetMembersByConversationGroupResponse
            {
                Id = cm.UserId,
                DisplayName = cm.User.DisplayName,
                JoinedAt = cm.JoinedAt,
                AddedByUserId = cm.AddedByUserId,
                AddByDisplayName = cm.AddedByUserName,
                IsOwner = cm.UserId == createdUserId
            }).ToListAsync(cancellationToken);

        return data;
    }
}