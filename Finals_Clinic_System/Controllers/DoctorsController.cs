using System.Security.Claims;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _service;

    public DoctorsController(IDoctorService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Student,Nurse,Admin")]
    public async Task<IActionResult> GetActiveDoctors()
    {
        return Ok(await _service.GetActiveAsync());
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Student,Nurse,Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var doctor = await _service.GetActiveByIdAsync(id);
        if (doctor == null)
            return NotFound(new { message = "Active doctor not found." });

        return Ok(doctor);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, Finals_Clinic_System.DTOs.UpdateDoctorDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message, data = result.Data });
    }

    [HttpGet("me")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetMyProfile()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, out var userId))
            return Unauthorized();

        var doctor = await _service.GetMyProfileAsync(userId);
        if (doctor == null)
            return NotFound(new { message = "Doctor profile not found or inactive." });

        return Ok(doctor);
    }
}