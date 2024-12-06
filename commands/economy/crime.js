const { SlashCommandBuilder } = require("discord.js");
const UserEconomy = require("../../models/userEconomy");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");

const cooldowns = new Map();
const COOLDOWN_TIME = 60 * 1000 * 5; // 1 minuta w milisekundach

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Try to commit a crime and earn money"),

  async execute(client, interaction) {
    const userId = interaction.user.id;
    const currentTime = Date.now();

    // Sprawdzenie cooldownu
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
      if (currentTime < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - currentTime) / 1000);
        return interaction.reply({
          content: `You need to wait **${timeLeft}** seconds before you can commit another crime.`,
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

    const success = Math.random() < 0.75; // 75% szans na sukces
    let earnings;

    if (success) {
      earnings = Math.floor(Math.random() * 500) + 200; // Random earnings between 200 and 700
      userData.wallet += earnings;
      await userData.save();
      await interaction.reply(
        `You successfully committed a crime and earned **${earnings} ${economyData.symbol}**!`
      );
    } else {
      await interaction.reply(`You got caught! Better luck next time.`);
    }

    // Ustawienie cooldownu
    cooldowns.set(userId, currentTime);
  },
};
