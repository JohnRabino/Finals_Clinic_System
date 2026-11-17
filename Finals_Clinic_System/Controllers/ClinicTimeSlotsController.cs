using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClinicTimeSlotsController : ControllerBase
{
    private readonly IClinicTimeSlotService _service;

    public ClinicTimeSlotsController(IClinicTimeSlotService service)
    {
        _service = service;
    }

    [HttpGet("available")]
    [Authorize]
    public async Task<IActionResult> GetAvailable([FromQuery] DateOnly? date)
    {
        var slots = await _service.GetAvailableAsync(date);
        return Ok(slots);
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(CreateClinicTimeSlotDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }
}