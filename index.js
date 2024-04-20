const { Client, GatewayIntentBits } = require("discord.js");
const moment = require("moment");
const axios = require("axios");
const currentDate = new Date();
const formattedDate = moment(currentDate).format(
  "dddd, MMMM Do YYYY, h:mm:ss a"
);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

async function sendMessage(channelId, messageContent) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error("Channel not found!");

    await channel.send(messageContent);
    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login("Discord_App_Secret");

client.on("messageCreate", async (msg) => {
  console.log(msg);
  if (msg.content === "test") {
    msg.reply(`Hello ${msg.author.username}`);
  }
  switch (msg.content) {
    case "start":
      msg.reply(`Started bot @${msg.author.username}`);
      break;
    case "clear":
      msg.delete();
      const fetched = await msg.channel.awaitMessages({ limit: 99 });
      console.log(fetched);
      msg.channel.bulkDelete(100);
      break;

    default:
      // msg.reply(`Hello ${msg.author.username}`);
      break;
  }
});

async function fetchForexData() {
  try {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: "CURRENCY_EXCHANGE_RATE",
        from_currency: "BTC",
        to_currency: "USD",
        apikey: "UYIWDEM51AC0QBPG",
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching forex data:", error);
    console.log(error.message);
    return null;
  }
}

// Function to generate forex signals
function generateForexSignals(data) {
  if (!data || !data["Realtime Currency Exchange Rate"]) {
    console.error("Invalid forex data format");
    return "Error fetching forex data";
  }

  const exchangeRate = parseFloat(
    data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
  );
  const previousRate = parseFloat(
    data["Realtime Currency Exchange Rate"]["8. Bid Price"]
  );

  // Basic signal generation: Compare current rate with previous rate
  if (exchangeRate > previousRate) {
    return "Buy signal for BTC/USD";
  } else if (exchangeRate < previousRate) {
    return "Sell signal for BTC/USD";
  } else {
    return "Hold signal for BTC/USD";
  }
}

// Schedule a cron job to fetch forex data and send signals every hour
const cron = require("node-cron");
cron.schedule("*/5 * * * *", async () => {
  const forexData = await fetchForexData();
  const signal = generateForexSignals(forexData);

  const channel = client.channels.cache.get("Channel_ID");
  if (channel) {
    channel.send(`Forex Signal: ${signal}`);
  } else {
    console.error("Channel not found.");
  }
});
