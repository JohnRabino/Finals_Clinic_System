namespace Finals_Clinic_System.Models;

public class ClinicTimeSlot
{
    public int TimeSlotId { get; set; }

    public DateOnly SlotDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public bool IsAvailable { get; set; } = true;

    public ICollection<Appointment> Appointments { get; set; }
        = new List<Appointment>();
}