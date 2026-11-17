using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IAppointmentService
{
    Task<List<Appointment>> GetAllAsync();
    Task<List<Appointment>> GetByPatientIdAsync(int patientId);
    Task<(bool Success, string Message)> CreateAsync(CreateAppointmentDto dto);
    Task<(bool Success, string Message)> UpdateStatusAsync(int id, UpdateAppointmentStatusDto dto);
}