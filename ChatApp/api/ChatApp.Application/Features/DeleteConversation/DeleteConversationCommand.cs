using MediatR;

namespace ChatApp.Application.Features.DeleteConversation;

public class DeleteConversationCommand(Guid conversationId, Guid currentUserId) : IRequest<bool>
{
    public Guid ConversationId { get; set; } = conversationId;
    public Guid CurrentUserId { get; set; } = currentUserId;
}