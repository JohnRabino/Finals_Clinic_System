using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IConsultationRepository
{
    Task<List<Consultation>> GetAllAsync();
    Task<List<Consultation>> GetByPatientIdAsync(int patientId);
    Task<List<Consultation>> GetByDoctorUserIdAsync(int userId);
    Task<Consultation?> GetByIdAsync(int id);
    Task<bool> HasAppointmentConsultationAsync(int appointmentId);
    Task AddAsync(Consultation consultation);
    Task SaveChangesAsync();
}
