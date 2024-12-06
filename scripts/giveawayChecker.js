const { MessageEmbed, EmbedBuilder } = require("discord.js");
const Giveaway = require("../models/giveaway");
const mConfig = require("../messageConfig.json");

async function checkGiveaways(client) {
  const activeGiveaways = await Giveaway.find({
    isActive: true,
    endTime: { $lt: new Date() },
  });

  activeGiveaways.forEach(async (giveaway) => {
    const resultChannel = client.channels.cache.get(giveaway.channelId);

    if (giveaway.participants && !giveaway.participants.length > 0) {
      return resultChannel.send({
        content: `No valid entrants in **${giveaway.name}**, so a winner could not be determined!`,
      });
    }

    if (!giveaway.isActive) return;

    const winnerIds = giveaway.participants
      .sort(() => 0.5 - Math.random())
      .slice(0, giveaway.winnersCount);
    const winners = winnerIds.map((id) => `<@${id}>`).join(", ");

    const embed = new EmbedBuilder()
      .setTitle(`Giveaway Results`)
      .addFields(
        { name: "Winners", value: winners },
        { name: "Prize", value: giveaway.prize }
      )
      .setTimestamp()
      .setColor(mConfig.embedColorSuccess);

    await resultChannel.send({ embeds: [embed] });

    giveaway.isActive = false;
    await giveaway.save();
  });
}

module.exports = { checkGiveaways };
