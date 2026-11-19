using Finals_Clinic_System.Data;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Repositories;

public class ClinicTimeSlotRepository : IClinicTimeSlotRepository
{
    private readonly ClinicDbContext _context;

    public ClinicTimeSlotRepository(ClinicDbContext context)
    {
        _context = context;
    }

    public Task<List<ClinicTimeSlot>> GetAvailableAsync(DateOnly? date)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        var query = _context.ClinicTimeSlots
            .AsNoTracking()
            .Where(s => s.IsAvailable &&
                (s.SlotDate > today ||
                 (s.SlotDate == today && s.StartTime > currentTime)));

        if (date.HasValue)
            query = query.Where(s => s.SlotDate == date.Value);

        return query.OrderBy(s => s.SlotDate)
            .ThenBy(s => s.StartTime)
            .ToListAsync();
    }

    public Task<List<ClinicTimeSlot>> GetAllAsync()
    {
        return _context.ClinicTimeSlots
            .AsNoTracking()
            .Include(s => s.Appointments)
            .OrderBy(s => s.SlotDate)
            .ThenBy(s => s.StartTime)
            .ToListAsync();
    }

    public Task<ClinicTimeSlot?> GetByIdAsync(int id)
    {
        return _context.ClinicTimeSlots
            .FirstOrDefaultAsync(s => s.TimeSlotId == id);
    }

    public Task<bool> HasOverlapAsync(DateOnly date, TimeOnly startTime, TimeOnly endTime)
    {
        return _context.ClinicTimeSlots.AnyAsync(s =>
            s.SlotDate == date &&
            s.StartTime < endTime &&
            s.EndTime > startTime);
    }

    public Task<int> TryReserveAsync(int timeSlotId)
    {
        return _context.ClinicTimeSlots
            .Where(s => s.TimeSlotId == timeSlotId && s.IsAvailable)
            .ExecuteUpdateAsync(update => update
                .SetProperty(s => s.IsAvailable, false));
    }

    public Task AddAsync(ClinicTimeSlot timeSlot)
    {
        return _context.ClinicTimeSlots.AddAsync(timeSlot).AsTask();
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
