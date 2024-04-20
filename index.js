const { Client, GatewayIntentBits } = require("discord.js");
const { config } = require("dotenv");
const moment = require("moment");
const axios = require("axios");
const express = require("express");
const currentDate = new Date();
const formattedDate = moment(currentDate).format(
  "dddd, MMMM Do YYYY, h:mm:ss a"
);
config();
const discordToken = process.env.DiscordToken;
console.log(discordToken);
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

client.login(discordToken);

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
client.on("guildMemberAdd", async (msg) => {
  console.log(msg);

  msg.reply(`Started bot @${msg.author.username}`);
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

  if (exchangeRate > previousRate) {
    return "Buy signal for BTC/USD";
  } else if (exchangeRate < previousRate) {
    return "Sell signal for BTC/USD";
  } else {
    return "Hold signal for BTC/USD";
  }
}

const cron = require("node-cron");

let app = express();

app.get("/", (req, res) => {
  cron.schedule("*/5 * * * *", async () => {
    const forexData = await fetchForexData();
    const signal = generateForexSignals(forexData);

    const channel = client.channels.cache.get("1231312858780794993");
    if (channel) {
      channel.send(`Forex Signal: ${signal}`);
    } else {
      console.error("Channel not found.");
    }
  });
  res.send({ status: true });
});

app.listen(8080, () => {
  console.log("Bot running...");
});
