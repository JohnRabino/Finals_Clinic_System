using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IReportRepository
{
    Task<Patient?> GetPatientHistoryAsync(int patientId);

    Task<List<Appointment>> GetDailyScheduleAsync(DateOnly date);
}