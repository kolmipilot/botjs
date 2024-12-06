const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const mConfig = require("../../messageConfig.json");

const kickButton = require("../../components/buttons/kickButton");
const banButton = require("../../components/buttons/banButton");
const cancelButton = require("../../components/buttons/cancelButton");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderate")
    .setDescription("Moderate a server member")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The server member you want to moderate")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const user = interaction.options.getUser("user");
    const embed = new EmbedBuilder()
      .setTitle("Moderate Actions")
      .setDescription(`Choose an action for user: ${user}`)
      .setColor(mConfig.embedColorPrimary);

    const kick = kickButton.createButton();
    const ban = banButton.createButton();
    const cancel = cancelButton.createButton();

    const row = new ActionRowBuilder().addComponents(kick, ban, cancel);

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
