const { SlashCommandBuilder } = require('discord.js');
const Events = require('../../models/events');
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('create new event'),

  async execute(client, interaction) {
    const user = interaction.user;
    const guildId = interaction.guild.id;
    let guildData = await Guild.findOne({ guildId: interaction.guild.id });

    const eventConfig = await Events.findOne({ guildId });
    const eventChannel = eventConfig.eventChannelId;

    if (!eventConfig || !guildData.enabledSystems.welcomer || !eventChannel) {
      return interaction.reply({
        content: 'The event system is disabled or no event channel is set. Please ask an administrator to configure it.',
        ephemeral: true,
      });
    }

    try {
      if (!user.dmChannel) {
        console.log('Creating DM channel...');
        await user.createDM();
        console.log('DM channel created.');
      } else {
        console.log('DM channel already exists.');
      }

      await user.send('Please provide the title of the event i chuj ci w dup:');
    } catch (error) {
      console.error('Error creating DM channel:', error);
      await interaction.reply({
        content: 'I cannot send you a DM. Please ensure your DMs are open.',
        ephemeral: true,
      });
      return;
    }

   // const filter = (message) => message.author.id === user.id;
    const filter = () => true;
    const collector = user.dmChannel.createMessageCollector({ filter, max: 5, time: 120000 });

    let step = 0;
    let title = '';
    let description = '';
    let date = new Date();
    let savedEmojis = [];
    let length = '';

    collector.on('collect', async (message) => {
      console.log(`Collector received message: "${message.content}"`);
    
      if (step === 0) {
        title = message.content;
        console.log(`Step 0 - Title set: "${title}"`);
        step++;
        await user.send('Please provide the date of the event in the format **YYYY-MM-DDTHH:MM** (e.g., 2022-05-15T17:00):');
      } else if (step === 1) {
        const dateInput = message.content;
        const parsedDate = new Date(dateInput);
    
        if (parsedDate instanceof Date && !isNaN(parsedDate.valueOf())) {
          date = parsedDate;
          console.log(`Step 1 - Valid date received: "${date}"`);
          step++;
          await user.send('Please provide the description of the event:');
        } else {
          console.warn(`Step 1 - Invalid date format: "${dateInput}"`);
          await user.send('Provided date is not a valid date. Please provide the date of the event in the correct format **YYYY-MM-DDTHH:MM**');
        }
      } else if (step === 2) {
        description = message.content;
        console.log(`Step 2 - Description set: "${description}"`);
        step++;
        await user.send('Please provide the emojis that will be used in the reactions under event message. Please separate emojis with spaces:');
      } else if (step === 3) {
        savedEmojis = message.content.split(/\s+/);
        console.log(`Step 3 - Emojis collected: "${savedEmojis.join(', ')}"`);
        step++;
        await user.send('Please provide the length of the event in the format **HH:MM** (e.g., 01:30):');
      } else if (step === 4) {
        const lengthInput = message.content;
        const timeParts = lengthInput.split(':');
    
        if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          if (hours >= 0 && minutes >= 0 && minutes < 60) {
            length = { hours, minutes };
            console.log(`Step 4 - Length set: ${hours} hours and ${minutes} minutes`);
            collector.stop();
          } else {
            console.warn(`Step 4 - Invalid length: "${lengthInput}"`);
            await user.send('Incorrect format of the length. Please use the correct format **HH:MM**.');
          }
        } else {
          console.warn(`Step 4 - Invalid length format: "${lengthInput}"`);
          await user.send('Incorrect format of the length. Please use the correct format **HH:MM**.');
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      console.log(`Collector ended. Reason: ${reason}. Collected messages: ${collected.size}`);

      if (reason === 'time') {
        console.warn('Collector ended due to timeout.');
        await user.send('I did not receive a response in a timely manner. Please try again.');
        return;
      }

      if (!eventChannel) {
        console.error('Event channel not found.');
        await user.send('I cannot find the event channel. Please contact the administrator.');
        return;
      }

      try {
        const endDate = new Date(date);
        endDate.setHours(endDate.getHours() + length.hours);
        endDate.setMinutes(endDate.getMinutes() + length.minutes);

        const thread = await eventChannel.threads.create({
          name: title,
          message: {
            content: `The event will start: <t:${Math.floor(date.getTime() / 1000)}:F> and will last until <t:${Math.floor(endDate.getTime() / 1000)}:t>\n:watch: <t:${Math.floor(date.getTime() / 1000)}:R>\n${description}`,
          },
        });

        const threadMessage = await thread.fetchStarterMessage();
        if (threadMessage) {
          for (const emoji of savedEmojis) {
            try {
              await threadMessage.react(emoji);
              console.log(`Reaction added: "${emoji}"`);
            } catch (error) {
              console.error(`Failed to react with emoji "${emoji}":`, error);
            }
          }
        }

        await user.send(`Your event was posted in the thread: ${thread.name}`);
      } catch (error) {
        console.error('Error creating event thread:', error);
        await user.send('There was an error publishing the event. Please contact the administrator.');
      }
    });

    await interaction.reply({
      content: 'Check your DMs to add event details!',
      ephemeral: true,
    });
  },
};
