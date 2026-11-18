
using System.Security.Claims;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Nurse")]
public class ManualClinicLogsController : ControllerBase
{
    private readonly IManualClinicLogService _service;

    public ManualClinicLogsController(IManualClinicLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var log = await _service.GetByIdAsync(id);

        if (log == null)
            return NotFound("Manual clinic log not found.");

        return Ok(log);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateManualClinicLogDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out int nurseUserId))
            return Unauthorized("Nurse user ID was not found in the token.");

        var log = await _service.CreateAsync(dto, nurseUserId);

        if (log == null)
            return BadRequest("Invalid patient or manual clinic log details.");

        return Ok(log);
    }
}
