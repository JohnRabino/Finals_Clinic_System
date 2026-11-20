using System.Security.Claims;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsultationsController : ControllerBase
{
    private readonly IConsultationService _service;
    private readonly IPatientService _patientService;

    public ConsultationsController(IConsultationService service, IPatientService patientService)
    {
        _service = service;
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var consultations = await _service.GetAllAsync();
        return Ok(consultations.Select(ToResponse));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetById(int id)
    {
        var consultation = await _service.GetByIdAsync(id);
        if (consultation == null)
            return NotFound(new { message = "Consultation not found." });

        return Ok(ToResponse(consultation));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyConsultations()
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var patient = await _patientService.GetByUserIdAsync(userId);
        if (patient == null)
            return NotFound(new { message = "Patient record not found or inactive." });

        var consultations = await _service.GetByPatientIdAsync(patient.PatientId);
        return Ok(consultations.Select(c => new
        {
            c.ConsultationId,
            c.PatientId,
            c.AppointmentId,
            c.ConsultationDate,
            c.TimeIn,
            c.TimeOut,
            c.Complaint,
            c.BloodPressure,
            c.Temperature,
            c.Assessment,
            c.AssistanceProvided,
            c.Notes,
            c.FollowUpInstructions,
            c.DoctorAssessment,
            c.DoctorReviewedAt,
            DoctorName = c.Doctor?.FullName
        }));
    }

    [HttpGet("assigned")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetAssignedConsultations()
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var consultations = await _service.GetByDoctorUserIdAsync(userId);
        return Ok(consultations.Select(ToResponse));
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(CreateConsultationDto dto)
    {
        if (!TryGetUserId(out var nurseUserId))
            return Unauthorized();

        var result = await _service.CreateAsync(dto, nurseUserId);
        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            if (result.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("only be created", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, new { message = result.Message });
    }

    [HttpPut("{id:int}/doctor-assessment")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> SubmitDoctorAssessment(int id, CreateDoctorAssessmentDto dto)
    {
        if (!TryGetUserId(out var doctorUserId))
            return Unauthorized();

        var result = await _service.SubmitDoctorAssessmentAsync(id, dto, doctorUserId);
        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            if (result.Message.Contains("not assigned", StringComparison.OrdinalIgnoreCase))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = result.Message });
            if (result.Message.Contains("already", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("completed", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [HttpPut("{id:int}/complete")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Complete(int id, CompleteConsultationDto dto)
    {
        var result = await _service.CompleteAsync(id, dto);
        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            if (result.Message.Contains("already", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("required before", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("must still be confirmed", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    private bool TryGetUserId(out int userId)
    {
        return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }

    private static object ToResponse(Finals_Clinic_System.Models.Consultation c)
    {
        return new
        {
            c.ConsultationId,
            c.PatientId,
            PatientName = c.Patient?.FullName,
            c.AppointmentId,
            c.NurseUserId,
            NurseName = c.Nurse?.FullName,
            c.DoctorId,
            DoctorName = c.Doctor?.FullName,
            c.ConsultationDate,
            c.TimeIn,
            c.TimeOut,
            c.Complaint,
            c.BloodPressure,
            c.Temperature,
            c.Assessment,
            c.AssistanceProvided,
            c.Notes,
            c.FollowUpInstructions,
            c.DoctorAssessment,
            c.DoctorReviewedAt
        };
    }
}
