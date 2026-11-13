using Finals_Clinic_System.DTOs.Appointments;
using Finals_Clinic_System.Models;
namespace Finals_Clinic_System.Services.Interfaces;
public interface IAppointmentService
{
    Task&lt;List&lt;Appointment&gt;&gt; GetAllAsync();
    Task&lt;Appointment?&gt; GetByIdAsync(int id);
    Task&lt;(bool Success, string Message, Appointment? Data)&gt; CreateAsync(AppointmentCreateDto dto);
    Task&lt;(bool Success, string Message, Appointment? Data)&gt; UpdateAsync(int id, AppointmentUpdateDto dto);
    Task&lt;(bool Success, string Message)&gt; ChangeStatusAsync(int id, string newStatus);
    Task&lt;List&lt;Appointment&gt;&gt; GetDailyScheduleAsync(DateOnly date);
}