using System.Security.Claims;
using Finals_Clinic_System.DTOs.Admin;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminUserService _service;

    public AdminController(IAdminUserService service)
    {
        _service = service;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("users/{id:int}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _service.GetByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User account not found." });

        return Ok(user);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateStaff(CreateStaffAccountDto dto)
    {
        var result = await _service.CreateAsync(dto);
        if (!result.Success)
        {
            if (result.Message.Contains("already registered", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = result.Message });

            return BadRequest(new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = result.Message,
            data = result.Data
        });
    }

    [HttpPut("users/{id:int}/status")]
    public async Task<IActionResult> SetUserStatus(int id, [FromQuery] bool? isActive)
    {
        if (!isActive.HasValue)
            return BadRequest(new { message = "The isActive query parameter is required." });

        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, out var adminId))
            return Unauthorized();

        var result = await _service.SetActiveAsync(id, isActive.Value, adminId);
        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = result.Message });

            return Conflict(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }
}