namespace ChatApp.Application.Features.CreateConversationGroup;

public sealed class CreateConversationGroupResponse
{
    public Guid ConversationId { get; set; }
    public string GroupName { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public List<Guid> MemberIds { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
}