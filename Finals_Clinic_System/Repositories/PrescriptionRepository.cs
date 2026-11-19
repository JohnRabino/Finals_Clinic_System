\
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

    public async Task<List<Prescription>> GetAllAsync()
    {
        return await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Consultation)
            .ToListAsync();
    }

    public async Task<List<Prescription>> GetByPatientIdAsync(int patientId)
    {
        return await _context.Prescriptions
            .Include(p => p.Consultation)
            .Where(p => p.PatientId == patientId)
            .ToListAsync();
    }

    public async Task<List<Prescription>> GetByConsultationIdAsync(int consultationId)
    {
        return await _context.Prescriptions
            .Where(p => p.ConsultationId == consultationId)
            .ToListAsync();
    }

    public async Task<Prescription?> GetByIdAsync(int id)
    {
        return await _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Consultation)
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

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}
