
using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class PatientRepository : IPatientRepository
{
    private readonly ClinicDbContext _context;

    public PatientRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<Patient>> GetAllAsync() =>
        _context.Patients
            .AsNoTracking()
            .OrderBy(p => p.FullName)
            .ToListAsync();

    public Task<Patient?> GetByIdAsync(int id) =>
        _context.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PatientId == id);

    public Task<Patient?> GetByUserIdAsync(int userId) =>
    _context.Patients
        .Include(p => p.User)
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.UserId == userId);

    public async Task AddAsync(Patient patient) =>
        await _context.Patients.AddAsync(patient);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}