namespace ChatApp.Domain.Entities;

public class ConversationMembers
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? HistoryClearedAt { get; set; }
    public Guid? AddedByUserId { get; set; }
    public string? AddedByUserName { get; set; }
    public Conversations Conversation { get; set; } = default!;
    public Users User { get; set; } = default!;

    public ConversationMembers()
    {
        JoinedAt = DateTimeOffset.UtcNow;
    }
}