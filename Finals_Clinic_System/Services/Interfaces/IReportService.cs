using Finals_Clinic_System.DTOs.Reports;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IReportService
{
    Task<PatientHistoryDto?> GetPatientHistoryAsync(int patientId);

    Task<DailyScheduleDto> GetDailyScheduleAsync(DateOnly date);
}