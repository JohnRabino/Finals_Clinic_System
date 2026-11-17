
using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateClinicTimeSlotDto
{
    [Required]
    public DateOnly SlotDate { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }
}
