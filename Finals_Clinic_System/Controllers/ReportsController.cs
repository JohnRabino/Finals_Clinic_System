using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Nurse,Admin")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("patient-history/{patientId}")]
    public async Task<IActionResult> GetPatientHistory(int patientId)
    {
        if (patientId <= 0)
            return BadRequest(new { message = "Invalid patient ID." });

        var result = await _reportService.GetPatientHistoryAsync(patientId);

        if (result == null)
            return NotFound(new { message = "Patient not found." });

        return Ok(result);
    }

    [HttpGet("daily-schedule")]
    public async Task<IActionResult> GetDailySchedule(
        [FromQuery] DateOnly? date)
    {
        var selectedDate = date ?? DateOnly.FromDateTime(DateTime.Today);

        var result = await _reportService.GetDailyScheduleAsync(selectedDate);

        return Ok(result);
    }
}