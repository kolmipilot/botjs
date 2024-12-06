const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const UserLevel = require("../../models/userLevel");
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("exp")
    .setDescription("Manage user experience points")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add experience points to a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add experience to")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of experience to add")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove experience points from a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove experience from")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of experience to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set experience points for a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to set experience for")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of experience to set")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();

    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildData || !guildData.enabledSystems.level) {
      return interaction.reply({
        content: "This system is disabled! Use `/leveling toggle enabled:`",
        ephemeral: true,
      });
    }

    let userData =
      (await UserLevel.findOne({
        userId: user.id,
        guildId: interaction.guild.id,
      })) || new UserLevel({ userId: user.id, guildId: interaction.guild.id });

    if (subcommand === "add") {
      userData.exp += amount;
      await userData.save(); // Zapisz zmiany w bazie
      await interaction.reply({
        content: `\`${amount}\` experience points have been added to ${user}`,
        ephemeral: true,
      });
    } else if (subcommand === "remove") {
      userData.exp -= amount;
      if (userData.exp < 0) userData.exp = 0; // Zapewnij, że doświadczenie nie będzie ujemne
      await userData.save(); // Zapisz zmiany w bazie
      await interaction.reply({
        content: `\`${amount}\` experience points have been removed from ${user}`,
        ephemeral: true,
      });
    } else if (subcommand === "set") {
      userData.exp = amount;
      await userData.save(); // Zapisz zmiany w bazie
      await interaction.reply({
        content: `Experience points for ${user} have been set to \`${amount}\``,
        ephemeral: true,
      });
    }
  },
};
