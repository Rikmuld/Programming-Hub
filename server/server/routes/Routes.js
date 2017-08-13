"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const fs = require("fs");
const mkdirp = require("mkdirp");
const Groups_1 = require("../../database/tables/Groups");
const Users_1 = require("../../database/tables/Users");
const Files_1 = require("../../database/tables/Files");
const Assignments_1 = require("../../database/tables/Assignments");
const Future_1 = require("../../functional/Future");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
const Render_1 = require("./Render");
//cleanups needed below
var Routes;
(function (Routes) {
    const INDEX = "/";
    const LOGOUT = INDEX + "logout";
    const PRIVACY = INDEX + "legal/privacy";
    const AUTH = INDEX + "auth/google";
    const AUTH_CALLBACK = AUTH + "/callback";
    const RESULTS = INDEX + "results";
    const GROUP = INDEX + "group";
    const GROUP_ANY = GROUP + "/*";
    const GROUP_USER_OVERVIEW = GROUP_ANY + "/user";
    const GROUP_USER = GROUP_USER_OVERVIEW + "/*";
    const FEEDBACK_LIST = GROUP_ANY + "/feedback";
    const FEEDBACK_LATEST = FEEDBACK_LIST + "/latest";
    const GROUP_ASSIGNMENT_OVERVIEW = GROUP_ANY + "/assignment";
    const GROUP_ASSIGNMENT = GROUP_ASSIGNMENT_OVERVIEW + "/*";
    const FILE = INDEX + "file";
    const FILE_ANY = FILE + "/*";
    const FILE_UPLOAD = GROUP + "/file-upload";
    //const SUBMIT_RESULTS = GROUP + "/sendResults"
    //const DATABASE = GROUP_ANY + "database"
    //const FILES = DATABASE + "/files"
    //const USERS = DATABASE + "/users"
    //const USER = USERS + "/*"
    //const OVERVIEW = INDEX + "overview/*"
    let storage;
    function addRoutes(app, root, fileService) {
        app.get(INDEX, index);
        app.get(LOGOUT, logout);
        app.get(PRIVACY, showPrivacy);
        app.get(RESULTS, results);
        app.get(GROUP_ASSIGNMENT_OVERVIEW, assignmentOver);
        app.get(GROUP_ASSIGNMENT, assignment);
        app.get(GROUP_USER_OVERVIEW, userOver);
        app.get(GROUP_USER, user);
        app.get(FEEDBACK_LIST, feedbackList);
        app.get(FEEDBACK_LATEST, feedbackLatest);
        app.get(GROUP_ANY, group);
        app.get(FILE_ANY, file);
        app.post(FILE_UPLOAD, fileUpload(app, root));
        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read',
                'https://www.googleapis.com/auth/userinfo.profile']
        }));
        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));
        storage = fileService;
    }
    Routes.addRoutes = addRoutes;
    function showPrivacy(req, res) {
        Render_1.Render.withUser(req, res, "privacy");
    }
    function logout(req, res) {
        req.session.destroy(function (err) {
            if (err)
                console.log(err);
            res.redirect('/');
        });
    }
    function index(req, res) {
        if (req.user)
            Groups_1.Groups.getGroups(req.user.id).then(lg => Render_1.Render.withUser(req, res, "hub", { groups: lg }), e => Render_1.Render.error(req, res, e.toString()));
        else
            Render_1.Render.withUser(req, res, "hub");
    }
    function group(req, res) {
        const data = req.url.split("/");
        const group = data[2];
        if (!req.user)
            res.redirect("/");
        else if (data.length > 3)
            res.redirect("/group/" + group);
        else
            Groups_1.Groups.getGroup(group).then(g => {
                if (g.admins.findIndex(a => a._id == req.user.id) >= 0)
                    Render_1.Render.withUser(req, res, "group/overviewAdmin", { group: g });
                else
                    Files_1.Files.forStudentInGroup(req.user.id, group).then(userFiles => Render_1.Render.withUser(req, res, "group/overview", { group: g, student: userFiles._1, files: userFiles._2 }), e => Render_1.Render.error(req, res, e.toString()));
            }, e => Render_1.Render.error(req, res, e.toString()));
    }
    function user(req, res) {
        const group = req.url.split("/")[2];
        const usr = req.url.split("/")[4];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.getGroup(group).flatMap(g => Files_1.Files.forStudentInGroup(usr, group).map(userFiles => new Tuple_1.Tuple(g, userFiles))).then(data => Render_1.Render.withUser(req, res, "group/overviews/user", { files: data._2._2, group: data._1, student: data._2._1 }), err => Render_1.Render.error(req, res, err));
    }
    function userOver(req, res) {
        const group = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.getGroup(group).then(group => Render_1.Render.withUser(req, res, "group/overviews/user", { group: group }), err => Render_1.Render.error(req, res, err));
    }
    function results(req, res) {
        if (!req.user)
            res.redirect("/");
        else
            Users_1.Users.instance.getFullUser(req.user.id).then(user => Render_1.Render.withUser(req, res, "results", { fullUser: user }), err => Render_1.Render.error(req, res, err));
    }
    function assignment(req, res) {
        const data = req.url.split("/");
        const group = data[2];
        const assignment = data[4];
        if (!req.user)
            res.redirect("/");
        else if (data.length > 5)
            res.redirect("/group/" + data[2] + "/assignment/" + assignment);
        else
            Groups_1.Groups.getGroup(group).then(group => {
                Assignments_1.Assignments.instance.exec(Files_1.Files.forAssignment(assignment)).then(ass => Render_1.Render.withUser(req, res, "group/overviews/assignment", { theAssignment: ass, group: group }), err => Render_1.Render.error(req, res, err));
            }, err => Render_1.Render.error(req, res, err));
    }
    function assignmentOver(req, res) {
        const data = req.url.split("/");
        const group = data[2];
        const assignment = data[4];
        if (!req.user)
            res.redirect("/");
        else if (data.length > 5)
            res.redirect("/group/" + data[2] + "/assignment/" + assignment);
        else
            Groups_1.Groups.getGroup(group).then(group => {
                Render_1.Render.withUser(req, res, "group/overviews/assignment", { group: group });
            }, err => Render_1.Render.error(req, res, err));
    }
    function feedbackList(req, res) {
        const group = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.instance.exec(Files_1.Files.forGroup(group)).then(group => Render_1.Render.withUser(req, res, "group/overviews/feedback", { group: group }), err => Render_1.Render.error(req, res, err));
    }
    function feedbackLatest(req, res) {
        const groupID = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else if (!req.user.admin)
            res.redirect("/group/" + groupID);
        else
            Groups_1.Groups.instance.exec(Files_1.Files.forGroup(groupID)).then(group => {
                const asses = List_1.List.apply(group.assignments);
                const files = List_1.List.concat(asses.map(a => List_1.List.apply(a.files))).toArray().filter(f => f.feedback == "");
                if (files.length == 0)
                    res.redirect("/group/" + groupID + "/feedback");
                else {
                    const firstFile = files.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
                    res.redirect("/file/" + firstFile._id);
                }
            });
    }
    function file(req, res) {
        const data = req.url.split("/");
        const file = data[2];
        if (!req.user)
            res.redirect("/");
        else if (data.length > 3)
            res.redirect("/file/" + file);
        else
            Files_1.Files.instance.exec(Files_1.Files.instance.populateAll(Files_1.Files.instance.getByID(file))).then(file => {
                Render_1.Render.withUser(req, res, "file", { file: file });
            }, e => Render_1.Render.error(req, res, e.toString()));
    }
    function fileUpload(app, root) {
        return (req, res) => {
            const busboy = req.busboy;
            const data = new Future_1.Future((res, rej) => busboy.on('field', (name, val, nameTrunc, valTrunc, enc, type) => res(val)));
            busboy.on('file', function (fieldname, file, filename) {
                data.then(assignment => {
                    const filepath = root + '/temp/' + assignment + "/" + req.user.id + "/";
                    mkdirp(filepath, (err) => {
                        if (err)
                            res.json({ success: false, error: "Could not create temporary directories" });
                        else {
                            const fstream = fs.createWriteStream(filepath + filename);
                            fstream.on('close', () => {
                                res.json({ success: true });
                            });
                            file.pipe(fstream);
                        }
                    });
                    return assignment;
                }, () => res.json({ success: false, error: "Could not receive file data" }));
            });
            req.pipe(busboy);
        };
    }
})(Routes = exports.Routes || (exports.Routes = {}));
