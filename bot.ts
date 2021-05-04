import { getAvail, getVaccine } from "./utils/api";
import { sleep } from "./utils/helper";

import dotenv from "dotenv";
dotenv.config();
//db
import lowdb from "lowdb";
import Filesync from "lowdb/adapters/FileSync";
//bot
import TelegramBot from "node-telegram-bot-api";
//ENV PARAM
const token = process.env.TOKEN;
if (!token) {
  console.log("NO TOKEN");
  process.exit();
}
const sleepTime = +(process.env.SLEEP || 10000);
const bot = new TelegramBot(token, { polling: true });

/* -------------------------------- DataBase -------------------------------- */

const FILE_NAME = "db.json";
const adapter = new Filesync<Schema>(FILE_NAME);
const db = lowdb(adapter);
(async function init() {
  db.defaults({ data: [] }).write();
})();

/* ---------------------------- helper functions ---------------------------- */
function isRegistered(Id: number) {
  if (db.get("data").find({ chatId: Id }).value() != undefined) return true;
  else return false;
}

function getMap() {
  //map of pincode and chatIds
  let map = new Map();
  const json = db.get("data").value();
  json.forEach((val) => {
    if (!map.has(val.pincode)) {
      map.set(val.pincode, []);
    }
    const good = map.get(val.pincode);
    good.push(val.chatId);
    map.set(val.pincode, good);
  });
  return map;
}

async function vaccineTime(pincode: string, candidates = []) {
  const apiData = await getVaccine(pincode);
  if (!apiData) return;
  const found = await getAvail(18, apiData);
  found.forEach((val) => {
    const msg = `DATE = ${val.date}\nAVAILABLE_CAPACITY = ${val.available_capacity}\nName = ${val.name}\nAddress = ${val.address}\nSLOT:${val.slots}\nVACCINE_INFO = ${val.vaccine}\nFee = ${val.fee}`;
    candidates.forEach((chatId) => {
      bot.sendMessage(chatId, msg);
    });
  });
}

/* ------------------------------ bot functions ----------------------------- */
bot.onText(/\/start/, (msg, _match) => {
  const chatId = msg.chat.id;
  if (isRegistered(chatId) == true) {
    bot.sendMessage(chatId, "Welcome back");
  }
  bot.sendMessage(
    chatId,
    "Anti-Covid-Telegram Bot\n\nTo register use:\n\n/register Pincode@Age \nExample: Pincode is 110059 & Age is 21 \nthen command:\n /register 110059@21\n\nTo Unregister Use\n/unregister "
  );
});

bot.onText(/\/ping/, (msg, _match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Anti-Covid Bot is Working");
});

bot.onText(/\/register (.+)/, (message, match) => {
  const chatId = message.chat.id;
  if (!match) {
    bot.sendMessage(chatId, "Send Correct Input");
    return;
  }
  const msg = match[1].split("@");
  const pincode = msg[0];
  const age = msg[1];
  if (isRegistered(chatId) == false) {
    if (pincode.length == 6) {
      db.get("data")
        .push({
          user: message.chat.username,
          firstName: message.chat.first_name,
          lastname: message.chat.last_name,
          chatId: chatId,
          pincode: pincode,
          age: age,
        })
        .write();
      bot.sendMessage(chatId, "Registered,You will now recieve updates");
      console.log(msg, "REGSITERED");
    } else {
      console.log(msg);
      bot.sendMessage(chatId, "Invalid Input");
    }
  } else bot.sendMessage(chatId, "Already Registered");
});

bot.onText(/\/unregister/, (msg, _match) => {
  db.get("data").remove({ chatId: msg.chat.id }).write();
  bot.sendMessage(msg.chat.id, "User Unregisterd Successfully");
});
/* -------------------------------------------------------------------------- */

(async () => {
  while (1) {
    const map = getMap();
    map.forEach(async (val, key) => {
      await vaccineTime(key, val);
    });
    await sleep(sleepTime);
    console.log("No Sleep");
  }
})();
