const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const INVITE_LINK = "https://your-discord-invite-link";

// 📜 Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Send a message multiple times")
    .addStringOption(opt =>
      opt.setName("message")
         .setDescription("Type anything you want")
         .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("count")
         .setDescription("How many times to send (1-50)")
         .setRequired(false)
         .setMinValue(1)
         .setMaxValue(50)
    )
];

// 🧠 Register commands
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Commands registered");
  } catch (err) {
    console.error(err);
  }
})();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ---------------- spam ----------------
  if (interaction.commandName === "spam") {
    const message = interaction.options.getString("message");
    const count = interaction.options.getInteger("count") || 10; // default 10

    await interaction.reply({ content: `Sending ${count} messages...`, ephemeral: true });

    const channel = interaction.channel;
    if (!channel) return;

    for (let i = 0; i < count; i++) {
      await channel.send(message.replace(/\\n/g, "\n"));
      await new Promise(r => setTimeout(r, 150)); // small delay to avoid hitting rate limits
    }
  }
});

client.login(TOKEN);
