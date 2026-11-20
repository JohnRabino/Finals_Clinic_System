using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateAppointmentDto
{
    public int PatientId { get; set; }

    [Range(1, int.MaxValue)]
    public int TimeSlotId { get; set; }

    [Range(1, int.MaxValue)]
    public int? DoctorId { get; set; }

    [StringLength(500)]
    public string? Reason { get; set; }
}
