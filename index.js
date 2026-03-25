const { Client, GatewayIntentBits } = require("discord.js");
const state = require("./state");
const { startWeb } = require("./web");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

state.client = client;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ✅ Send message (dashboard calls this)
async function sendMessage(channelId, content) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return false;
    await channel.send(content);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ✅ Spam function
async function spamChannel(channelId, content) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return false;

    for (let i = 0; i < 5; i++) {
      await channel.send(content);
      await new Promise(r => setTimeout(r, 500));
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// attach to state
state.sendMessage = sendMessage;
state.spamChannel = spamChannel;

// 🌐 start dashboard
startWeb();

client.login(process.env.DISCORD_TOKEN);
