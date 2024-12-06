const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const UserEconomy = require("../../models/userEconomy");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check user economy balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Check the balance of a specific user")
    ),

  async execute(client, interaction) {
    const target = interaction.options.getUser("user") || interaction.user;

    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildData || !guildData.enabledSystems.economy) {
      return interaction.reply({
        content: "This system is disabled! Use `/economy toggle enabled:`",
        ephemeral: true,
      });
    }

    const economyData = await Economy.findOne({
      guildId: interaction.guild.id,
    });

    const userData =
      (await UserEconomy.findOne({
        userId: target.id,
        guildId: interaction.guild.id,
      })) ||
      new UserEconomy({ userId: target.id, guildId: interaction.guild.id });

    const balEmbed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary)
      .setTitle(`${target.username}'s Balance`)
      .addFields(
        {
          name: "Wallet",
          value: `${userData.wallet} ${economyData.symbol}`,
          inline: true,
        },
        {
          name: "Bank",
          value: `${userData.bank} ${economyData.symbol}`,
          inline: true,
        },
        {
          name: "Total",
          value: `${userData.bank + userData.wallet} ${economyData.symbol}`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [balEmbed] });
  },
};
