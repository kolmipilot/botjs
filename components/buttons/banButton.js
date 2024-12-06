const { ButtonBuilder, ButtonStyle } = require("discord.js");
module.exports = {
  data: {
    customId: "ban",
    label: "Ban User",
    style: ButtonStyle.Danger,
  },
  async execute(interaction) {
    console.log("banButton")
    const user = interaction.message.embeds[0].description.split(": ")[1];
    const modal = require("../modals/banModal");
    await modal.execute(interaction, user);
  },
  createButton() {
    return new ButtonBuilder()
      .setCustomId(this.data.customId)
      .setLabel(this.data.label)
      .setStyle(this.data.style);
  },
};
