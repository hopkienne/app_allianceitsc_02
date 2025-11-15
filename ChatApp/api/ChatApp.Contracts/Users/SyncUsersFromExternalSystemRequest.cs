namespace ChatApp.Contracts.Users;

public class SyncUsersFromExternalSystemRequest
{
    public string ApplicationCode { get; set; } = null!;
    public string ApplicationUserCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string Email { get; set; } = null!;
}