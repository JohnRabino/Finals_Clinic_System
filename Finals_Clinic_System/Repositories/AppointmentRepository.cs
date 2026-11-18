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
            .AsNoTracking()
            .Include(a => a.Patient)
            .Include(a => a.TimeSlot)
            .Include(a => a.Doctor)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

    public Task<List<Appointment>> GetByPatientIdAsync(int patientId) =>
        _context.Appointments
            .AsNoTracking()
            .Include(a => a.TimeSlot)
            .Include(a => a.Doctor)
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

    public Task<Appointment?> GetByIdAsync(int id) =>
        _context.Appointments
            .Include(a => a.TimeSlot)
            .FirstOrDefaultAsync(a => a.AppointmentId == id);

    public Task<bool> HasDoctorConflictAsync(
    int doctorId,
    DateOnly slotDate,
    TimeOnly startTime,
    TimeOnly endTime)
    {
        return _context.Appointments.AnyAsync(a =>
            a.DoctorId == doctorId &&
            a.Status != "Cancelled" &&
            a.TimeSlot.SlotDate == slotDate &&
            a.TimeSlot.StartTime < endTime &&
            a.TimeSlot.EndTime > startTime);
    }

    public async Task AddAsync(Appointment appointment) =>
        await _context.Appointments.AddAsync(appointment);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();

    public Task<bool> PatientExistsAndActiveAsync(int patientId)
    {
        return _context.Patients.AnyAsync(p =>
            p.PatientId == patientId &&
            p.IsActive &&
            (p.UserId == null || p.User!.IsActive));
    }

    public Task<bool> DoctorExistsAndActiveAsync(int doctorId)
    {
        return _context.Doctors.AnyAsync(d =>
            d.DoctorId == doctorId &&
            d.IsActive &&
            d.User.IsActive);
    }
}