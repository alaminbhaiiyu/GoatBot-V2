const fs = require("fs");
const path = __dirname + "/global_gali.json";

// Ensure the JSON file exists
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify([])); // empty array initially
}

module.exports.config = {
  name: "gali",
  version: "1.0",
  credits: "Alamin",
  description: "Globally add/remove gali and tag with gali repeatedly",
  usage: ".gali add/remove/dao",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply, mentions, senderID } = event;

  // Load goli list
  let goliList = JSON.parse(fs.readFileSync(path));

  const subcmd = args[0];

  if (subcmd === "add") {
    const toAdd = args.slice(1).join(" ");
    if (!toAdd) return api.sendMessage("🔹 গালি দিন: .gali add <gali>", threadID, messageID);

    goliList.push(toAdd);
    fs.writeFileSync(path, JSON.stringify(goliList, null, 2));
    return api.sendMessage(`✅ গালি যুক্ত হয়েছে:\n"${toAdd}"`, threadID, messageID);
  }

  if (subcmd === "remove") {
    const toRemove = args.slice(1).join(" ");
    if (!toRemove) return api.sendMessage("🔹 কোন গালিটা রিমুভ করবেন? .gali remove <gali>", threadID, messageID);

    goliList = goliList.filter(g => g !== toRemove);
    fs.writeFileSync(path, JSON.stringify(goliList, null, 2));
    return api.sendMessage(`❌ গালি রিমুভ হয়েছে:\n"${toRemove}"`, threadID, messageID);
  }

  if (subcmd === "dao") {
    if (goliList.length === 0) return api.sendMessage("❌ কোনো গালি নেই। .gali add দিয়ে আগে গালি যুক্ত করুন।", threadID, messageID);

    let targetID, targetName;

    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      targetName = mentions[targetID];
    } else if (messageReply) {
      targetID = messageReply.senderID;
      targetName = messageReply.senderName;
    } else {
      return api.sendMessage("🔹 কাউকে @mention করুন বা রিপ্লাই দিয়ে দিন: .gali dao", threadID, messageID);
    }

    let count = 0;
    const interval = setInterval(() => {
      if (count >= goliList.length) {
        clearInterval(interval);
        return;
      }

      const msg = `${goliList[count]} @${targetName}`;
      api.sendMessage({
        body: msg,
        mentions: [{ tag: `@${targetName}`, id: targetID }],
      }, threadID);

      count++;
    }, 3000);
  }
};
