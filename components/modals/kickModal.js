const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  data: {
    customId: "modal-kick",
    title: "Kick User",
  },
  async execute(interaction, user) {
    const reasonInput = new TextInputBuilder()
      .setCustomId("reasonInput")
      .setLabel("Enter a reason for kicking")
      .setStyle(TextInputStyle.Paragraph);

    const modalRow = new ActionRowBuilder().addComponents(reasonInput);
    const modal = new ModalBuilder()
      .setCustomId(`modal-kick-${user}`)
      .setTitle(this.data.title)
      .addComponents(modalRow);

    await interaction.showModal(modal);
  },
};