const { ButtonBuilder, ButtonStyle } = require("discord.js");
module.exports = {
  data: {
    customId: "leave-welcomer",
    label: "Leave",
    style: ButtonStyle.Danger,
  },
  async execute(interaction) {
    const modal = require("../modals/leaveWelcomerModal");
    await modal.execute(interaction);
  },
  createButton() {
    return new ButtonBuilder()
      .setCustomId(this.data.customId)
      .setLabel(this.data.label)
      .setStyle(this.data.style);
  },
};
