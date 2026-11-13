namespace Finals_Clinic_System.DTOs.Appointments;
public class AppointmentUpdateDto
{
    public int DoctorId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly AppointmentTime { get; set; }
    public string? Reason { get; set; }
}
