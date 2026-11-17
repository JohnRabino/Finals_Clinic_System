using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IConsultationService
{
    Task<List<Consultation>> GetAllAsync();
    Task<List<Consultation>> GetByPatientIdAsync(int patientId);
    Task<(bool Success, string Message)> CreateAsync(CreateConsultationDto dto, int nurseUserId);
    Task<(bool Success, string Message)> CompleteAsync(int id, CompleteConsultationDto dto);
}