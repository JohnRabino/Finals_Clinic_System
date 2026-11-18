using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finals_Clinic_System.Migrations
{
    /// <inheritdoc />
    public partial class AddRefferalResponse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Diagnosis",
                table: "Referrals",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResponseDate",
                table: "Referrals",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnedFindings",
                table: "Referrals",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnedPrescription",
                table: "Referrals",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Treatment",
                table: "Referrals",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Diagnosis",
                table: "Referrals");

            migrationBuilder.DropColumn(
                name: "ResponseDate",
                table: "Referrals");

            migrationBuilder.DropColumn(
                name: "ReturnedFindings",
                table: "Referrals");

            migrationBuilder.DropColumn(
                name: "ReturnedPrescription",
                table: "Referrals");

            migrationBuilder.DropColumn(
                name: "Treatment",
                table: "Referrals");
        }
    }
}
