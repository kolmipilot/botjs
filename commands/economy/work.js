const { SlashCommandBuilder } = require("discord.js");
const UserEconomy = require("../../models/userEconomy");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");

const cooldowns = new Map(); // Tworzymy mapę do trzymania cooldownów
const COOLDOWN_TIME = 60 * 1000 * 1; // 1 minut w milisekundach

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Earn some money by working"),

  async execute(client, interaction) {
    const userId = interaction.user.id;
    const currentTime = Date.now();

    // Sprawdzenie, czy gracz jest na cooldownie
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;

      if (currentTime < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - currentTime) / 1000);
        return interaction.reply({
          content: `You need to wait **${timeLeft}** seconds before you can work again.`,
          ephemeral: true,
        });
      }
    }

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

    const earnings = Math.floor(Math.random() * 280) + 20; // Random earnings between 20 and 300
    userData.wallet += earnings;
    await userData.save();

    await interaction.reply(
      `You worked hard and earned **${earnings} ${economyData.symbol}**!`
    );

    // Ustawienie nowego cooldownu dla użytkownika
    cooldowns.set(userId, currentTime);
  },
};
