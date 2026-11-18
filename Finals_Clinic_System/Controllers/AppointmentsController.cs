
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
            a.Reason
        }));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyAppointments()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var patient = await _patientService.GetByUserIdAsync(userId);

        if (patient == null)
            return NotFound(new { message = "Patient record not found." });

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
            a.Reason
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create(CreateAppointmentDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var patient = await _patientService.GetByUserIdAsync(userId);

        if (patient == null)
            return NotFound(new { message = "Patient record not found." });

        dto.PatientId = patient.PatientId;

        var result = await _appointmentService.CreateAsync(dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> UpdateStatus(
        int id, UpdateAppointmentStatusDto dto)
    {
        var result = await _appointmentService.UpdateStatusAsync(id, dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }
}
