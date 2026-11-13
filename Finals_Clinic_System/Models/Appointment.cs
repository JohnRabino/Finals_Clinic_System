using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.Models
{
    public class Appointment
    {
        [Key]
        public int AppointmentId { get; set; }

        public int PatientId { get; set; }

        public int DoctorId { get; set; }

        public DateTime AppointmentDate { get; set; }

        public string AppointmentTime { get; set; }

        public string Status { get; set; }
    }
}