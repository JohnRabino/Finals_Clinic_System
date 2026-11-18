
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

        return Ok(new
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
