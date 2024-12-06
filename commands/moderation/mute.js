const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Puts a user in timeout for a specified duration")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to mute").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration in minutes (1-60)")
        .setRequired(true)
        .addChoices(
          { name: "1 minute", value: 1 },
          { name: "5 minutes", value: 5 },
          { name: "10 minutes", value: 10 },
          { name: "30 minutes", value: 30 },
          { name: "1 hour", value: 60 }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user");
    const duration = interaction.options.getInteger("duration");

    const member = interaction.guild.members.cache.get(user.id);

    try {
      await member.timeout(duration * 60 * 1000); // Czas w milisekundach

      const embed = new EmbedBuilder()
        .setColor(mConfig.embedColorError)
        .setTitle("User Muted")
        .setDescription(
          `<@${user.id}> has been muted for: ${duration} minute(s)`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      return interaction.reply({
        content: e.message,
        ephemeral: true,
      });
    }
  },
};
