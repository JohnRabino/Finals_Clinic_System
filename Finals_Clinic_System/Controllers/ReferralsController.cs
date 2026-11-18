
using System.Security.Claims;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReferralsController : ControllerBase
{
    private readonly IReferralService _referralService;
    private readonly IPatientService _patientService;

    public ReferralsController(
        IReferralService referralService,
        IPatientService patientService)
    {
        _referralService = referralService;
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        var referrals = await _referralService.GetAllAsync();

        return Ok(referrals.Select(r => new
        {
            r.ReferralId,
            r.PatientId,
            PatientName = r.Patient?.FullName,
            r.ExternalDoctorId,
            ExternalDoctorName = r.ExternalDoctor?.FullName,
            ExternalDoctorSpecialization = r.ExternalDoctor?.Specialization,
            r.Reason,
            r.Notes,
            r.Status,
            r.ReturnedFindings,
            r.Diagnosis,
            r.Treatment,
            r.ReturnedPrescription,
            r.ReferralDate,
            r.ResponseDate
        }));
    }

    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetByPatientId(int patientId)
    {
        var referrals = await _referralService.GetByPatientIdAsync(patientId);

        return Ok(referrals.Select(r => new
        {
            r.ReferralId,
            r.PatientId,
            r.ExternalDoctorId,
            ExternalDoctorName = r.ExternalDoctor?.FullName,
            ExternalDoctorSpecialization = r.ExternalDoctor?.Specialization,
            r.Reason,
            r.Notes,
            r.Status,
            r.ReturnedFindings,
            r.Diagnosis,
            r.Treatment,
            r.ReturnedPrescription,
            r.ReferralDate,
            r.ResponseDate
        }));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyReferrals()
    {
        var userId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var patient = await _patientService.GetByUserIdAsync(userId);

        if (patient == null)
            return NotFound(new { message = "Patient record not found." });

        var referrals = await _referralService.GetByPatientIdAsync(patient.PatientId);

        return Ok(referrals.Select(r => new
        {
            r.ReferralId,
            ExternalDoctorName = r.ExternalDoctor?.FullName,
            ExternalDoctorSpecialization = r.ExternalDoctor?.Specialization,
            r.Reason,
            r.Notes,
            r.Status,
            r.ReturnedFindings,
            r.Diagnosis,
            r.Treatment,
            r.ReturnedPrescription,
            r.ReferralDate,
            r.ResponseDate
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(CreateReferralDto dto)
    {
        var referral = await _referralService.CreateAsync(dto);

        if (referral == null)
            return BadRequest(new
            {
                message = "Invalid patient, inactive external doctor, or referral details."
            });

        return Ok(new
        {
            message = "Referral created successfully.",
            data = new
            {
                referral.ReferralId,
                referral.PatientId,
                referral.ExternalDoctorId,
                ExternalDoctorName = referral.ExternalDoctor?.FullName,
                referral.Reason,
                referral.Notes,
                referral.Status,
                referral.ReferralDate
            }
        });
    }

    [HttpPut("{id}/response")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> UpdateResponse(
        int id,
        UpdateReferralResponseDto dto)
    {
        var referral = await _referralService.UpdateResponseAsync(id, dto);

        if (referral == null)
            return BadRequest(new
            {
                message = "Referral not found, already completed, or response details are incomplete."
            });

        return Ok(new
        {
            message = "Referral response recorded successfully.",
            data = new
            {
                referral.ReferralId,
                referral.Status,
                referral.ReturnedFindings,
                referral.Diagnosis,
                referral.Treatment,
                referral.ReturnedPrescription,
                referral.ResponseDate
            }
        });
    }
}
