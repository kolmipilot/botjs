const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Deletes a specified number of messages")
    .addIntegerOption(
      (option) =>
        option
          .setName("amount")
          .setDescription("Number of messages to delete")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100) // You can adjust the maximum value
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(client, interaction) {
    const amount = interaction.options.getInteger("amount");

    try {
      const fetched = await interaction.channel.messages.fetch({
        limit: amount,
      });

      const filtered = fetched.filter((message) => {
        return Date.now() - message.createdTimestamp < 14 * 24 * 60 * 60 * 1000;
      });

      if (filtered.size === 0) {
        return interaction.reply({
          content:
            "There are no messages to delete that are under 14 days old.",
          ephemeral: true,
        });
      }

      await interaction.channel.bulkDelete(filtered);

      return interaction.reply({
        content: `Successfully deleted **${filtered.size}** messages.`,
        ephemeral: true,
      });
    } catch (e) {
      return interaction.reply({
        content: e.message,
        ephemeral: true,
      });
    }
  },
};
