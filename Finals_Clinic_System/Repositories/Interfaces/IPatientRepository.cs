
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IPatientRepository
{
    Task<List<Patient>> GetAllAsync();

    Task<Patient?> GetByIdAsync(int id);

    Task<Patient?> GetByUserIdAsync(int userId);

    Task AddAsync(Patient patient);

    Task SaveChangesAsync();
}
