
using Finals_Clinic_System.DTOs.ExternalDoctors;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Nurse")]
public class ExternalDoctorsController : ControllerBase
{
    private readonly IExternalDoctorService _service;

    public ExternalDoctorsController(IExternalDoctorService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var doctors = await _service.GetAllAsync();

        return Ok(doctors.Select(d => new
        {
            d.ExternalDoctorId,
            d.FullName,
            d.Specialization,
            d.ClinicOrHospital,
            d.Address,
            d.ContactNumber,
            d.Email,
            d.IsActive
        }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var doctor = await _service.GetByIdAsync(id);

        if (doctor is null)
            return NotFound(new
            {
                message = "External doctor not found."
            });

        return Ok(new
        {
            doctor.ExternalDoctorId,
            doctor.FullName,
            doctor.Specialization,
            doctor.ClinicOrHospital,
            doctor.Address,
            doctor.ContactNumber,
            doctor.Email,
            doctor.IsActive
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(ExternalDoctorDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        var doctor = result.Data!;

        return Ok(new
        {
            message = result.Message,
            data = new
            {
                doctor.ExternalDoctorId,
                doctor.FullName,
                doctor.Specialization,
                doctor.ClinicOrHospital,
                doctor.Address,
                doctor.ContactNumber,
                doctor.Email,
                doctor.IsActive
            }
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ExternalDoctorDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        var doctor = result.Data!;

        return Ok(new
        {
            message = result.Message,
            data = new
            {
                doctor.ExternalDoctorId,
                doctor.FullName,
                doctor.Specialization,
                doctor.ClinicOrHospital,
                doctor.Address,
                doctor.ContactNumber,
                doctor.Email,
                doctor.IsActive
            }
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        if (!await _service.DeactivateAsync(id))
            return NotFound(new
            {
                message = "External doctor not found."
            });

        return Ok(new
        {
            message = "External doctor contact deactivated."
        });
    }
}
