using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IAppointmentRepository
{
    Task<List<Appointment>> GetAllAsync();

    Task<List<Appointment>> GetByPatientIdAsync(int patientId);

    Task<Appointment?> GetByIdAsync(int id);

    Task AddAsync(Appointment appointment);

    Task SaveChangesAsync();
}