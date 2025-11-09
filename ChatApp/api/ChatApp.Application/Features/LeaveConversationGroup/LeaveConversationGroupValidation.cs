using FluentValidation;

namespace ChatApp.Application.Features.LeaveConversationGroup;

public class LeaveConversationGroupValidation : AbstractValidator<LeaveConversationGroupCommand>
{
    public LeaveConversationGroupValidation()
    {
        RuleFor(x => x.ConversationId)
            .Must(x => x != Guid.Empty).WithMessage("ConversationId is required.");

        RuleFor(x => x.MemberId)
            .Must(x => x != Guid.Empty).WithMessage("MemberId is required.");
    }
}