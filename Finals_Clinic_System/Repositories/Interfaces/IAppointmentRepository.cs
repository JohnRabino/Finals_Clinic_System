using Finals_Clinic_System.Models;
namespace Finals_Clinic_System.Repositories.Interfaces;
public interface IAppointmentRepository
{
    Task&lt;List&lt;Appointment&gt;&gt; GetAllAsync();
    Task&lt;Appointment?&gt; GetByIdAsync(int id);
    Task&lt;bool&gt; HasConflictAsync(int doctorId, DateOnly date, TimeOnly time, int? excludeAppointmentId = null);
    Task AddAsync(Appointment appointment);
    Task&lt;List&lt;Appointment&gt;&gt; GetDailyScheduleAsync(DateOnly date);
    Task SaveChangesAsync();
}
