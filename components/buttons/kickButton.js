const { ButtonBuilder, ButtonStyle } = require("discord.js");
module.exports = {
  data: {
    customId: "kick",
    label: "Kick User",
    style: ButtonStyle.Danger,
  },
  async execute(interaction) {
    const user = interaction.message.embeds[0].description.split(": ")[1];
    const modal = require("../modals/kickModal");
    await modal.execute(interaction, user);
  },
  createButton() {
    return new ButtonBuilder()
      .setCustomId(this.data.customId)
      .setLabel(this.data.label)
      .setStyle(this.data.style);
  },
};
