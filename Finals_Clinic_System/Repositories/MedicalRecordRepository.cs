
using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class MedicalRecordRepository : IMedicalRecordRepository
{
    private readonly ClinicDbContext _context;

    public MedicalRecordRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<MedicalRecord>> GetAllAsync()
    {
        return _context.MedicalRecords
            .AsNoTracking()
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Include(r => r.Consultation)
            .OrderByDescending(r => r.RecordDate)
            .ToListAsync();
    }

    public Task<List<MedicalRecord>> GetByPatientIdAsync(int patientId)
    {
        return _context.MedicalRecords
            .AsNoTracking()
            .Include(r => r.Doctor)
            .Include(r => r.Consultation)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.RecordDate)
            .ToListAsync();
    }

    public Task<MedicalRecord?> GetByIdAsync(int id)
    {
        return _context.MedicalRecords
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Include(r => r.Consultation)
            .FirstOrDefaultAsync(r => r.RecordId == id);
    }

    public async Task AddAsync(MedicalRecord record)
    {
        await _context.MedicalRecords.AddAsync(record);
    }

    public void Delete(MedicalRecord record)
    {
        _context.MedicalRecords.Remove(record);
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
