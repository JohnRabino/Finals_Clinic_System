using Finals_Clinic_System.Models;
namespace Finals_Clinic_System.Repositories.Interfaces;
public interface IDoctorRepository
{
    Task<List<Doctor>> GetActiveAsync();
    Task<Doctor?> GetActiveByIdAsync(int id);
    Task<Doctor?> GetActiveByUserIdAsync(int userId);
    Task<Doctor?> GetByIdForUpdateAsync(int id);
    Task SaveChangesAsync();
}
