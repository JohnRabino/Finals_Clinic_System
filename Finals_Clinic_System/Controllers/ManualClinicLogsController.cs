
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
        var logs = await _service.GetAllAsync();

        return Ok(logs.Select(l => new
        {
            l.ManualLogId,
            l.PatientId,
            l.PatientName,
            l.VisitDate,
            l.Complaint,
            l.Notes,
            l.EncodedByUserId,
            NurseName = l.EncodedByUser?.FullName,
            l.EncodedAt
        }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var log = await _service.GetByIdAsync(id);

        if (log == null)
            return NotFound(new { message = "Manual clinic log not found." });

        return Ok(new
        {
            log.ManualLogId,
            log.PatientId,
            log.PatientName,
            log.VisitDate,
            log.Complaint,
            log.Notes,
            log.EncodedByUserId,
            NurseName = log.EncodedByUser?.FullName,
            log.EncodedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateManualClinicLogDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out int nurseUserId))
            return Unauthorized(new { message = "Nurse user ID was not found in the token." });

        var log = await _service.CreateAsync(dto, nurseUserId);

        if (log == null)
            return BadRequest(new
            {
                message = "Invalid patient or manual clinic log details."
            });

        return Ok(new
        {
            message = "Manual clinic log created successfully.",
            data = new
            {
                log.ManualLogId,
                log.PatientId,
                log.PatientName,
                log.VisitDate,
                log.Complaint,
                log.Notes,
                log.EncodedByUserId,
                NurseName = log.EncodedByUser?.FullName,
                log.EncodedAt
            }
        });
    }
}
