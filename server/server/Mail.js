"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Config_1 = require("./Config");
const Future_1 = require("../functional/Future");
const nodemailer = require('nodemailer');
var Mail;
(function (Mail) {
    let transporter;
    function initialize() {
        transporter = nodemailer.createTransport({
            host: Config_1.Config.mail.host,
            port: Config_1.Config.mail.port,
            secure: Config_1.Config.mail.secure,
            auth: Config_1.Config.auth
        });
    }
    Mail.initialize = initialize;
    function createBasicMailList(fromName, fromId, recipients, subject) {
        return {
            from: `"${fromName}" ${fromId}@uct.onl`,
            subject: subject,
            bcc: recipients,
        };
    }
    Mail.createBasicMailList = createBasicMailList;
    function sendMail(mail) {
        if (Config_1.Config.mail.active) {
            return Future_1.Future.lift(new Promise((res, rej) => {
                transporter.sendMail(mail, (err, info) => {
                    if (err)
                        rej(err);
                    else
                        res(info);
                });
            }));
        }
        else
            return Future_1.Future.reject("Sending email is not enabled!");
    }
    Mail.sendMail = sendMail;
})(Mail = exports.Mail || (exports.Mail = {}));
