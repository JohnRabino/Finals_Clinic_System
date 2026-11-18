
using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class ManualClinicLogRepository : IManualClinicLogRepository
{
    private readonly ClinicDbContext _context;

    public ManualClinicLogRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public async Task<List<ManualClinicLog>> GetAllAsync()
    {
        return await _context.ManualClinicLogs
            .Include(l => l.Patient)
            .Include(l => l.EncodedByUser)
            .OrderByDescending(l => l.VisitDate)
            .ToListAsync();
    }

    public async Task<ManualClinicLog?> GetByIdAsync(int id)
    {
        return await _context.ManualClinicLogs
            .Include(l => l.Patient)
            .Include(l => l.EncodedByUser)
            .FirstOrDefaultAsync(l => l.ManualLogId == id);
    }

    public async Task<bool> PatientExistsAsync(int patientId)
    {
        return await _context.Patients
            .AnyAsync(p => p.PatientId == patientId);
    }

    public async Task AddAsync(ManualClinicLog log)
    {
        await _context.ManualClinicLogs.AddAsync(log);
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}
