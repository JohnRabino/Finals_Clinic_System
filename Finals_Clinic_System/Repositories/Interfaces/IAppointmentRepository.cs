using Finals_Clinic_System.DTOs.Appointments;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IAppointmentService
{
    Task<List<Appointment>> GetAllAsync();

    Task<Appointment?> GetByIdAsync(int id);

    Task<(bool Success, string Message, Appointment? Data)> CreateAsync(
        AppointmentCreateDto dto);

    Task<(bool Success, string Message, Appointment? Data)> UpdateAsync(
        int id,
        AppointmentUpdateDto dto);

    Task<(bool Success, string Message)> ChangeStatusAsync(
        int id,
        string newStatus);

    Task<List<Appointment>> GetDailyScheduleAsync(DateOnly date);
}
