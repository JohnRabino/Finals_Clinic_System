using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly ClinicDbContext _context;

    public PrescriptionRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<Prescription>> GetAllAsync()
    {
        return _context.Prescriptions
            .AsNoTracking()
            .Include(p => p.Patient)
            .Include(p => p.Consultation)
            .OrderByDescending(p => p.PrescriptionDate)
            .ToListAsync();
    }

    public Task<List<Prescription>> GetByPatientIdAsync(int patientId)
    {
        return _context.Prescriptions
            .AsNoTracking()
            .Include(p => p.Patient)
            .Include(p => p.Consultation)
            .Where(p => p.PatientId == patientId)
            .OrderByDescending(p => p.PrescriptionDate)
            .ToListAsync();
    }

    public Task<List<Prescription>> GetByDoctorUserIdAsync(int userId)
    {
        return _context.Prescriptions
            .AsNoTracking()
            .Include(p => p.Patient)
            .Include(p => p.Consultation)
                .ThenInclude(c => c.Doctor)
            .Where(p => p.Consultation.Doctor != null &&
                        p.Consultation.Doctor.UserId == userId)
            .OrderByDescending(p => p.PrescriptionDate)
            .ToListAsync();
    }

    public Task<List<Prescription>> GetByConsultationIdAsync(int consultationId)
    {
        return _context.Prescriptions
            .AsNoTracking()
            .Where(p => p.ConsultationId == consultationId)
            .OrderByDescending(p => p.PrescriptionDate)
            .ToListAsync();
    }

    public Task<Prescription?> GetByIdAsync(int id)
    {
        return _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Consultation)
                .ThenInclude(c => c.Doctor)
            .FirstOrDefaultAsync(p => p.PrescriptionId == id);
    }

    public async Task AddAsync(Prescription prescription)
    {
        await _context.Prescriptions.AddAsync(prescription);
    }

    public void Delete(Prescription prescription)
    {
        _context.Prescriptions.Remove(prescription);
    }

    public Task SaveAsync()
    {
        return _context.SaveChangesAsync();
    }
}
