"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Users;
(function (Users) {
    Users.rikmuld = {
        name: "rikmuld",
        password: "atlaspass"
    };
})(Users || (Users = {}));
var Config;
(function (Config) {
    Config.auth = {
        id: "149489641596-1gjod03kio5biqdcaf4cs6hpgvu8nmof.apps.googleusercontent.com",
        key: "F7giEmz6HL9N2ZZ-1GVewAw7",
        callback: "localhost:3000"
    };
    Config.db = {
        address: "ds129189.mlab.com",
        port: 29189,
        db: "programming_hub",
        user: Users.rikmuld
    };
    Config.grader = {
        break: "\r\n",
        lang: {
            python: "python3"
        }
    };
    Config.session = {
        redis: false,
        secret: "Orange duck!?"
    };
    Config.storage = {
        name: "atlasprogramming",
        key: "2+lwvwe0bdHmKWVq1LeVYtKn7wixQ6fBHkU7E0S+c3xMq/obRpcZt3ndtKJLQtIAQcIMDJL6SdEgUMTh/7F2Jg=="
    };
})(Config = exports.Config || (exports.Config = {}));
