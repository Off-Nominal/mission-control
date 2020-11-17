"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRecommendCommand = void 0;
var axios = require('axios');
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
exports.handleRecommendCommand = function (arg, message) {
    var sendError = function (type, incorrectArg) {
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
    var sendRecommendation = function (slug) {
        message.channel.send(BASEURL + "/books/" + slug);
    };
    var handleCommand = function (type) {
        axios
            .get(BASEURL + "/api/recommendations?type=" + type)
            .then(function (response) { return sendRecommendation(response.data[0].slug); })
            .catch(function (err) {
            console.error(err);
            sendError(ErrorType.api);
        });
    };
    switch (arg) {
        case 'random':
            handleCommand(RecommendCommand.random);
            break;
        case 'best':
            axios;
            handleCommand(RecommendCommand.highestrated);
            break;
        case 'favourite':
            handleCommand(RecommendCommand.favourite);
            break;
        default:
            sendError(ErrorType.badCommand, arg);
    }
};
//# sourceMappingURL=recommend.js.map