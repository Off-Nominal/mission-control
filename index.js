"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var Discord = require('discord.js');
var prefix = require('./config.json').prefix;
var axios = require('axios');
var client = new Discord.Client();
var BASEURL = process.env.BASEURL;
var RecommendCommand;
(function (RecommendCommand) {
    RecommendCommand["random"] = "random";
    RecommendCommand["highestrated"] = "highestrate";
    RecommendCommand["favourite"] = "favourite";
})(RecommendCommand || (RecommendCommand = {}));
var ErrorType;
(function (ErrorType) {
    ErrorType["api"] = "api";
    ErrorType["badCommand"] = "bad-command";
})(ErrorType || (ErrorType = {}));
client.once('ready', function () {
    console.log("Logged in as " + client.user.tag);
});
client.on('message', function (message) {
    if (!message.content.startsWith(prefix) || message.author.bot)
        return;
    var args = message.content.slice(prefix.length).trim().split(/ +/);
    var command = args.shift().toLowerCase();
    if (command === "recommend") {
        var sendError_1 = function (type, incorrectArg) {
            var errorMessage;
            switch (type) {
                case 'api':
                    errorMessage = 'Oh no, something seems to have gone wrong.';
                    break;
                case 'bad-command':
                    errorMessage = "That recommend type (" + incorrectArg + ") is not supported";
            }
            message.channel.send(errorMessage);
        };
        var sendRecommendation_1 = function (slug) {
            message.channel.send(BASEURL + "/books/" + slug);
        };
        var handleRecommendCommand = function (type) {
            axios
                .get(BASEURL + "/api/recommendations?type=" + type)
                .then(function (response) { return sendRecommendation_1(response.data[0].slug); })
                .catch(function (err) {
                console.error(err);
                sendError_1(ErrorType.api);
            });
        };
        switch (args[0]) {
            case 'random':
                handleRecommendCommand(RecommendCommand.random);
                break;
            case 'best':
                axios;
                handleRecommendCommand(RecommendCommand.highestrated);
                break;
            case 'favourite':
                handleRecommendCommand(RecommendCommand.favourite);
                break;
            default:
                sendError_1(ErrorType.badCommand, args[0]);
        }
    }
});
client.login(process.env.DISCORD_TOKEN_ID);
//# sourceMappingURL=index.js.map