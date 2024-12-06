const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const UserEconomy = require("../../models/userEconomy");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("money")
    .setDescription("Admin commands to manage user economy")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Tylko administratorzy mogą używać tej komendy
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add money to a user's wallet or bank")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to give money to")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("account")
            .setDescription("Choose whether to add to wallet or bank")
            .setRequired(true)
            .addChoices(
              { name: "wallet", value: "wallet" },
              { name: "bank", value: "bank" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount to add")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a user's wallet or bank balance")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to set money for")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("account")
            .setDescription("Choose whether to set wallet or bank")
            .setRequired(true)
            .addChoices(
              { name: "wallet", value: "wallet" },
              { name: "bank", value: "bank" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount to set")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove money from a user's wallet or bank")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to remove money from")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("account")
            .setDescription("Choose whether to remove from wallet or bank")
            .setRequired(true)
            .addChoices(
              { name: "wallet", value: "wallet" },
              { name: "bank", value: "bank" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount to remove")
            .setRequired(true)
        )
    ),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const account = interaction.options.getString("account"); // wallet lub bank

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
        userId: targetUser.id,
        guildId: interaction.guild.id,
      })) ||
      new UserEconomy({
        userId: targetUser.id,
        guildId: interaction.guild.id,
      });

    if (subcommand === "add") {
      userData[account] += amount; // Dodawanie do wallet lub bank
      await userData.save();
      return interaction.reply(
        `Successfully added **${amount} ${economyData.symbol}** to ${targetUser.tag}'s ${account}`
      );
    } else if (subcommand === "set") {
      userData[account] = amount; // Ustawianie wallet lub bank
      await userData.save();
      return interaction.reply(
        `Successfully set ${targetUser.tag}'s ${account} balance to **${amount} ${economyData.symbol}**!`
      );
    } else if (subcommand === "remove") {
      userData[account] = Math.max(0, userData[account] - amount); // Usuwanie z wallet lub bank (nie można zejść poniżej 0)
      await userData.save();
      return interaction.reply(
        `Successfully removed **${amount} ${economyData.symbol}** from ${targetUser.tag}'s ${account}`
      );
    }
  },
};
