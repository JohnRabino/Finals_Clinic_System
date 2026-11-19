using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClinicTimeSlotsController : ControllerBase
{
    private readonly IClinicTimeSlotService _service;

    public ClinicTimeSlotsController(IClinicTimeSlotService service)
    {
        _service = service;
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable([FromQuery] DateOnly? date)
    {
        var slots = await _service.GetAvailableAsync(date);

        return Ok(slots.Select(s => new
        {
            s.TimeSlotId,
            s.SlotDate,
            s.StartTime,
            s.EndTime,
            s.IsAvailable
        }));
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var slots = await _service.GetAllAsync();

        return Ok(slots.Select(s => new
        {
            s.TimeSlotId,
            s.SlotDate,
            s.StartTime,
            s.EndTime,
            s.IsAvailable,
            AppointmentCount = s.Appointments.Count
        }));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetById(int id)
    {
        var slot = await _service.GetByIdAsync(id);

        if (slot == null)
            return NotFound(new { message = "Clinic time slot not found." });

        return Ok(new
        {
            slot.TimeSlotId,
            slot.SlotDate,
            slot.StartTime,
            slot.EndTime,
            slot.IsAvailable
        });
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(CreateClinicTimeSlotDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
        {
            if (result.Message.Contains("overlap", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, new { message = result.Message });
    }
}
