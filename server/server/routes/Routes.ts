import * as express from "express"
import * as socket from 'socket.io'
import * as passport from 'passport'
import * as fs from 'fs'
import * as azure from 'azure-storage'
import * as mkdirp from 'mkdirp'

import {Projects} from '../../autograder/Projects'
import {Groups} from '../../database/tables/Groups'
import {MkTables} from '../../database/MkTables'
import {Tables} from '../../database/Table'
import {Users} from '../../database/tables/Users'
import {Files} from '../../database/tables/Files'
import {Assignments} from '../../database/tables/Assignments'
import {Future} from '../../functional/Future'
import {IOMap} from '../../functional/IOMap'
import {List} from '../../functional/List'
import {Tuple} from '../../functional/Tuple'
import {Result, TestJSON} from '../../autograder/Result'
import {Render} from './Render'
import {Sockets} from './Sockets'
import {Config} from '../Config'

//cleanups needed below
export namespace Routes {
    export type Req = express.Request
    export type Res = express.Response

    type Route = (req: Req, res: Res) => void

    interface ResultSession extends Express.Session {
        result: {}
    }

    const INDEX = "/"
    const LOGOUT = INDEX + "auth/logout"
    const PRIVACY = INDEX + "legal/privacy"
    const AUTH = INDEX + "auth/google"
    const AUTH_CALLBACK = AUTH + "/callback"
    const RESULTS = INDEX + "results"
    const GROUP = INDEX + "group"
    const GROUP_ANY = GROUP + "/*"
    const GROUP_USER_OVERVIEW = GROUP_ANY + "/user"
    const GROUP_USER = GROUP_USER_OVERVIEW + "/*"
    const FEEDBACK_LIST = GROUP_ANY + "/feedback"
    const FEEDBACK_LATEST = FEEDBACK_LIST + "/latest"
    const GROUP_ASSIGNMENT_OVERVIEW = GROUP_ANY + "/assignment"
    const GROUP_ASSIGNMENT = GROUP_ASSIGNMENT_OVERVIEW + "/*"
    const FILE = INDEX + "file"
    const FILE_ANY = FILE + "/*"
    const FILE_UPLOAD = GROUP + "/file-upload"
    //const SUBMIT_RESULTS = GROUP + "/sendResults"
    //const DATABASE = GROUP_ANY + "database"
    //const FILES = DATABASE + "/files"
    //const USERS = DATABASE + "/users"
    //const USER = USERS + "/*"
    //const OVERVIEW = INDEX + "overview/*"

    let storage: azure.FileService

