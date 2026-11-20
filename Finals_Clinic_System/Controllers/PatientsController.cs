
using System.Security.Claims;
using Finals_Clinic_System.DTOs.Patients;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _service;

    public PatientsController(IPatientService service)
    {
        _service = service;
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyProfile()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(value, out var userId))
            return Unauthorized();

        var patient = await _service.GetByUserIdAsync(userId);

        if (patient is null)
            return NotFound(new { message = "Student profile not found." });

        return Ok(new
        {
            patient.PatientId,
            patient.UserId,
            patient.FullName,
            patient.IsActive
        });
    }

    [HttpGet]
    [Authorize(Roles = "Nurse,Admin")]
    public async Task<IActionResult> GetAll()
    {
        var patients = await _service.GetAllAsync();

        return Ok(patients.Select(patient => new
        {
            patient.PatientId,
            patient.UserId,
            patient.FullName,
            patient.IsActive
        }));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> GetById(int id)
    {
        var patient = await _service.GetByIdAsync(id);

        if (patient is null)
            return NotFound(new { message = "Patient not found." });

        return Ok(new
        {
            patient.PatientId,
            patient.UserId,
            patient.FullName,
            patient.IsActive
        });
    }

    [HttpPost]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Create(PatientCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = result.Message,
            data = result.Data == null ? null : new
            {
                result.Data.PatientId,
                result.Data.UserId,
                result.Data.FullName,
                result.Data.IsActive
            }
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Update(
        int id,
        PatientUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data == null ? null : new
            {
                result.Data.PatientId,
                result.Data.UserId,
                result.Data.FullName,
                result.Data.IsActive
            }
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Nurse")]
    public async Task<IActionResult> Deactivate(int id)
    {
        if (!await _service.DeactivateAsync(id))
            return NotFound(new { message = "Patient not found." });

        return Ok(new
        {
            message = "Patient profile deactivated."
        });
    }
}