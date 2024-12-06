const { ButtonBuilder, ButtonStyle } = require("discord.js");
module.exports = {
  data: {
    customId: "cancel",
    label: "Cancel",
    style: ButtonStyle.Secondary,
  },
  async execute(interaction) {
    await interaction.reply({
      content: "Action canceled.",
      ephemeral: true,
    });
  },
  createButton() {
    return new ButtonBuilder()
      .setCustomId(this.data.customId)
      .setLabel(this.data.label)
      .setStyle(this.data.style);
  },
};
