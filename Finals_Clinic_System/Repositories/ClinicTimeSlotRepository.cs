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
        var query = _context.ClinicTimeSlots
            .AsNoTracking()
            .Where(s => s.IsAvailable);

        if (date.HasValue)
            query = query.Where(s => s.SlotDate == date.Value);

        return query
            .OrderBy(s => s.SlotDate)
            .ThenBy(s => s.StartTime)
            .ToListAsync();
    }

    public Task<ClinicTimeSlot?> GetByIdAsync(int id) =>
        _context.ClinicTimeSlots
            .FirstOrDefaultAsync(s => s.TimeSlotId == id);

    public async Task AddAsync(ClinicTimeSlot timeSlot) =>
        await _context.ClinicTimeSlots.AddAsync(timeSlot);

    public Task SaveChangesAsync() =>
        _context.SaveChangesAsync();
}