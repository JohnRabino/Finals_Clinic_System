namespace Finals_Clinic_System.Models;

public class Appointment
{
    public int AppointmentId { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int? DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public int TimeSlotId { get; set; }
    public ClinicTimeSlot TimeSlot { get; set; } = null!;

    public DateOnly AppointmentDate { get; set; }
    public TimeOnly AppointmentTime { get; set; }
    public string Status { get; set; } = "Booked";
    public string? Reason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
