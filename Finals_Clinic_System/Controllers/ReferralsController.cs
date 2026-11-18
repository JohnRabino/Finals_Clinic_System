
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Nurse")]
public class ReferralsController : ControllerBase
{
    private readonly IReferralService _referralService;

    public ReferralsController(IReferralService referralService)
    {
        _referralService = referralService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _referralService.GetAllAsync());
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatientId(int patientId)
    {
        return Ok(await _referralService.GetByPatientIdAsync(patientId));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReferralDto dto)
    {
        var referral = await _referralService.CreateAsync(dto);

        if (referral == null)
            return BadRequest("Invalid patient, external doctor, or referral details.");

        return Ok(referral);
    }

    [HttpPut("{id}/response")]
    public async Task<IActionResult> UpdateResponse(
        int id,
        UpdateReferralResponseDto dto)
    {
        var referral = await _referralService.UpdateResponseAsync(id, dto);

        if (referral == null)
            return BadRequest("Referral not found, already completed, or response details are incomplete.");

        return Ok(referral);
    }
}