using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly ClinicDbContext _context;

    public AppointmentRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<Appointment>> GetAllAsync() =>
        _context.Appointments
            .Include(appointment => appointment.Patient)
            .Include(appointment => appointment.Doctor)
            .AsNoTracking()
            .OrderBy(appointment => appointment.AppointmentDate)
            .ThenBy(appointment => appointment.AppointmentTime)
            .ToListAsync();

    public Task<Appointment?> GetByIdAsync(int id) =>
        _context.Appointments
            .Include(appointment => appointment.Patient)
            .Include(appointment => appointment.Doctor)
            .FirstOrDefaultAsync(appointment => appointment.AppointmentId == id);

    public Task<bool> HasConflictAsync(
        int doctorId,
        DateOnly date,
        TimeOnly time,
        int? excludeAppointmentId = null) =>
        _context.Appointments.AnyAsync(appointment =>
            appointment.DoctorId == doctorId &&
            appointment.AppointmentDate == date &&
            appointment.AppointmentTime == time &&
            appointment.Status != "Cancelled" &&
            (!excludeAppointmentId.HasValue ||
             appointment.AppointmentId != excludeAppointmentId.Value));

    public async Task AddAsync(Appointment appointment) =>
        await _context.Appointments.AddAsync(appointment);

    public Task<List<Appointment>> GetDailyScheduleAsync(DateOnly date) =>
        _context.Appointments
            .Include(appointment => appointment.Patient)
            .Include(appointment => appointment.Doctor)
            .AsNoTracking()
            .Where(appointment => appointment.AppointmentDate == date)
            .OrderBy(appointment => appointment.AppointmentTime)
            .ToListAsync();

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}