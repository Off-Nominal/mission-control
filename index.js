"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var Discord = require('discord.js');
var prefix = require('./config.json').prefix;
var recommend_1 = require("./commands/recommend");
var client = new Discord.Client();
client.once('ready', function () {
    console.log("Logged in as " + client.user.tag);
});
client.on('message', function (message) {
    if (!message.content.startsWith(prefix) || message.author.bot)
        return;
    var args = message.content.slice(prefix.length).trim().split(/ +/);
    var command = args.shift().toLowerCase();
    if (command === "recommend") {
        recommend_1.handleRecommendCommand(args[0], message);
    }
});
client.login(process.env.DISCORD_TOKEN_ID);
//# sourceMappingURL=index.js.map