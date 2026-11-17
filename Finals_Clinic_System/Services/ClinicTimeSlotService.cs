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

    public async Task<(bool Success, string Message)> CreateAsync(CreateClinicTimeSlotDto dto)
    {
        if (dto.SlotDate < DateOnly.FromDateTime(DateTime.Today))
            return (false, "Cannot create a time slot for a past date.");

        if (dto.EndTime <= dto.StartTime)
            return (false, "End time must be later than start time.");

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