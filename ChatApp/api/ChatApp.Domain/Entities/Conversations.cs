using ChatApp.Contracts.Utils;
using ChatApp.Domain.Enum;

namespace ChatApp.Domain.Entities;

public class Conversations
{
    public Guid Id { get; set; }
    public ConversationType Type { get; set; }
    public string? Name { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Users CreatedByUser { get; set; }
    public ConversationMetadata? ConversationMetadata { get; set; }
    public ICollection<ConversationMembers> Members { get; set; } = new List<ConversationMembers>();
    public ICollection<Messages> Messages { get; set; } = new List<Messages>();
    
    public Conversations()
    {
        Id = Guid.CreateVersion7();
        CreatedAt = DateTimeOffset.UtcNow;
    }
    
    public Conversations(ConversationType type, string? name, List<Guid> memberIds, Guid createdByUserId, string createdByDisplayName) : this()
    {
        Type = type;
        Name = name;
        CreatedByUserId = createdByUserId;
        Members = memberIds.Select(i => new ConversationMembers
        {
            UserId = i,
            AddedByUserId = createdByUserId,
            AddedByUserName = createdByDisplayName
        }).ToList();

    }
}