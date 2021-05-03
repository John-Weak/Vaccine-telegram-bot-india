const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
dotenv.config();

const lowdb = require("lowdb");
const Filesync = require("lowdb/adapters/Filesync");
const fetch = require("node-fetch");
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

//db
const FILE_NAME = "db.json";
const adapter = new Filesync(FILE_NAME);
const db = lowdb(adapter);

(async function init() {
  db.defaults({ data: [] }).write();
})();
// /register 121001@18
bot.onText(/\/register (.+)/, (message, match) => {
  const chatId = message.chat.id;
  const msg = match[1].split("@");
  const pincode = msg[0];
  const age = msg[1];
  if (pincode.length == 6) {
    //TODO:check overwrite
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
    console.log(msg, "asd");
  } else {
    console.log(msg);
    bot.sendMessage(chatId, "Invalid Input");
  }
});

async function getVaccine(pincode = 121001) {
  var today = new Date();
  let date = today.toJSON().slice(0, 10);
  const nDate =
    date.slice(8, 10) + "-" + date.slice(5, 7) + "-" + date.slice(0, 4);

  const data = await fetch(
    `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${nDate}`
  )
    .then((response) => response.json())
    .then((data) => {
      //console.log(data["centers"]);
      return data["centers"];
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });

  return data;
}

async function getAvail(age = 18, data = []) {
  const found = [];
  data.forEach((center) => {
    const sessions = center.sessions;
    sessions.forEach((val) => {
      if (val.available_capacity > 0 && val.min_age_limit <= age) {
        let slots = "";
        val.slots.forEach((val) => {
          slots = slots + "\n" + val;
        });
        found.push({
          name: val.name,
          address: val.address,
          date: val.date,
          slots: slots,
          vaccine: val.vaccine,
          available_capacity: val.available_capacity,
        });
      }
    });
  });
  return found;
}

function sleep(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function vaccineTime(pincode, candidates = []) {
  const apiData = await getVaccine(pincode);
  const found = await getAvail(18, apiData);

  found.forEach((val) => {
    const msg = `DATE = ${val.date}\nAVAILABLE_CAPACITY = ${val.available_capacity}\nName = ${val.name}\nAddress = ${val.address}\nSLOT:${val.slots}\nVACCINE_INFO = ${val.vaccine}`;
    candidates.forEach((chatId) => {
      bot.sendMessage(chatId, msg);
    });
  });
}

(async () => {
  while (1) {
    const map = getMap();
    map.forEach(async (val, key) => {
      await vaccineTime(key, val);
    });
    await sleep(10000);
    console.log("No Sleep");
  }
})();
