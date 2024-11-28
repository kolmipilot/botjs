const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('create new event'),

  async execute(interaction) {
    const user = interaction.user;
    const client = interaction.client;

    // Sprawdź, czy kanał wydarzeń został ustawiony
    const eventChannelId = client.eventChannelId;
    if (!eventChannelId) {
      return interaction.reply({
        content: 'channel to create event has not been set up. Please set up a channel to create events in the bot configuration.',
        ephemeral: true,
      });
    }

    // Upewnij się, że użytkownik ma otwarty DM z botem
    if (!user.dmChannel) await user.createDM();

    // Wyślij pierwsze pytanie (tytuł wydarzenia)
    await user.send('Please provide the title of the event:');

    const filter = (message) => message.author.id === user.id;
    const collector = user.dmChannel.createMessageCollector({ filter, max: 5, time: 120000 }); // Trzy pytania, limit 2 minut

    let step = 0;
    let title = '';
    let description = '';
    let date= new Date();
    let savedEmojis = []; // Tablica na zapisanie emotek
    let length = '';
  

    collector.on('collect', async (message) => {
      if (step === 0) {
        title = message.content;
        step++;
        await user.send('Please provide the date of the event in the format **YYYY-MM-DDTHH:MM** (e.g., 2022-05-15T17:00');
      } else if (step === 1) {
        const dateInput = message.content;
        const parsedDate = new Date(dateInput);
    
        if (parsedDate instanceof Date && !isNaN(parsedDate.valueOf())) {
          date = parsedDate; // Zapisz poprawną datę
          step++;
          await user.send('Please provide the description of the event:');
        } else {
          await user.send('Provided date is not a valid date. Please provide the date of the event in the correct format **YYYY-MM-DDTHH:MM**');
        }
      } else if (step === 2) {
        description = message.content;
        step++;
        await user.send('Please provide the emojis that will be used in the reactions under event message. Please separate emojis with spaces:');
      } else if (step === 3) {
        savedEmojis = message.content.split(/\s+/);
        step++;
        await user.send('Please provide the length of the event in the format **HH:MM** (e.g., 01:30).');
      } else if (step === 4) {
        const lengthInput = message.content;
        const timeParts = lengthInput.split(':');
    
        if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          if (hours >= 0 && minutes >= 0 && minutes < 60) {
            length = { hours, minutes }; // Zapisz długość wydarzenia jako obiekt
            collector.stop();
          } else {
            await user.send('Uncorrect format of the length. Please use correct format **HH:MM**.');
          }
        } else {
          await user.send('Uncorrect format of the length. Please use correct format **HH:MM**.');
        }
      }
    });
    
    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        await user.send('I did not receive a response in a timely manner. Please try again.');
        return;
      }
    
      const eventChannel = client.channels.cache.get(eventChannelId);
      if (!eventChannel) {
        await user.send('I cannot find event channel. Please contact the administrator.');
        return;
      }
    
      try {
        // Oblicz czas zakończenia
        const endDate = new Date(date);
        endDate.setHours(endDate.getHours() + length.hours);
        endDate.setMinutes(endDate.getMinutes() + length.minutes);
    
        // Tworzenie wątku z wiadomością
        const thread = await eventChannel.threads.create({
          name: title, // Tytuł wątku
          message: {
            content: `The event will start: <t:${Math.floor(date.getTime() / 1000)}:F> and will last until <t:${Math.floor(endDate.getTime() / 1000)}:t>\n :watch: <t:${Math.floor(date.getTime() / 1000)}:R> \n ${description}`, // Treść wiadomości
          },
        });
    
        // Pobierz pierwszą wiadomość wątku i dodaj reakcje
        const threadMessage = await thread.fetchStarterMessage();
        if (threadMessage) {
          for (const emoji of savedEmojis) {
            try {
              await threadMessage.react(emoji);
            } catch (error) {
              console.error(`Could not add reactions ${emoji}:`, error);
            }
          }
        }
    
        await user.send(`Your event was posted in the thread: ${thread.name}`);
      } catch (error) {
        console.error(error);
        await user.send('There was an error publishing the event. Please contact the administrator.');
      }
    });

    // Odpowiedz w interakcji, aby zakończyć
    await interaction.reply({
      content: 'Check your DMs to add event details!',
      ephemeral: true,
    });
  },
};
