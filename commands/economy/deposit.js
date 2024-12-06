const { SlashCommandBuilder } = require("discord.js");
const UserEconomy = require("../../models/userEconomy");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit money into your bank")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount to deposit")
        .setRequired(true)
    ),

  async execute(client, interaction) {
    const amountInput = interaction.options.getString("amount");

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
        userId: interaction.user.id,
        guildId: interaction.guild.id,
      })) ||
      new UserEconomy({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
      });

    let amount;

    if (amountInput.toLowerCase() === "all") {
      // Użytkownik chce wpłacić całą kasę
      amount = userData.wallet;
      if (amount <= 0) {
        return interaction.reply({
          content: "You don't have any money in your wallet to deposit",
          ephemeral: true,
        });
      }
    } else {
      // Użytkownik wprowadził kwotę do wpłaty
      amount = parseInt(amountInput);
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: "Please enter a valid amount or 'all'",
          ephemeral: true,
        });
      }

      if (userData.wallet < amount) {
        return interaction.reply({
          content: "You don't have enough money in your wallet to deposit",
          ephemeral: true,
        });
      }
    }

    // Wpłata środków
    userData.wallet -= amount;
    userData.bank += amount;
    await userData.save();

    await interaction.reply(
      `Successfully deposited **${amount} ${economyData.symbol}** into your bank!`
    );
  },
};
