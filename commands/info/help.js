const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays a list of available commands"),

  async execute(client, interaction) {
    // Pobieranie kategorii z folderów komend
    const categories = fs.readdirSync(path.join(__dirname, "../../commands"));
    const categoryOptions = categories.map((category) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      value: category,
    }));

    // Menu wyboru kategorii
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("command_category")
      .setPlaceholder("Choose a category")
      .addOptions(categoryOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Website")
        .setStyle(ButtonStyle.Link)
        .setURL("https://yolobot.xyz/"),

      new ButtonBuilder()
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/Jm4jq7qykA")
    );

    const helpEmbed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary)
      .setTitle("Help")
      .setDescription("Choose the category to see the commands list!");

    await interaction.reply({
      embeds: [helpEmbed],
      components: [row, buttonRow],
    });

    const filter = (i) =>
      i.customId === "command_category" && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const category = i.values[0];

      const commandFiles = fs
        .readdirSync(path.join(__dirname, "../../commands", category))
        .filter((file) => file.endsWith(".js"));

      const embed = new EmbedBuilder()
        .setColor(mConfig.embedColorPrimary)
        .setTitle(category.charAt(0).toUpperCase() + category.slice(1))
        .setDescription("Available commands list:")
        .setTimestamp();

      commandFiles.forEach((file) => {
        const command = require(path.join(
          __dirname,
          "../../commands",
          category,
          file
        ));
        embed.addFields({
          name: command.data.name,
          value: command.data.description,
          inline: false,
        });
      });

      await interaction.editReply({
        content: " ",
        embeds: [embed],
        ephemeral: true,
      });
    });
  },
};
