using Finals_Clinic_System.DTOs.MedicalRecords;
using Finals_Clinic_System.Services.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Clinic Staff,Doctor")]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _service;

    public MedicalRecordsController(IMedicalRecordService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var record = await _service.GetByIdAsync(id);

        return record is null
            ? NotFound(new { message = "Medical record not found." })
            : Ok(record);
    }

    [HttpGet("patient/{patientId:int}/history")]
    public async Task<IActionResult> GetPatientHistory(int patientId)
    {
        return Ok(await _service.GetPatientHistoryAsync(patientId));
    }

    [HttpPost]
    public async Task<IActionResult> Create(MedicalRecordCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Data!.RecordId },
            new
            {
                message = result.Message,
                data = result.Data
            });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        MedicalRecordUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }
}