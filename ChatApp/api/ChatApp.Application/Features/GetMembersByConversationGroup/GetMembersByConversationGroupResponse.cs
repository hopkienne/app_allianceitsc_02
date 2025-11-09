namespace ChatApp.Application.Features.GetMembersByConversationGroup;

public class GetMembersByConversationGroupResponse
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = null!;
    public DateTimeOffset JoinedAt { get; set; }
    public Guid? AddedByUserId { get; set; }
    public string? AddByDisplayName { get; set; }
    public bool IsOwner { get; set; }
}