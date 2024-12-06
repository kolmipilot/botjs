const {
  ActionRowBuilder,
  MessageButton,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
  time,
  TimestampStyles,
} = require("discord.js");
const Giveaway = require("../../models/giveaway");
const Guild = require("../../models/guild");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Manage giveaways")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new giveaway")
        .addStringOption((option) =>
          option
            .setName("giveawayid")
            .setDescription("The giveaway ID")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Giveaway name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("prize")
            .setDescription("Prize for the giveaway")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("winners")
            .setDescription("Number of winners")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Duration of the giveaway (in minutes)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Send a giveaway message")
        .addStringOption((option) =>
          option
            .setName("giveawayid")
            .setDescription("The giveaway ID")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to send the giveaway message")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable the entire Giveaway system")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable the Giveaway system")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const name = interaction.options.getString("name");
    const prize = interaction.options.getString("prize");
    const winnersCount = interaction.options.getInteger("winners");
    const duration = interaction.options.getInteger("duration");
    const giveawayId = interaction.options.getString("giveawayid");
    const channel = interaction.options.getChannel("channel");

    const channelId = channel?.id || interaction.channel.id;
    const endTime = new Date(Date.now() + duration * 60000);

    const subcommand = interaction.options.getSubcommand();

    const enabled = interaction.options.getBoolean("enabled");

    let guildData =
      (await Guild.findOne({ guildId: interaction.guild.id })) || new Guild({ guildId: interaction.guild.id });

    if (subcommand !== "toggle" && !guildData.enabledSystems.giveaway) {
      return interaction.reply(
        "This system is disabled! Use `/giveaway toggle enabled:`"
      );
    }

    const giveaway = await Giveaway.findOne({
      giveawayId: giveawayId,
      guildId: interaction.guild.id,
    });
    if (subcommand !== "create" && !giveaway) {
      return interaction.reply({
        content: "Giveaway not found",
        ephemeral: true,
      });
    }
    if (subcommand !== "create" && !giveaway.isActive) {
      return interaction.reply({
        content: "This giveaway is no longer active.",
        ephemeral: true,
      });
    }

    if (subcommand === "create") {
      const giveaway = await Giveaway.findOne({
        giveawayId: giveawayId,
        guildId: interaction.guild.id,
      });
      if (giveaway) {
        return interaction.reply({
          content: `Giveaway with id \`${giveawayId}\` already exist`,
          ephemeral: true,
        });
      }

      const newGiveaway = new Giveaway({
        giveawayId: giveawayId,
        guildId: interaction.guild.id,
        name: name,
        description: `Giveaway for: ${prize}`,
        prize: prize,
        endTime: endTime,
        winnersCount: winnersCount,
        participants: [],
        isActive: true,
      });

      await newGiveaway.save();

      await interaction.reply({
        content: `Giveaway **${name}** created! Use \`/giveaway send\` to send giveaway message`,
        ephemeral: true,
      });
    } else if (subcommand === "send") {
      giveaway.channelId = channelId;
      await giveaway.save();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway-join_${giveawayId}`)
          .setLabel("Join")
          .setStyle(ButtonStyle.Success)
      );

      const relative = time(giveaway.endTime, TimestampStyles.RelativeTime);

      const embed = new EmbedBuilder()
        .setTitle(giveaway.name)
        .setDescription(giveaway.description)
        .setColor(mConfig.embedColorPrimary)
        .setTimestamp()
        .addFields(
          { name: "Hosted By", value: `${interaction.user}`, inline: true },
          { name: "Ends", value: `${relative}`, inline: true },
          { name: "Winners", value: `${giveaway.winnersCount}`, inline: true }
        );

      const giveawayChannel = client.channels.cache.get(channelId);
      await giveawayChannel.send({
        embeds: [embed],
        components: [row],
      });

      await interaction.reply({
        content: `Giveaway message has been send to ${giveawayChannel}`,
      });
    } else if (subcommand === "toggle") {
      guildData.enabledSystems.giveaway = enabled;
      await guildData.save();

      return interaction.reply(
        `The Giveaway system has been ${enabled ? "enabled" : "disabled"}`
      );
    }
  },
};
