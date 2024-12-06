const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the kick")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(client, interaction) {
    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: `User **${user.tag}** was not found on this server.`,
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: `${mConfig.hasHigherRolePosition}`,
        ephemeral: true,
      });
    }

    await member.kick(reason);
    await interaction.reply({
      content: `User **${user}** was kicked for: \`${reason}\``,
    });
  },
};
