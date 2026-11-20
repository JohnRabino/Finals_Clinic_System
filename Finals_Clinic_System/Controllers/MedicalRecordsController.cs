
using System.Security.Claims;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _service;
    private readonly IPatientService _patientService;

    public MedicalRecordsController(
        IMedicalRecordService service,
        IPatientService patientService)
    {
        _service = service;
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var records = await _service.GetAllAsync();

        return Ok(records.Select(r => new
        {
            r.RecordId,
            r.PatientId,
            PatientName = r.Patient?.FullName,
            r.ConsultationId,
            r.AppointmentId,
            r.DoctorId,
            DoctorName = r.Doctor?.FullName,
            r.Diagnosis,
            r.Treatment,
            r.Notes,
            r.RecordDate
        }));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetById(int id)
    {
        var record = await _service.GetByIdAsync(id);

        if (record == null)
            return NotFound(new { message = "Medical record not found." });

        return Ok(new
        {
            record.RecordId,
            record.PatientId,
            PatientName = record.Patient?.FullName,
            record.ConsultationId,
            record.AppointmentId,
            record.DoctorId,
            DoctorName = record.Doctor?.FullName,
            record.Diagnosis,
            record.Treatment,
            record.Notes,
            record.RecordDate
        });
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyRecords()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var patient = await _patientService.GetByUserIdAsync(userId);

        if (patient == null)
            return NotFound(new { message = "Patient record not found." });

        var records = await _service.GetByPatientIdAsync(patient.PatientId);

        return Ok(records.Select(r => new
        {
            r.RecordId,
            r.ConsultationId,
            r.AppointmentId,
            r.DoctorId,
            DoctorName = r.Doctor?.FullName,
            r.Diagnosis,
            r.Treatment,
            r.Notes,
            r.RecordDate
        }));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Update(int id, UpdateMedicalRecordDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _service.DeleteAsync(id))
            return NotFound(new { message = "Medical record not found." });

        return Ok(new { message = "Medical record deleted. Use this only to correct an erroneous entry." });
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(CreateMedicalRecordDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, new { message = result.Message });
    }
}