    export function addRoutes(app: express.Express, root: string, fileService: azure.FileService) {
        app.get(INDEX, index)
        app.get(LOGOUT, logout)
        app.get(PRIVACY, showPrivacy)
        app.get(RESULTS, results)
        app.get(GROUP_ASSIGNMENT_OVERVIEW, assignmentOver)
        app.get(GROUP_ASSIGNMENT, assignment)
        app.get(GROUP_USER_OVERVIEW, userOver)
        app.get(GROUP_USER, user)
        app.get(FEEDBACK_LIST, feedbackList)
        app.get(FEEDBACK_LATEST, feedbackLatest)
        app.get(GROUP_ANY, group)
        app.get(FILE_ANY, file)

        app.post(FILE_UPLOAD, fileUpload(app, root))

        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read',
                'https://www.googleapis.com/auth/userinfo.profile']
        }))

        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }))

        storage = fileService
    }

    function showPrivacy(req: Req, res: Res) {
        Render.withUser(req, res, "privacy")
    }

    function logout(req: Req, res: Res) {
        req.session.destroy(function (err) {
            if (err) console.log(err);
            res.redirect('/');
        });
    }

    function index(req: Req, res: Res) {
        if (req.user) Groups.getGroups(req.user.id).then(lg => Render.withUserCourses(req, res, "hub", lg, {}), e => Render.error(req, res, e.toString()))
        else Render.withUser(req, res, "hub")
    }

    function group(req: Req, res: Res) {
        const data = req.url.split("/")
        const group = data[2]

        if (!req.user) res.redirect("/")
        else if(data.length > 3) res.redirect("/group/" + group) 
        else Groups.getGroup(group).then(g => {
            if((g.admins as Tables.User[]).findIndex(a => a._id == req.user.id) >= 0) Render.withUser(req, res, "group/overviewAdmin", { group: g }) 
            else Files.forStudentInGroup(req.user.id, group).then(userFiles => Render.withUser(req, res, "group/overview", { group: g, student: userFiles._1, files: userFiles._2 }), e => Render.error(req, res, e.toString()))
        }, e => Render.error(req, res, e.toString()))
    }

    function user(req: Req, res: Res) {
        const group = req.url.split("/")[2]
        const usr = req.url.split("/")[4]

        if (!req.user) res.redirect("/")
        else Groups.getGroup(group).flatMap(g => Files.forStudentInGroup(usr, group).map(userFiles => new Tuple(g, userFiles))).then(data =>
            Render.withUser(req, res, "group/overviews/user", { files: data._2._2, group:data._1, student: data._2._1 }), err =>
                Render.error(req, res, err))
    }

    function userOver(req: Req, res: Res) {
        const group = req.url.split("/")[2]

        if (!req.user) res.redirect("/")
        else Groups.getGroup(group).then(group =>
            Render.withUser(req, res, "group/overviews/user", { group:group }), err =>
                Render.error(req, res, err))
    }

    function results(req: Req, res: Res) {
        if (!req.user) res.redirect("/")
        else Users.instance.getFullUser(req.user.id).then(user => Render.withUser(req, res, "results", { fullUser: user }), err => Render.error(req, res, err))
    }

    function assignment(req: Req, res: Res) {
        const data = req.url.split("/")
        const group = data[2]
        const assignment = data[4]

        if (!req.user) res.redirect("/")
        else if(data.length > 5) res.redirect("/group/" + data[2] + "/assignment/" + assignment) 
        else Groups.getGroup(group).then(group => {
            Assignments.instance.exec(Files.forAssignment(assignment)).then(ass => Render.withUser(req, res, "group/overviews/assignment", { theAssignment: ass, group: group }), err =>
                Render.error(req, res, err))
        }, err => Render.error(req, res, err))
    }

    function assignmentOver(req: Req, res: Res) {
        const data = req.url.split("/")
        const group = data[2]
        const assignment = data[4]

        if (!req.user) res.redirect("/")
        else if(data.length > 5) res.redirect("/group/" + data[2] + "/assignment/" + assignment) 
        else Groups.getGroup(group).then(group => {
            Render.withUser(req, res, "group/overviews/assignment", { group: group })
        }, err => Render.error(req, res, err))
    }

    function feedbackList(req: Req, res: Res) {
        const group = req.url.split("/")[2]

        if (!req.user) res.redirect("/")
        else Groups.instance.exec(Files.forGroup(group)).then(group =>
            Render.withUser(req, res, "group/overviews/feedback", { group: group }), err =>
                Render.error(req, res, err))
    }

    function feedbackLatest(req: Req, res: Res) {
        const groupID = req.url.split("/")[2]

        if (!req.user) res.redirect("/")
        else if(!req.user.admin) res.redirect("/group/" + groupID)
        else Groups.instance.exec(Files.forGroup(groupID)).then(group => {
            const asses = List.apply(group.assignments as MkTables.AssignmentTemplate[])
            const files = List.concat(asses.map(a => List.apply(a.files as MkTables.FileTemplate[]))).toArray().filter(f => f.feedback == "")

            if(files.length == 0) res.redirect("/group/" + groupID + "/feedback")
            else {
                const firstFile = files.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0] as any
                res.redirect("/file/" + firstFile._id)
            }
        })
    }

    function file(req: Req, res: Res) {
        const data = req.url.split("/")
        const file = data[2]

        if (!req.user) res.redirect("/")
        else if(data.length > 3) res.redirect("/file/" + file) 
        else Files.instance.exec(Files.instance.populateAll(Files.instance.getByID(file))).then(file => {
            Render.withUser(req, res, "file", { file: file })
        }, e => Render.error(req, res, e.toString()))
    }

    function fileUpload(app: express.Express, root: string): Route {
        return (req, res) => {
            const busboy = (req as any).busboy
            const data = new Future<string>((res, rej) => busboy.on('field', (name, val, nameTrunc, valTrunc, enc, type) => res(val)))

            busboy.on('file', function (fieldname, file, filename) {
                data.then(assignment => {
                    const filepath = root + '/temp/' + assignment + "/" + req.user.id + "/"
                    
                    mkdirp(filepath, (err) => {
                        if(err) res.json({success: false, error: "Could not create temporary directories"})
                        else {
                            const fstream = fs.createWriteStream(filepath + filename)

                            fstream.on('close', () => {
                                res.json({success: true})
                            })

                            file.pipe(fstream)
                        }
                    })

                    return assignment
                }, () => res.json({success: false, error: "Could not receive file data"}))
            })

            req.pipe(busboy)
        }
    }
}