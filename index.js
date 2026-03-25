const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder
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

// Cooldown map
const cooldowns = new Map();
const COOLDOWN_TIME = 3000; // 3 seconds

const COLOR_MAP = {
  red: 0xff0000,
  blue: 0x0064ff,
  green: 0x00c800,
  yellow: 0xffff00,
  purple: 0xa000ff,
  orange: 0xffa500
};

const INVITE_LINK = "https://your-discord-invite-link";

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Spam a message multiple times")
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("count").setDescription("How many times (1-20)").setMinValue(1).setMaxValue(20)
    ),

  new SlashCommandBuilder()
    .setName("sendembed")
    .setDescription("Send an embed")
    .addStringOption(opt =>
      opt.setName("title").setDescription("Title").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("color")
        .setDescription("Embed color")
        .setRequired(true)
        .addChoices(
          { name: "Red", value: "red" },
          { name: "Blue", value: "blue" },
          { name: "Green", value: "green" },
          { name: "Yellow", value: "yellow" },
          { name: "Purple", value: "purple" },
          { name: "Orange", value: "orange" }
        )
    ),

  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a message")
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
];

// Register slash commands
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered!");
  } catch (err) {
    console.error(err);
  }
})();

// Bot ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Command handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  const now = Date.now();

  // Cooldown
  const lastUsed = cooldowns.get(userId) || 0;
  if (now - lastUsed < COOLDOWN_TIME) {
    return interaction.reply({
      content: `⏱ Please wait ${(COOLDOWN_TIME - (now - lastUsed)) / 1000}s before using another command.`,
      ephemeral: true
    });
  }
  cooldowns.set(userId, now);

  // Spam command
  if (interaction.commandName === "spam") {
    const text = interaction.options.getString("message");
    const count = interaction.options.getInteger("count") || 5;

    await interaction.reply({ content: `Sending ${count} messages...`, ephemeral: true });

    for (let i = 0; i < count; i++) {
      await interaction.channel.send(text.replace(/\\n/g, "\n"));
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Send embed
  if (interaction.commandName === "sendembed") {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message.replace(/\\n/g, "\n"))
      .setColor(COLOR_MAP[color] || 0xffffff);

    await interaction.reply({ embeds: [embed] });
  }

  // Send message
  if (interaction.commandName === "sendmessage") {
    const message = interaction.options.getString("message");
    await interaction.reply({ content: message.replace(/\\n/g, "\n") });
  }
});

client.login(TOKEN);
