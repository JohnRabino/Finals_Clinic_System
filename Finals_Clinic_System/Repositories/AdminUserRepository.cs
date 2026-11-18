
using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class AdminUserRepository : IAdminUserRepository
{
    private readonly ClinicDbContext _context;

    public AdminUserRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<User>> GetAllAsync() =>
        _context.Users
            .AsNoTracking()
            .OrderBy(u => u.FullName)
            .ToListAsync();

    public Task<User?> GetByIdAsync(int id) =>
        _context.Users.FirstOrDefaultAsync(u => u.UserId == id);

    public Task<bool> EmailExistsAsync(string email) =>
        _context.Users.AnyAsync(u => u.Email == email);

    public Task<int> CountActiveAdminsAsync() =>
        _context.Users.CountAsync(u => u.Role == "Admin" && u.IsActive);

    public async Task AddAsync(User user, Doctor? doctor)
    {
        _context.Users.Add(user);

        if (doctor != null)
        {
            doctor.User = user;
            _context.Doctors.Add(doctor);
        }

        await Task.CompletedTask;
    }

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}
