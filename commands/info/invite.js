const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the invite link for the bot"),

  async execute(client, interaction) {
    const embed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary)
      .setTitle("Invite Me")
      .setDescription("Click the button below to invite me to your server!");

    const inviteButton = new ButtonBuilder()
      .setLabel("Invite")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot`
      );

    const row = new ActionRowBuilder().addComponents(inviteButton);

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
