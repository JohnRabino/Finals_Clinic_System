using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class ReportRepository : IReportRepository
{
    private readonly ClinicDbContext _context;

    public ReportRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<Patient?> GetPatientHistoryAsync(int patientId)
    {
        return _context.Patients
            .AsNoTracking()
            .Include(p => p.Consultations)
                .ThenInclude(c => c.Doctor)
            .Include(p => p.MedicalRecords)
                .ThenInclude(r => r.Doctor)
            .Include(p => p.Prescriptions)
            .Include(p => p.Referrals)
                .ThenInclude(r => r.ExternalDoctor)
            .FirstOrDefaultAsync(p => p.PatientId == patientId);
    }

    public Task<List<Appointment>> GetDailyScheduleAsync(DateOnly date)
    {
        return _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.TimeSlot)
            .Where(a => a.TimeSlot.SlotDate == date)
            .OrderBy(a => a.TimeSlot.StartTime)
            .ToListAsync();
    }
}