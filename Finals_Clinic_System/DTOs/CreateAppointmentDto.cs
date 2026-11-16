namespace Finals_Clinic_System.DTOs;

public class CreateAppointmentDto
{
    public int PatientId { get; set; }
    public int TimeSlotId { get; set; }
    public int? DoctorId { get; set; }
    public string? Reason { get; set; }
}