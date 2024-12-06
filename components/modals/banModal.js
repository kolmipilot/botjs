const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: {
    customId: "modal-ban",
    title: "Ban User",
  },
  async execute(interaction, user) {
    const reasonInput = new TextInputBuilder()
      .setCustomId("reasonInput")
      .setLabel("Enter a reason for banning")
      .setStyle(TextInputStyle.Paragraph);

    const modalRow = new ActionRowBuilder().addComponents(reasonInput);
    const modal = new ModalBuilder()
      .setCustomId(`modal-ban-${user}`)
      .setTitle(this.data.title)
      .addComponents(modalRow);

    await interaction.showModal(modal);
  },
};
