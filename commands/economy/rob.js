const { SlashCommandBuilder } = require("discord.js");
const UserEconomy = require("../../models/userEconomy");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");

const cooldowns = new Map();
const COOLDOWN_TIME = 60 * 1000 * 10; // 1 minuta w milisekundach

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Rob a user and potentially steal some money")
    .addUserOption((option) =>
      option.setName("target").setDescription("User to rob").setRequired(true)
    ),

  async execute(client, interaction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser("target");
    const currentTime = Date.now();

    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
      if (currentTime < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - currentTime) / 1000);
        return interaction.reply({
          content: `You need to wait **${timeLeft}** seconds before you can try to rob someone again.`,
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

    const targetData =
      (await UserEconomy.findOne({
        userId: targetUser.id,
        guildId: interaction.guild.id,
      })) ||
      new UserEconomy({
        userId: targetUser.id,
        guildId: interaction.guild.id,
      });

    const success = Math.random() < 0.4; // 40% szans na sukces
    let stolenAmount;

    if (success) {
      if (targetData.wallet <= 0) {
        return interaction.reply({
          content: `${targetUser.username} has no money to steal!`,
          ephemeral: true,
        });
      }

      stolenAmount = Math.floor(Math.random() * (targetData.wallet / 2)) + 1; // Random stolen amount up to half of the target's wallet
      userData.wallet += stolenAmount;
      targetData.wallet -= stolenAmount;

      await userData.save();
      await targetData.save();

      await interaction.reply(
        `You successfully robbed **${stolenAmount} ${economyData.symbol}** from ${targetUser.username}!`
      );
    } else {
      await interaction.reply(
        `You failed to rob ${targetUser.username}. Better luck next time!`
      );
    }

    // Ustawienie cooldownu
    cooldowns.set(userId, currentTime);
  },
};
