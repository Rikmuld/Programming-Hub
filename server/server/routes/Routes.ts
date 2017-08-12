﻿import * as express from "express"
import * as socket from 'socket.io'
import * as passport from 'passport'
import * as fs from 'fs'
import * as azure from 'azure-storage'
import * as mkdirp from 'mkdirp'

import {Projects} from '../../autograder/Projects'
import {Groups} from '../../database/tables/Groups'
import {MkTables} from '../../database/MkTables'
import {Users} from '../../database/tables/Users'
import {Files} from '../../database/tables/Files'
import {Assignments} from '../../database/tables/Assignments'
import {Future} from '../../functional/Future'
import {IOMap} from '../../functional/IOMap'
import {List} from '../../functional/List'
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
    const LOGOUT = INDEX + "logout"
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
    const GROUP_ASSIGNMENT = GROUP_ANY + "/assignment/*"
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
        if (req.user) Groups.getGroups(req.user.id).then(lg => Render.withUser(req, res, "hub", { groups: lg }), e => Render.error(req, res, e.toString()))
        else Render.withUser(req, res, "hub")
    }

    function group(req: Req, res: Res) {
        const data = req.url.split("/")
        const group = data[2]

        if (!req.user) res.redirect("/")
        else if(data.length > 3) res.redirect("/group/" + group) 
        else Groups.getGroup(group).then(g => {
            Files.forStudentInGroup(req.user.id, group).then(user => Render.withUser(req, res, "group/overview", { group: g, fullUser: user }),
                e => Render.error(req, res, e.toString()))
        }, e => Render.error(req, res, e.toString()))
    }

    function user(req: Req, res: Res) {
        const group = req.url.split("/")[2]
        const usr = req.url.split("/")[4]

        if (!req.user) res.redirect("/")
        else Groups.getGroup(group).flatMap(g => Files.forStudentInGroup2(usr, group).map(f => [g, f])).then(data =>
            Render.withUser(req, res, "group/overviews/user", { files: data[1][0], group:data[0], student: data[1][1] }), err =>
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
        const assignment = data[4]

        if (!req.user) res.redirect("/")
        else if(data.length > 5) res.redirect("/group/" + data[2] + "/assignment/" + assignment) 
        else Assignments.instance.exec(Files.forAssignment(assignment)).then(ass =>
            Render.withUser(req, res, "group/overviews/assignment", { assignment: ass, group: ass.group }), err =>
                Render.error(req, res, err))
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

    //function users(req: Req, res: Res) {
    //    const group = req.url.split("/")[2]
    //    Groups.instance.populateStudents(group, g => {
    //        const students = g.students as any as Tables.User[]
    //        const admins = g.admins

    //        if (admins.indexOf(req.user.id) >= 0) Render.withUser(req, res, "users", { users: students })
    //        else Render.error(req, res, "You have insufficient rights to view this page")
    //    }, error => Render.error(req, res, error))
    //}

    //function files(req: Req, res: Res) {
    //    const group = req.url.split("/")[2]
    //    Files.getAllForGroup(group, g => {
    //        Render.withUser(req, res, "files", { group: g })
    //    }, e => Render.error(req, res, e))
    //}

    //function showResults(location: string, user_index:number, group_index:number): (Req, Res) => void {
    //    return (req: Req, res: Res) => {
    //        const user = req.url.split("/")[user_index]
    //        const group = req.url.split("/")[group_index]

    //        Files.getForStudent(user, group, g => {
    //            const asses = g.assignments as any as Tables.Assignment[]
    //            Users.instance.getByID(user, student => {
    //                Render.userResults(req, res, location, asses, g, student)
    //            }, e => Render.error(req, res, e))
    //        }, e => Render.error(req, res, e))
    //    }
    //}

    //function showResult(req: Req, res: Res) {
    //    const data = req.url.split("/")

    //    const group = data[2]
    //    const assignment = data[3]

    //    if (!req.user) res.redirect("/")
    //    else Files.instance.getDeepAssignment(req.user.id, assignment, f => {
    //        let ext = f.extension
    //        let token = azureStorage.generateSharedAccessSignature("handins", "projects/" + group + "/" + req.user.id, (f.assignment as any).project.id + "." + (typeof ext == "undefined" ? ".py" : ext), { AccessPolicy: { Permissions: "r", Expiry: azure.date.minutesFromNow(10) } })

    //        Render.file(req, res, "file", f, group, token, false)
    //    }, e => res.send(e))
    //}

    //function showResultOf(req: Req, res: Res) {
    //    const data = req.url.split("/")

    //    const group = data[2]
    //    const assignment = data[3]
    //    const user = data[4]

    //    //check if req.user == admin for the group (not not possible though..., change design)
    //    Files.instance.getDeepAssignment(user, assignment, f => {
    //        let ext = f.extension
    //        let token = azureStorage.generateSharedAccessSignature("handins", "projects/" + group + "/" + user, (f.assignment as any).project.id + "." + (typeof ext == "undefined" ? ".py" : ext), { AccessPolicy: { Permissions: "r", Expiry: azure.date.minutesFromNow(10) } })

    //        Render.file(req, res, "file", f, group, token, true)
    //    }, e => res.send(e))
    //}

    //function submitResults(req: Req, res: Res) {
    //    const data = req.body
    //    const date = new Date()
    //    date.setHours(date.getHours() - 1)

    //    //show error on hand in page not res.send new page
    //    Groups.instance.getAndPopulate({ _id: data.group }, true, true, g => {
    //        let group = g[0]
    //        let assignment = group.assignments.find(a => a._id == data.assignment)

    //        if (assignment && assignment.project._id == data.project) {
    //            if (assignment.due > date) {
                    
    //                let students: List<Tables.UserTemplate> = List.apply([])

    //                group.students.forEach(s => {
    //                    let ref = data[s._id]
    //                    if (ref) students = students.add(s)
    //                })

    //                let studentIDs = students.map(s => s._id).toArray()

    //                const handedIn = (s: Tables.UserTemplate) => new Future<boolean>((res, rej) => {
    //                    Files.instance.getAssignment(s._id, assignment._id, f => res(f.final), rej => res(false))
    //                })

    //                const traverse = IOMap.traverse(students, IOMap.apply)
    //                const someoneHandedIn = IOMap.ListHelper.foldLeft(traverse, (b, bi: boolean) => b || bi, false).run(handedIn)
    //                someoneHandedIn.then(nogo => {
    //                    if (nogo) res.send("This assignment was alreaday handed in by you or your parnters!")
    //                    else {
    //                        function handleGrading() {
    //                            const sess = req.session as ResultSession

    //                            if (sess.result && sess.result[data.project]) {
    //                                upload(sess.result[data.project], "py")
    //                            } else res.send("No result found for assignment: " + assignment.project.name)
    //                        }

    //                        function handleFiles() {
    //                            upload([], data.extension)
    //                        }

    //                        function upload(result: TestJSON<any>[], extension:string) {
    //                            const time = new Date()
    //                            const dir = "projects"
    //                            const pending = "https://atlasprogramming.file.core.windows.net/handins/pending/" + req.user.id + "/" + data.project + "." + extension

    //                            azureStorage.createDirectoryIfNotExists('handins', dir, (error, resu, response) => {
    //                                const dir2 = dir + "/" + data.group

    //                                azureStorage.createDirectoryIfNotExists('handins', dir2, (error, resu, response) => {
    //                                    students.toArray().forEach((s, i) => {
    //                                        let file = Tables.mkFile(s._id, assignment._id, time, studentIDs, result, s._id == req.user.id, extension, data[s._id])
    //                                        Files.instance.create(file, () => {
    //                                            azureStorage.createDirectoryIfNotExists('handins', dir2 + "/" + s._id, (error, resu, response) => {
    //                                                azureStorage.startCopyFile(pending, "handins", dir2 + "/" + s._id, data.project + "." + extension, (error, resu, response) => {
    //                                                    if (s._id == req.user.id) res.redirect("/results/" + group._id + "/" + assignment._id)
    //                                                    if (i == students.length() - 1) {
    //                                                        azureStorage.deleteFile("handins", "pending" + "/" + req.user.id, data.project + "." + extension, (e, r) => {
    //                                                            if (e) console.log(e)
    //                                                        })
    //                                                    }
    //                                                })
    //                                            })
    //                                        }, Table.error)
    //                                    })
    //                                })
    //                            })
    //                        }

    //                        let type = data.projectType

    //                        switch (type) {
    //                            case "auto_code":
    //                                handleGrading()
    //                                break
    //                            case "files":
    //                                handleFiles()
    //                                break
    //                            default:
    //                                res.send("No handler available for project with type: " + type)
    //                                break
    //                        }
    //                    }
    //                }, r => res.send("Unexpected error during validation of hand-in request!"))
    //            } else res.send("The deadline has passed!")
    //        } else res.send("Illigal assignment!")
    //    }, Table.error)
    //}

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

    // used to be in file uplaod
    //  function upload(assignment: string, success: () => void) {
    //     storage.createDirectoryIfNotExists('handins', "pending", (error, result, response) => {
    //         storage.createDirectoryIfNotExists('handins', "pending" + "/" + req.user.id, (error, result, response) => {
    //             storage.createDirectoryIfNotExists('handins', "pending" + "/" + req.user.id + "/" + assignment, (error, result, response) => {
    //                 storage.createFileFromLocalFile('handins', "pending" + "/" + req.user.id + "/" + assignment, filename, filepath, (error, result, response) => {
    //                     if (error) res.json({ success: false, err: error.message })
    //                     else success()
    //                     fs.unlink(filepath)
    //                 })
    //             })
    //         })
    //     })
    // }
}