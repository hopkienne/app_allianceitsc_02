using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTwoFieldAddBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AddedByUserId",
                schema: "chat",
                table: "ConversationMembers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AddedByUserName",
                schema: "chat",
                table: "ConversationMembers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddedByUserId",
                schema: "chat",
                table: "ConversationMembers");

            migrationBuilder.DropColumn(
                name: "AddedByUserName",
                schema: "chat",
                table: "ConversationMembers");
        }
    }
}
