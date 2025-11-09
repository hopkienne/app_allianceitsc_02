using System.Linq.Expressions;
using ChatApp.Domain.Entities;

namespace ChatApp.Application.Abstractions;

public interface IUsersRepository
{
    Task<List<T>> GetListUser<T>(Expression<Func<Users, T>> selector, CancellationToken cancellationToken);

    Task<List<T>> GetListUserByConditionAsync<T>(Expression<Func<Users, T>> selector,
        Expression<Func<Users, bool>> predicate, CancellationToken cancellationToken);
    Task<Users?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Users?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<string> GetDisplayNameByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<List<string>> CheckUsersExistsByIdAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken);
}