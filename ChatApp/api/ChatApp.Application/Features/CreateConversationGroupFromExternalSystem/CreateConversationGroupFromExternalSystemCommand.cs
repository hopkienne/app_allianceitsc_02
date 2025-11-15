using System.ComponentModel.DataAnnotations.Schema;
using MediatR;

namespace ChatApp.Application.Features.CreateConversationGroupFromExternalSystem;

public class CreateConversationGroupFromExternalSystemCommand : IRequest<bool>
{
    public string Name { get; set; } = null!;
    [NotMapped]
    public Guid ClientId { get; set; }
    public List<string> UserNames { get; set; } = [];
}