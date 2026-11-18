
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

    public Task<List<ManualClinicLog>> GetAllAsync()
    {
        return _context.ManualClinicLogs
            .AsNoTracking()
            .Include(l => l.Patient)
            .Include(l => l.EncodedByUser)
            .OrderByDescending(l => l.VisitDate)
            .ToListAsync();
    }

    public Task<ManualClinicLog?> GetByIdAsync(int id)
    {
        return _context.ManualClinicLogs
            .AsNoTracking()
            .Include(l => l.Patient)
            .Include(l => l.EncodedByUser)
            .FirstOrDefaultAsync(l => l.ManualLogId == id);
    }

    public Task<bool> PatientExistsAsync(int patientId)
    {
        return _context.Patients
            .AnyAsync(p => p.PatientId == patientId);
    }

    public async Task AddAsync(ManualClinicLog log)
    {
        await _context.ManualClinicLogs.AddAsync(log);
    }

    public Task SaveAsync()
    {
        return _context.SaveChangesAsync();
    }
}
