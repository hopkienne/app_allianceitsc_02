using System.Linq.Expressions;
using ChatApp.Application.Abstractions;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence;

public class UsersRepository(ChatDbContext context) : IUsersRepository
{
    private readonly DbSet<Users> _users = context.Set<Users>();

    public async Task<List<T>> GetListUser<T>(Expression<Func<Users, T>> selector, CancellationToken cancellationToken)
    {
        return await _users.Select(selector).ToListAsync(cancellationToken);
    }

    public async Task<List<T>> GetListUserByConditionAsync<T>(Expression<Func<Users, T>> selector, Expression<Func<Users, bool>> predicate, CancellationToken cancellationToken)
    {
        return await _users.Where(predicate).Select(selector).ToListAsync(cancellationToken);
    }

    public async Task<Users?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _users.FirstOrDefaultAsync(u => u.Id == id && u.IsActive, cancellationToken);
    }

    public async Task<Users?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        return await _users.FirstOrDefaultAsync(u => u.UserName == username && u.IsActive, cancellationToken);
    }

    public async Task<string> GetDisplayNameByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await _users.FirstOrDefaultAsync(u => u.Id == id && u.IsActive, cancellationToken);
        return user is null ? throw new KeyNotFoundException($"User with id {id} not found") : user.DisplayName;
    }

    public async Task<List<string>> CheckUsersExistsByIdAsync(IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var isExists = await _users.Where(u => userIds.Contains(u.Id) && u.IsActive).Select(u => u.DisplayName)
            .ToListAsync(cancellationToken);
        return isExists;
    }

    public async Task<bool> AddRangeUserAsync(IEnumerable<Users> users, CancellationToken cancellationToken)
    {
        await _users.AddRangeAsync(users, cancellationToken);
        var result = await context.SaveChangesAsync(cancellationToken);
        return result > 0;
    }
}