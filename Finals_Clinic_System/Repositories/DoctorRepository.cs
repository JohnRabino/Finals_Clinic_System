using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class DoctorRepository : IDoctorRepository
{
    private readonly ClinicDbContext _context;

    public DoctorRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<Doctor>> GetActiveAsync()
    {
        return _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .Where(d => d.IsActive && d.User.IsActive)
            .OrderBy(d => d.FullName)
            .ToListAsync();
    }

    public Task<Doctor?> GetActiveByIdAsync(int id)
    {
        return _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.DoctorId == id && d.IsActive && d.User.IsActive);
    }

    public Task<Doctor?> GetActiveByUserIdAsync(int userId)
    {
        return _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.UserId == userId && d.IsActive && d.User.IsActive);
    }

    public Task<Doctor?> GetByIdForUpdateAsync(int id)
    {
        return _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.DoctorId == id);
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}