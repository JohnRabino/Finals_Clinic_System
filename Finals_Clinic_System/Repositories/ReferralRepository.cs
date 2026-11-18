
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

    public async Task<List<Referral>> GetAllAsync()
    {
        return await _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ExternalDoctor)
            .ToListAsync();
    }

    public async Task<List<Referral>> GetByPatientIdAsync(int patientId)
    {
        return await _context.Referrals
            .Include(r => r.ExternalDoctor)
            .Where(r => r.PatientId == patientId)
            .ToListAsync();
    }

    public async Task<Referral?> GetByIdAsync(int id)
    {
        return await _context.Referrals
            .Include(r => r.Patient)
            .Include(r => r.ExternalDoctor)
            .FirstOrDefaultAsync(r => r.ReferralId == id);
    }

    public async Task<bool> PatientExistsAsync(int patientId)
    {
        return await _context.Patients
            .AnyAsync(p => p.PatientId == patientId);
    }

    public async Task<bool> ExternalDoctorExistsAsync(int externalDoctorId)
    {
        return await _context.ExternalDoctors
            .AnyAsync(d => d.ExternalDoctorId == externalDoctorId);
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
