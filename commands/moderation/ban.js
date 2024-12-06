const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the ban")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(client, interaction) {
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Fetch the member to ban from the guild
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: `User **${user.tag}** was not found on this server.`,
        ephemeral: true,
      });
    }

    // Check if the user can be banned
    if (!member.bannable) {
      return interaction.reply({
        content: `${mConfig.hasHigherRolePosition}`,
        ephemeral: true,
      });
    }

    // Ban the user
    await member.ban({ reason });
    await interaction.reply({
      content: `User **${user}** was banned for: \`${reason}\``,
    });
  },
};
