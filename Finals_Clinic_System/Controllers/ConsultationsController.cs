
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

    public ConsultationsController(
        IConsultationService service,
        IPatientService patientService)
    {
        _service = service;
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var consultations = await _service.GetAllAsync();

        return Ok(consultations.Select(c => new
        {
            c.ConsultationId,
            c.PatientId,
            PatientName = c.Patient?.FullName,
            c.AppointmentId,
            c.NurseUserId,
            NurseName = c.Nurse.FullName,
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
        }));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyConsultations()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var patient = await _patientService.GetByUserIdAsync(userId);

        if (patient == null)
            return NotFound(new { message = "Patient record not found." });

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
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var consultations = await _service.GetByDoctorUserIdAsync(userId);

        return Ok(consultations.Select(c => new
        {
            c.ConsultationId,
            c.PatientId,
            PatientName = c.Patient?.FullName,
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
            c.DoctorReviewedAt
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(CreateConsultationDto dto)
    {
        var nurseUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _service.CreateAsync(dto, nurseUserId);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }

    [HttpPut("{id:int}/doctor-assessment")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> SubmitDoctorAssessment(
        int id, CreateDoctorAssessmentDto dto)
    {
        var doctorUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _service.SubmitDoctorAssessmentAsync(id, dto, doctorUserId);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }

    [HttpPut("{id:int}/complete")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Complete(
        int id, CompleteConsultationDto dto)
    {
        var result = await _service.CompleteAsync(id, dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }
}
