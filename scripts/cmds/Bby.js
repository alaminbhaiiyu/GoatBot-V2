const axios = require("axios");

const adminId = "100077745636690";
const extraAdmins = new Set();
const groupStatus = {}; // group-wise ON/OFF
const excludedUsers = new Set(); // যাদের reply করবে না

module.exports = {
  config: {
    name: "bby",
    version: "2.2.0",
    description: "Loop bot with admin filter, reply-based add/remove, and input filter",
    usage: ".bby on/off/admin add/remove/list",
    category: "gali",
    cooldown: 0
  },

  onStart: async () => {
    console.log("✅ BBY bot is live");
  },

  onChat: async ({ api, event }) => {
    const senderID = event.senderID;
    const input = event.body?.trim();
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!input) return;

    const isMainAdmin = senderID === adminId;
    const isExtraAdmin = extraAdmins.has(senderID);
    const isAdmin = isMainAdmin || isExtraAdmin;

    // Special character filter: যদি মেসেজ শুরু হয় নির্দিষ্ট সিম্বল দিয়ে
    if (/^[!"?#03+.$&-_)@_]/.test(input)) return;

    // Admin commands: .bby on/off/admin ...
    if (input.startsWith(".bby") && isAdmin) {
      if (input === ".bby on") {
        groupStatus[threadID] = true;
        return api.sendMessage("✅ BBY is ON for this group.", threadID, messageID);
      }

      if (input === ".bby off") {
        groupStatus[threadID] = false;
        return api.sendMessage("❌ BBY is OFF for this group.", threadID, messageID);
      }

      if (input === ".bby admin list") {
        const list = [...extraAdmins].map(id => `• ${id}`).join("\n") || "No extra admins.";
        return api.sendMessage(`👑 Admin List:\n• ${adminId} (Main Admin)\n${list}`, threadID, messageID);
      }

      if (input === ".bby admin add") {
        if (!event.messageReply?.senderID) {
          return api.sendMessage("⚠️ Reply to the user's message to add them as admin.", threadID, messageID);
        }
        const targetID = event.messageReply.senderID;
        extraAdmins.add(targetID);
        excludedUsers.add(targetID);
        return api.sendMessage(`✅ Added ${targetID} as admin.`, threadID, messageID);
      }

      if (input === ".bby admin remove") {
        if (!event.messageReply?.senderID) {
          return api.sendMessage("⚠️ Reply to the admin's message to remove them.", threadID, messageID);
        }
        const targetID = event.messageReply.senderID;
        extraAdmins.delete(targetID);
        excludedUsers.delete(targetID);
        return api.sendMessage(`🗑️ Removed ${targetID} from admin.`, threadID, messageID);
      }

      return;
    }

    // Bot OFF হলে কিছু করবে না
    if (!groupStatus[threadID]) return;

    // যদি sender admin বা excluded হয় → skip reply
    if (excludedUsers.has(senderID) || isAdmin) return;

    try {
      const system = encodeURIComponent("You are an introverted girl. Reply in Banglish. Keep replies short. Always use vulgar gali like khankir pola, magi, tor mayre chudi, buski, choto bai, tor mar boda");
      const prompt = encodeURIComponent(input);

      const res = await axios.get(
        `https://alit-apis.onrender.com/api/llama?system=${system}&prompt=${prompt}`,
        { timeout: 10000 }
      );

      const reply = res.data?.reply || "🤐 Bot chup hoye gelo...";
      return api.sendMessage(reply, threadID, messageID);

    } catch (err) {
      console.error("❌ API error:", err.response?.data || err.message);
      return api.sendMessage("🤐 Bot chup hoye gelo...", threadID, messageID);
    }
  }
};
