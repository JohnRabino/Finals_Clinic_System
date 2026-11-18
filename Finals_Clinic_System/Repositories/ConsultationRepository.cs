
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
        return _context.Consultations
            .AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
            .OrderByDescending(c => c.ConsultationDate)
            .ToListAsync();
    }

    public Task<List<Consultation>> GetByPatientIdAsync(int patientId)
    {
        return _context.Consultations
            .AsNoTracking()
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
            .Where(c => c.PatientId == patientId)
            .OrderByDescending(c => c.ConsultationDate)
            .ToListAsync();
    }

    public Task<List<Consultation>> GetByDoctorUserIdAsync(int userId)
    {
        return _context.Consultations
            .AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.Nurse)
            .Include(c => c.Doctor)
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
            .FirstOrDefaultAsync(c => c.ConsultationId == id);
    }

    public async Task AddAsync(Consultation consultation)
    {
        await _context.Consultations.AddAsync(consultation);
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
