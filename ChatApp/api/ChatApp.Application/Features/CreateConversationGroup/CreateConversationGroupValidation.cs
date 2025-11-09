using FluentValidation;

namespace ChatApp.Application.Features.CreateConversationGroup;

public class CreateConversationGroupValidation : AbstractValidator<CreateConversationGroupCommand>
{
    public CreateConversationGroupValidation()
    {
        RuleFor(x => x.GroupName)
            .NotEmpty().WithMessage("Group name is required.")
            .MaximumLength(100).WithMessage("Group name must not exceed 100 characters.");
        
        RuleFor(x => x.MemberIds)
            .NotNull().WithMessage("Member IDs cannot be null.")
            .Must(ids => ids.Count >= 2).WithMessage("At least two members are required to create a group.");
    }
}