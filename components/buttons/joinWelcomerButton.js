const { ButtonBuilder, ButtonStyle } = require("discord.js");
module.exports = {
  data: {
    customId: "join-welcomer",
    label: "Join",
    style: ButtonStyle.Success,
  },
  async execute(interaction) {
    const modal = require("../modals/joinWelcomerModal");
    await modal.execute(interaction);
  },
  createButton() {
    return new ButtonBuilder()
      .setCustomId(this.data.customId)
      .setLabel(this.data.label)
      .setStyle(this.data.style);
  },
};
