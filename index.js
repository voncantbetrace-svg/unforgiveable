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

const COLOR_MAP = {
  red: 0xff0000,
  blue: 0x0064ff,
  green: 0x00c800,
  yellow: 0xffff00,
  purple: 0xa000ff,
  orange: 0xffa500
};

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
      opt
        .setName("color")
        .setDescription("Color")
        .setRequired(true)
        .addChoices(
          { name: "Red", value: "red" },
          { name: "Blue", value: "blue" },
          { name: "Green", value: "green" },
          { name: "Yellow", value: "yellow" },
          { name: "Purple", value: "purple" },
          { name: "Orange", value: "orange" }
        )
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
    const count = interaction.options.getInteger("count") || 5; // default 10
    const count = interaction.options.getInteger("count") || 10; // default 15
    const count = interaction.options.getInteger("count") || 15; // default 20

    await interaction.reply({ content: `Sending ${count} messages...`, ephemeral: true });

    const channel = interaction.channel;
    if (!channel) return;

    for (let i = 0; i < count; i++) {
      await channel.send(message.replace(/\\n/g, "\n"));
      await new Promise(r => setTimeout(r, 150)); // small delay to avoid hitting rate limits
    }
  }

  // ---------------- sendembed ----------------
  if (interaction.commandName === "sendembed") {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color");

    await interaction.reply({ content: "Embed sent.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message.replace(/\\n/g, "\n"))
      .setColor(COLOR_MAP[color] || 0xffffff);

    await interaction.followUp({ embeds: [embed] });
  }
});

client.login(TOKEN);
