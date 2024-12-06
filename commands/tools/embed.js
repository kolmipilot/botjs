const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Create a custom embed using a modal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(client, interaction) {
    const modal = new ModalBuilder()
      .setCustomId("embed-modal")
      .setTitle("Create an Embed");

    // Tytuł
    const titleInput = new TextInputBuilder()
      .setCustomId("embedTitle")
      .setLabel("Embed Title (Optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Opis
    const descriptionInput = new TextInputBuilder()
      .setCustomId("embedDescription")
      .setLabel("Embed Description (Optional)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    // Kolor
    const colorInput = new TextInputBuilder()
      .setCustomId("embedColor")
      .setLabel("Embed Color (Hex code, e.g., #FF5733)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Thumbnail URL
    const thumbnailInput = new TextInputBuilder()
      .setCustomId("embedThumbnail")
      .setLabel("Thumbnail URL (Optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Footer text
    const footerInput = new TextInputBuilder()
      .setCustomId("embedFooter")
      .setLabel("Footer Text (Optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    // Dodajemy pola do modała
    const firstRow = new ActionRowBuilder().addComponents(titleInput);
    const secondRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdRow = new ActionRowBuilder().addComponents(colorInput);
    const fourthRow = new ActionRowBuilder().addComponents(thumbnailInput);
    const fifthRow = new ActionRowBuilder().addComponents(footerInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

    await interaction.showModal(modal);
  },
};
