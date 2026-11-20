
using System.Security.Claims;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;
    private readonly IPatientService _patientService;

    public PrescriptionsController(
        IPrescriptionService prescriptionService,
        IPatientService patientService)
    {
        _prescriptionService = prescriptionService;
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var prescriptions = await _prescriptionService.GetAllAsync();

        return Ok(prescriptions.Select(p => new
        {
            p.PrescriptionId,
            p.PatientId,
            PatientName = p.Patient?.FullName,
            p.ConsultationId,
            p.MedicineName,
            p.Dosage,
            p.Instructions,
            p.PrescribingDoctorName,
            p.PrescriptionDate
        }));
    }

    [HttpGet("assigned")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetAssignedDoctorPrescriptions()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
            return Unauthorized(new { message = "Doctor user ID was not found in the token." });

        var prescriptions = await _prescriptionService.GetByDoctorUserIdAsync(userId);

        return Ok(prescriptions.Select(p => new
        {
            p.PrescriptionId,
            p.PatientId,
            PatientName = p.Patient?.FullName,
            p.ConsultationId,
            p.MedicineName,
            p.Dosage,
            p.Instructions,
            p.PrescribingDoctorName,
            p.PrescriptionDate
        }));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetById(int id)
    {
        var prescription = await _prescriptionService.GetByIdAsync(id);

        if (prescription == null)
            return NotFound(new { message = "Prescription not found." });

        return Ok(new
        {
            prescription.PrescriptionId,
            prescription.PatientId,
            PatientName = prescription.Patient?.FullName,
            prescription.ConsultationId,
            prescription.MedicineName,
            prescription.Dosage,
            prescription.Instructions,
            prescription.PrescribingDoctorName,
            prescription.PrescriptionDate
        });
    }

    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetByPatientId(int patientId)
    {
        var prescriptions = await _prescriptionService.GetByPatientIdAsync(patientId);

        return Ok(prescriptions.Select(p => new
        {
            p.PrescriptionId,
            p.ConsultationId,
            p.MedicineName,
            p.Dosage,
            p.Instructions,
            p.PrescribingDoctorName,
            p.PrescriptionDate
        }));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyPrescriptions()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var patient = await _patientService.GetByUserIdAsync(userId);

        if (patient == null)
            return NotFound(new { message = "Patient record not found." });

        var prescriptions = await _prescriptionService.GetByPatientIdAsync(patient.PatientId);

        return Ok(prescriptions.Select(p => new
        {
            p.PrescriptionId,
            p.ConsultationId,
            p.MedicineName,
            p.Dosage,
            p.Instructions,
            p.PrescribingDoctorName,
            p.PrescriptionDate
        }));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Update(int id, UpdatePrescriptionDto dto)
    {
        var prescription = await _prescriptionService.UpdateAsync(id, dto);
        if (prescription == null)
            return NotFound(new { message = "Prescription not found or update details are invalid." });

        return Ok(new
        {
            message = "Prescription updated successfully.",
            data = new
            {
                prescription.PrescriptionId,
                prescription.PatientId,
                prescription.ConsultationId,
                prescription.MedicineName,
                prescription.Dosage,
                prescription.Instructions,
                prescription.PrescribingDoctorName,
                prescription.PrescriptionDate
            }
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _prescriptionService.DeleteAsync(id))
            return NotFound(new { message = "Prescription not found." });

        return Ok(new { message = "Prescription deleted. Use this only to correct an erroneous entry." });
    }

    [HttpPost]
    [Authorize(Roles = "Nurse,Doctor")]
    public async Task<IActionResult> Create(CreatePrescriptionDto dto)
    {
        int? doctorUserId = null;

        if (User.IsInRole("Doctor"))
        {
            doctorUserId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        var prescription = await _prescriptionService.CreateAsync(dto, doctorUserId);

        if (prescription == null)
        {
            return BadRequest(new
            {
                message = "Invalid patient, consultation, doctor assignment, or prescription details."
            });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "Prescription created successfully.",
            data = new
            {
                prescription.PrescriptionId,
                prescription.PatientId,
                prescription.ConsultationId,
                prescription.MedicineName,
                prescription.Dosage,
                prescription.Instructions,
                prescription.PrescribingDoctorName,
                prescription.PrescriptionDate
            }
        });
    }
}
