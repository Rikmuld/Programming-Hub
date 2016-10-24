"use strict";
const express = require('express');
const http = require('http');
const socket = require('socket.io');
const Setup_1 = require("./server/server/Setup");
const Routes_1 = require("./server/server/Routes");
const Config_1 = require("./server/server/Config");
const app = express();
const server = http.createServer(app);
const io = socket(server);
const GOOGLE_CLIENT_ID = Config_1.Config.auth.id;
const GOOGLE_CLIENT_SECRET = Config_1.Config.auth.key;
const db = Setup_1.Setup.setupDatabase(Config_1.Config.db.address, Config_1.Config.db.port, Config_1.Config.db.db, Config_1.Config.db.user.name, Config_1.Config.db.user.password);
Setup_1.Setup.setupAuthGoogle(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
Setup_1.Setup.setupExpress(app, __dirname);
Setup_1.Setup.setupSession(app, io);
Setup_1.Setup.addAuthMiddleware(app);
Setup_1.Setup.addAsMiddleware(app, "db", db);
Routes_1.Routes.addRoutes(app, __dirname);
Routes_1.Sockets.bindHandlers(app, io);
Setup_1.Setup.startServer(server);
//# sourceMappingURL=server.js.map