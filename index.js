require("dotenv").config();
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { TOKEN } = process.env; // Pobierz token z pliku .env

// Tworzymy klienta Discorda
const client = new Client({
  partials: [Partials.User, Partials.Message, Partials.GuildMember, Partials.ThreadMember, Partials.Channel],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Importujemy handler komend i zdarzeń
const commandHandler = require("./handlers/commandHandler");
const eventHandler = require("./handlers/eventHandler");

client.commands.set("ustawieniawydarzenia", require("./commands/ustawieniawydarzenia"));
client.commands.set("wydarzenie", require("./commands/wydarzenie"));

// Obsługa komend
commandHandler(client);

// Obsługa eventów
eventHandler(client);

// Łączenie z Discordem
client.login(TOKEN);
