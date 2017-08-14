"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Groups_1 = require("../../database/tables/Groups");
var Render;
(function (Render) {
    function withUserCourses(req, res, loc, courses, data) {
        const sendData = data;
        sendData['user'] = req.user;
        sendData['courses'] = courses;
        res.render(loc, sendData);
    }
    Render.withUserCourses = withUserCourses;
    function withUser(req, res, loc, data = {}) {
        const user = req.user;
        if (user) {
            Groups_1.Groups.getGroups(user.id).then(groups => {
                withUserCourses(req, res, loc, groups, data);
            }, err => error(req, res, err));
        }
        else
            withUserCourses(req, res, loc, [], {});
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
