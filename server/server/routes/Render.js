"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Render;
(function (Render) {
    function withUser(req, res, loc, data = {}) {
        const sendData = data;
        sendData['user'] = req.user;
        res.render(loc, sendData);
    }
    Render.withUser = withUser;
    function error(req, res, err) {
        res.render("error", {
            user: req.user,
            error: err
        });
    }
    Render.error = error;
    function render(app, loc, data, success, fail) {
        app.render(loc, data, (err, suc) => {
            if (err)
                fail(err);
            else
                success(suc);
        });
    }
    Render.render = render;
})(Render = exports.Render || (exports.Render = {}));
