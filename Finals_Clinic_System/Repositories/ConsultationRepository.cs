using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class ConsultationRepository : IConsultationRepository
{
    private readonly ClinicDbContext _context;

    public ConsultationRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<Consultation>> GetAllAsync()
    {
        return _context.Consultations.AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
            .Include(c => c.Appointment)
            .OrderByDescending(c => c.ConsultationDate)
            .ToListAsync();
    }

    public Task<List<Consultation>> GetByPatientIdAsync(int patientId)
    {
        return _context.Consultations.AsNoTracking()
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
            .Include(c => c.Appointment)
            .Where(c => c.PatientId == patientId)
            .OrderByDescending(c => c.ConsultationDate)
            .ToListAsync();
    }

    public Task<List<Consultation>> GetByDoctorUserIdAsync(int userId)
    {
        return _context.Consultations.AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
            .Include(c => c.Appointment)
            .Where(c => c.Doctor != null && c.Doctor.UserId == userId)
            .OrderByDescending(c => c.ConsultationDate)
            .ToListAsync();
    }

    public Task<Consultation?> GetByIdAsync(int id)
    {
        return _context.Consultations
            .Include(c => c.Patient)
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
            .Include(c => c.Appointment)
                .ThenInclude(a => a!.TimeSlot)
            .FirstOrDefaultAsync(c => c.ConsultationId == id);
    }

    public Task<bool> HasAppointmentConsultationAsync(int appointmentId)
    {
        return _context.Consultations.AnyAsync(c => c.AppointmentId == appointmentId);
    }

    public Task AddAsync(Consultation consultation)
    {
        return _context.Consultations.AddAsync(consultation).AsTask();
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}