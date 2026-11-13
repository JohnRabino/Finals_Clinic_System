using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.Models
{
    public class MedicalRecord
    {
        [Key]
        public int RecordId { get; set; }

        public int PatientId { get; set; }

        public int DoctorId { get; set; }

        public int AppointmentId { get; set; }

        public string Diagnosis { get; set; }

        public string Treatment { get; set; }

        public string Notes { get; set; }

        public DateTime RecordDate { get; set; }
    }
}