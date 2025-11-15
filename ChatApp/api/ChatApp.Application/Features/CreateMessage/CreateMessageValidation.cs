using FluentValidation;

namespace ChatApp.Application.Features.CreateMessage;

public class CreateMessageValidation : AbstractValidator<CreateMessageCommand>
{
    public CreateMessageValidation()
    {
        RuleFor(x => x.Content)
            .MaximumLength(4000)
            .WithMessage("Content must not exceed 4000 characters.");
    }
}