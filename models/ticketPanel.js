const { Schema, model } = require("mongoose");

const ticketPanelSchema = new Schema({
  panelId: { type: String, required: true },
  guildId: { type: String, required: true },
  adminRoleId: { type: String, required: true },
  archiveChannelId: { type: String, required: false },
  title: { type: String, default: "Ticket Panel" },
  description: {
    type: String,
    default: "Please select a topic to open a ticket:",
  },
  topics: [
    {
      label: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
});

module.exports = model("TicketPanel", ticketPanelSchema);
