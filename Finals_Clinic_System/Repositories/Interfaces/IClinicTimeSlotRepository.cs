
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IClinicTimeSlotRepository
{
    Task<List<ClinicTimeSlot>> GetAvailableAsync(DateOnly? date);

    Task<ClinicTimeSlot?> GetByIdAsync(int id);

    Task<bool> HasOverlapAsync(DateOnly date, TimeOnly startTime, TimeOnly endTime);

    Task AddAsync(ClinicTimeSlot timeSlot);

    Task SaveChangesAsync();
}
