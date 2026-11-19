using System.Data;
using Finals_Clinic_System.Data;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Services;

public class ClinicTimeSlotService : IClinicTimeSlotService
{
    private readonly ClinicDbContext _db;
    private readonly IClinicTimeSlotRepository _repository;

    public ClinicTimeSlotService(
        ClinicDbContext db,
        IClinicTimeSlotRepository repository)
    {
        _db = db;
        _repository = repository;
    }

    public Task<List<ClinicTimeSlot>> GetAvailableAsync(DateOnly? date)
    {
        return _repository.GetAvailableAsync(date);
    }

    public Task<List<ClinicTimeSlot>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }

    public Task<ClinicTimeSlot?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public async Task<(bool Success, string Message)> CreateAsync(CreateClinicTimeSlotDto dto)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        if (dto.SlotDate == DateOnly.MinValue)
            return (false, "A valid slot date is required.");

        if (dto.SlotDate < today)
            return (false, "Cannot create a time slot for a past date.");

        if (dto.SlotDate == today && dto.StartTime <= currentTime)
            return (false, "Cannot create a time slot for a past time.");

        if (dto.EndTime <= dto.StartTime)
            return (false, "End time must be later than start time.");

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var hasOverlap = await _repository.HasOverlapAsync(
            dto.SlotDate,
            dto.StartTime,
            dto.EndTime);

        if (hasOverlap)
            return (false, "This time slot overlaps with an existing schedule.");

        var timeSlot = new ClinicTimeSlot
        {
            SlotDate = dto.SlotDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            IsAvailable = true
        };

        await _repository.AddAsync(timeSlot);
        await _repository.SaveChangesAsync();
        await transaction.CommitAsync();

        return (true, "Clinic time slot created successfully.");
    }
}
