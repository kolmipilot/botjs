const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Economy = require("../../models/economy");
const Guild = require("../../models/guild");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("economy")
    .setDescription("Setup economy on your server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Setup economy system!")
        .addStringOption((option) =>
          option
            .setName("symbol")
            .setDescription("economy money symbol")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable the entire economy system")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable the economy system")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    const symbol = interaction.options.getString("symbol");
    const enabled = interaction.options.getBoolean("enabled");

    let guildData =
      (await Guild.findOne({ guildId })) || new Guild({ guildId });

    if (subcommand !== "toggle" && !guildData.enabledSystems.economy) {
      return interaction.reply({
        content: "This system is disabled! Use `/economy toggle enabled:`",
        ephemeral: true,
      });
    }

    if (subcommand === "set") {
      let guildConfig = await Economy.findOne({ guildId });

      if (!guildConfig) {
        guildConfig = new Economy({
          guildId,
          symbol: symbol,
        });
        await guildConfig.save();
      } else {
        guildConfig.symbol = symbol;
        await guildConfig.save();
      }

      await interaction.reply({
        content: `economy symbol has been set to ${symbol}`,
        ephemeral: true,
      });
    } else if (subcommand === "toggle") {
      guildData.enabledSystems.economy = enabled;
      await guildData.save();

      return interaction.reply({
        content: `The economy system has been ${
          enabled ? "enabled" : "disabled"
        }`,
        ephemeral: true,
      });
    }
  },
};
