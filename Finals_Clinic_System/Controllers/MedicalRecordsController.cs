using Microsoft.AspNetCore.Mvc;

namespace Finals_Clinic_System.Controllers
{
    public class MedicalRecordsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
