using System.Security.Claims;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly IPatientService _patientService;

    public AppointmentsController(
        IAppointmentService appointmentService,
        IPatientService patientService)
    {
        _appointmentService = appointmentService;
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var appointments = await _appointmentService.GetAllAsync();

        return Ok(appointments.Select(a => new
        {
            a.AppointmentId,
            a.PatientId,
            PatientName = a.Patient?.FullName,
            a.DoctorId,
            DoctorName = a.Doctor?.FullName,
            a.TimeSlotId,
            a.TimeSlot.SlotDate,
            a.TimeSlot.StartTime,
            a.TimeSlot.EndTime,
            a.Status,
            a.Reason,
            a.CreatedAt
        }));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetById(int id)
    {
        var appointment = await _appointmentService.GetByIdAsync(id);

        if (appointment == null)
            return NotFound(new { message = "Appointment not found." });

        return Ok(new
        {
            appointment.AppointmentId,
            appointment.PatientId,
            PatientName = appointment.Patient?.FullName,
            appointment.DoctorId,
            DoctorName = appointment.Doctor?.FullName,
            appointment.TimeSlotId,
            appointment.TimeSlot.SlotDate,
            appointment.TimeSlot.StartTime,
            appointment.TimeSlot.EndTime,
            appointment.Status,
            appointment.Reason,
            appointment.CreatedAt
        });
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyAppointments()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var patient = await _patientService.GetByUserIdAsync(userId);
        if (patient == null)
            return NotFound(new { message = "Patient record not found or inactive." });

        var appointments = await _appointmentService.GetByPatientIdAsync(patient.PatientId);

        return Ok(appointments.Select(a => new
        {
            a.AppointmentId,
            a.TimeSlotId,
            a.TimeSlot.SlotDate,
            a.TimeSlot.StartTime,
            a.TimeSlot.EndTime,
            a.DoctorId,
            DoctorName = a.Doctor?.FullName,
            a.Status,
            a.Reason,
            a.CreatedAt
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create(CreateAppointmentDto dto)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var patient = await _patientService.GetByUserIdAsync(userId);
        if (patient == null)
            return NotFound(new { message = "Patient record not found or inactive." });

        dto.PatientId = patient.PatientId;
        var result = await _appointmentService.CreateAsync(dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            if (result.Message.Contains("not available", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("conflict", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("already has", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, new { message = result.Message });
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateAppointmentStatusDto dto)
    {
        var result = await _appointmentService.UpdateStatusAsync(id, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            if (result.Message.Contains("transition", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("complete the linked consultation", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("cannot be cancelled after", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [HttpPut("{id:int}/cancel")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> CancelOwn(int id)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var patient = await _patientService.GetByUserIdAsync(userId);
        if (patient == null)
            return NotFound(new { message = "Patient record not found or inactive." });

        var result = await _appointmentService.CancelOwnAsync(id, patient.PatientId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            return Conflict(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }
}
