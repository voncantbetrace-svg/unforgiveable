// PUT YOUR USER ID HERE
const OWNER_ID = "1441833719722938611";

client.on("messageCreate", async (message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Only react to YOU
  if (message.author.id !== OWNER_ID) return;

  try {
    await message.react("😉"); // you can change emoji
  } catch (err) {
    console.error("Reaction failed:", err);
  }
});