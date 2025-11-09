namespace ChatApp.Application.Features.AddMembersToConversation;

public class AddMembersToConversationResponse
{
    public Guid ConversationId { get; set; }
    public string ConversationName { get; set; } = null!;
}

public class NewMemberInfo
{
    public Guid MemberId { get; set; }
    public string DisplayName { get; set; } = null!;
}