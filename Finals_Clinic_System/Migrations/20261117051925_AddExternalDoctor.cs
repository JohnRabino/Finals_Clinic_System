using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finals_Clinic_System.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalDoctor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Patients",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "DoctorId",
                table: "Appointments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateTable(
                name: "ExternalDoctors",
                columns: table => new
                {
                    ExternalDoctorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Specialization = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClinicOrHospital = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalDoctors", x => x.ExternalDoctorId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Patients_UserId",
                table: "Patients",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Patients_Users_UserId",
                table: "Patients",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Patients_Users_UserId",
                table: "Patients");

            migrationBuilder.DropTable(
                name: "ExternalDoctors");

            migrationBuilder.DropIndex(
                name: "IX_Patients_UserId",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Patients");

            migrationBuilder.AlterColumn<int>(
                name: "DoctorId",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
