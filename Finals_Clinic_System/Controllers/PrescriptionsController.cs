
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

    public PrescriptionsController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    [HttpGet]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _prescriptionService.GetAllAsync());
    }

    [HttpGet("patient/{patientId}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetByPatientId(int patientId)
    {
        return Ok(await _prescriptionService.GetByPatientIdAsync(patientId));
    }

    [HttpPost]
    [Authorize(Roles = "Nurse,Doctor")]
    public async Task<IActionResult> Create(CreatePrescriptionDto dto)
    {
        var prescription = await _prescriptionService.CreateAsync(dto);

        if (prescription == null)
            return BadRequest("Invalid patient, consultation, or prescription details.");

        return Ok(prescription);
    }
}
