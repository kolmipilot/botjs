const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server")
    .addStringOption((option) =>
      option
        .setName("user-id")
        .setDescription("The ID of the user to unban")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(client, interaction) {
    const userId = interaction.options.getString("user-id");
    const reason = "No reason provided";
    let banInfo;

    try {
      banInfo = await interaction.guild.bans.fetch(userId);
    } catch (e) {
      if (e.code === 10026) {
        banInfo = null;
      } else {
        console.log(e);
      }
    }

    if (!banInfo) {
      return interaction.reply({
        content: `User <@${userId}> is not banned!`,
        ephemeral: true,
      });
    }

    await interaction.guild.bans.remove(userId, reason);
    await interaction.reply({
      content: `User <@${userId}> has been unbanned!`,
      ephemeral: true,
    });
  },
};
