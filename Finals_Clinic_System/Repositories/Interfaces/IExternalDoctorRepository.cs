
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IExternalDoctorRepository
{
    Task<List<ExternalDoctor>> GetAllAsync();

    Task<ExternalDoctor?> GetByIdAsync(int id);

    Task AddAsync(ExternalDoctor doctor);

    Task SaveChangesAsync();
}
