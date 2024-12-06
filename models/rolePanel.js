const mongoose = require("mongoose");

const rolePanelSchema = new mongoose.Schema({
  panelId: { type: String, required: true },
  guildId: { type: String, required: true },
  title: { type: String, required: false },
  description: { type: String, required: false },
  roles: [
    {
      label: { type: String, required: false },
      roleId: { type: String, required: true },
      buttonStyle: { type: String, required: false },
    },
  ],
});

module.exports = mongoose.model("RolePanel", rolePanelSchema);