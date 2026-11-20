using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IConsultationService
{
    Task<List<Consultation>> GetAllAsync();
    Task<List<Consultation>> GetByPatientIdAsync(int patientId);
    Task<List<Consultation>> GetByDoctorUserIdAsync(int userId);
    Task<Consultation?> GetByIdAsync(int id);
    Task<(bool Success, string Message)> CreateAsync(CreateConsultationDto dto, int nurseUserId);
    Task<(bool Success, string Message)> SubmitDoctorAssessmentAsync(int id, CreateDoctorAssessmentDto dto, int doctorUserId);
    Task<(bool Success, string Message)> CompleteAsync(int id, CompleteConsultationDto dto);
}
