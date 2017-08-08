namespace Users {
    export const rikmuld = {
        name: "rikmuld",
        password: "atlaspass"
    }
}

export namespace Config {
    export const auth = {
        id: "149489641596-1gjod03kio5biqdcaf4cs6hpgvu8nmof.apps.googleusercontent.com",
        key: "F7giEmz6HL9N2ZZ-1GVewAw7",
        callback: "localhost:3000"
    }

    export const db = {
        address: "ds129189.mlab.com",
        port: 29189,
        db: "programming_hub",
        user: Users.rikmuld
    }

    export const grader = {
        break: "\r\n",
        lang: {
            python: "python3"
        }
    }

    export const session = {
        redis: false,
        secret: "Orange duck!?"
    }

    export const storage = {
        name: "atlasprogramming",
        key: "2+lwvwe0bdHmKWVq1LeVYtKn7wixQ6fBHkU7E0S+c3xMq/obRpcZt3ndtKJLQtIAQcIMDJL6SdEgUMTh/7F2Jg=="
    }
}