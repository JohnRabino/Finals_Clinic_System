using Finals_Clinic_System.Models;
namespace Finals_Clinic_System.Repositories.Interfaces;
public interface IAdminUserRepository
{
    Task<List<User>> GetAllAsync();
    Task<User?> GetByIdAsync(int id);
    Task<bool> EmailExistsAsync(string email);
    Task<int> CountActiveAdminsAsync();
    Task AddAsync(User user, Doctor? doctor);
    Task SetLinkedProfileActiveAsync(int userId, string role, bool isActive);
    Task SaveChangesAsync();
}
