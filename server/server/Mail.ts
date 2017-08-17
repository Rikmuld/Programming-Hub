import {Config} from './Config'
import {Future} from '../functional/Future'

const nodemailer = require('nodemailer')

export namespace Mail {
    let transporter 
    
    export interface MailOptions {
        from: string,
        to?: string[],
        subject: string,
        cc?: string[],
        bcc?: string[],
        text?: string,
        html?: string
    }

    export function initialize() {
        transporter = nodemailer.createTransport({
            host: Config.mail.host,
            port: Config.mail.port,
            secure: Config.mail.secure,
            auth: Config.auth
        })
    }

    export function createBasicMailList(fromName: string, fromId: string, recipients: string[], subject: string): MailOptions {
        return {
            from: `"${fromName}" ${fromId}@uct.onl`,
            subject: subject,
            bcc: recipients,
        }
    }

    export function sendMail(mail: MailOptions): Future<string> {
        if(Config.mail.active) {
            return Future.lift(new Promise((res, rej) => {
                transporter.sendMail(mail, (err, info) => {
                    if(err) rej(err)
                    else res(info)
                })
            }))
        } else return Future.reject("Sending email is not enabled!")
    }
}