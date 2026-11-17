
using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class ExternalDoctorRepository : IExternalDoctorRepository
{
    private readonly ClinicDbContext _context;

    public ExternalDoctorRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<ExternalDoctor>> GetAllAsync() =>
        _context.ExternalDoctors
            .AsNoTracking()
            .Where(d => d.IsActive)
            .OrderBy(d => d.FullName)
            .ToListAsync();

    public Task<ExternalDoctor?> GetByIdAsync(int id) =>
        _context.ExternalDoctors
            .FirstOrDefaultAsync(d => d.ExternalDoctorId == id);

    public async Task AddAsync(ExternalDoctor doctor) =>
        await _context.ExternalDoctors.AddAsync(doctor);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
