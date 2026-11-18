namespace Finals_Clinic_System.DTOs.Reports;

public class DailyScheduleDto
{
    public DateOnly Date { get; set; }
    public List<AppointmentScheduleDto> Appointments { get; set; } = new();
}

public class AppointmentScheduleDto
{
    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public int TimeSlotId { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}