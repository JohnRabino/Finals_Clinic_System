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

    public Task<List<MedicalRecord>> GetAllAsync() =>
        _context.MedicalRecords
            .Include(record => record.Patient)
            .Include(record => record.Doctor)
            .Include(record => record.Appointment)
            .AsNoTracking()
            .OrderByDescending(record => record.RecordDate)
            .ToListAsync();

    public Task<MedicalRecord?> GetByIdAsync(int id) =>
        _context.MedicalRecords
            .Include(record => record.Patient)
            .Include(record => record.Doctor)
            .Include(record => record.Appointment)
            .FirstOrDefaultAsync(record => record.RecordId == id);

    public Task<List<MedicalRecord>> GetPatientHistoryAsync(int patientId) =>
        _context.MedicalRecords
            .Include(record => record.Patient)
            .Include(record => record.Doctor)
            .Include(record => record.Appointment)
            .AsNoTracking()
            .Where(record => record.PatientId == patientId)
            .OrderByDescending(record => record.RecordDate)
            .ToListAsync();

    public async Task AddAsync(MedicalRecord record) =>
        await _context.MedicalRecords.AddAsync(record);

    public void Remove(MedicalRecord record) =>
        _context.MedicalRecords.Remove(record);

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}