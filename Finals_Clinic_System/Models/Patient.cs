using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.Models
{
    public class Patient
    {
        [Key]
        public int PatientId { get; set; }

        [Required]
        public string FullName { get; set; }

        public DateTime DateOfBirth { get; set; }

        public string Gender { get; set; }

        public string ContactNumber { get; set; }

        public string Address { get; set; }
    }
}
