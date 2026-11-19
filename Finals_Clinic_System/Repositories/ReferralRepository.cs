
using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class ReferralRepository : IReferralRepository
{
    private readonly ClinicDbContext _context;

    public ReferralRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<Referral>> GetAllAsync()
    {
        return _context.Referrals
            .AsNoTracking()
            .Include(r => r.Patient)
            .Include(r => r.ExternalDoctor)
            .OrderByDescending(r => r.ReferralDate)
            .ToListAsync();
    }

    public Task<List<Referral>> GetByPatientIdAsync(int patientId)
    {
        return _context.Referrals
            .AsNoTracking()
            .Include(r => r.ExternalDoctor)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.ReferralDate)
            .ToListAsync();
    }

    public Task<Referral?> GetByIdAsync(int id)
    {
        return _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ExternalDoctor)
            .FirstOrDefaultAsync(r => r.ReferralId == id);
    }

    public Task<bool> PatientExistsAsync(int patientId)
    {
        return _context.Patients
            .AnyAsync(p => p.PatientId == patientId && p.IsActive);
    }

    public Task<bool> ExternalDoctorExistsAsync(int externalDoctorId)
    {
        return _context.ExternalDoctors
            .AnyAsync(d => d.ExternalDoctorId == externalDoctorId);
    }

    public Task<bool> ExternalDoctorIsActiveAsync(int externalDoctorId)
    {
        return _context.ExternalDoctors
            .AnyAsync(d => d.ExternalDoctorId == externalDoctorId && d.IsActive);
    }

    public async Task AddAsync(Referral referral)
    {
        await _context.Referrals.AddAsync(referral);
    }

    public async Task SaveAsync()
    {
        await _context.SaveChangesAsync();
    }
}
