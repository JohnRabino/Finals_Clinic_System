using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.Models
{
    public class Doctor
    {
        [Key]
        public int DoctorId { get; set; }

        [Required]
        public string FullName { get; set; }

        [Required]
        public string Specialization { get; set; }

        public string ContactNumber { get; set; }

        public string Email { get; set; }
    }
}
