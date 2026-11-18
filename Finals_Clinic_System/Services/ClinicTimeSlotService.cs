
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ClinicTimeSlotService : IClinicTimeSlotService
{
    private readonly IClinicTimeSlotRepository _repository;

    public ClinicTimeSlotService(IClinicTimeSlotRepository repository)
    {
        _repository = repository;
    }

    public Task<List<ClinicTimeSlot>> GetAvailableAsync(DateOnly? date)
    {
        return _repository.GetAvailableAsync(date);
    }

    public async Task<(bool Success, string Message)> CreateAsync(
        CreateClinicTimeSlotDto dto)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        if (dto.SlotDate < today)
            return (false, "Cannot create a time slot for a past date.");

        if (dto.SlotDate == today && dto.StartTime <= currentTime)
            return (false, "Cannot create a time slot for a past time.");

        if (dto.EndTime <= dto.StartTime)
            return (false, "End time must be later than start time.");

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

        return (true, "Clinic time slot created successfully.");
    }
}
