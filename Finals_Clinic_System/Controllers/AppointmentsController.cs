using Finals_Clinic_System.DTOs.Appointments;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _service;

    public AppointmentsController(IAppointmentService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Clinic Staff,Doctor")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var appointment = await _service.GetByIdAsync(id);

        return appointment is null
            ? NotFound(new { message = "Appointment not found." })
            : Ok(appointment);
    }

    [HttpPost]
    [Authorize(Roles = "Clinic Staff,Patient")]
    public async Task<IActionResult> Create(AppointmentCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data!.AppointmentId },
            new
            {
                message = result.Message,
                data = result.Data
            });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Clinic Staff")]
    public async Task<IActionResult> Update(
        int id,
        AppointmentUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Clinic Staff,Doctor")]
    public async Task<IActionResult> ChangeStatus(
        int id,
        AppointmentStatusUpdateDto dto)
    {
        var result = await _service.ChangeStatusAsync(id, dto.Status);

        return result.Success
            ? Ok(new { message = result.Message })
            : BadRequest(new { message = result.Message });
    }

    [HttpGet("daily-schedule")]
    [Authorize(Roles = "Clinic Staff,Doctor")]
    public async Task<IActionResult> GetDailySchedule(
        [FromQuery] DateOnly date)
    {
        if (date == default)
        {
            date = DateOnly.FromDateTime(DateTime.Today);
        }

        return Ok(await _service.GetDailyScheduleAsync(date));
    }
}