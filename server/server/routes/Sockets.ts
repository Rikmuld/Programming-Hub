import { Routes } from './Routes'
import { Render } from './Render'
import { TestJSON } from '../../autograder/Result'
import { Groups } from '../../database/tables/Groups'
import { Users } from '../../database/tables/Users'
import { Assignments } from '../../database/tables/Assignments'
import { MkTables } from '../../database/MkTables'
import { Future } from '../../functional/Future'
import { List } from '../../functional/List'
import { IOMap } from '../../functional/IOMap'
import { Tuple } from '../../functional/Tuple'
import { Mail } from '../../server/Mail'

import { Files } from '../../database/tables/Files'

import * as express from "express"
import * as azure from 'azure-storage'
import * as fs from 'fs'

const archiver = require('archiver')

export namespace Sockets {
    type Handler = (socket: SocketIO.Socket) => void
    type SimpleCall = () => void
    type StringCall = (data: string) => void
    type AddUsersCall = (group: string, users: string[], role: string) => void
    type UploadCall = (assignment:string, handInName: string, comments:string, partners: string[], files: string[]) => void
    type StringArrCall = (data: string[]) => void
    type GroupCall = (group: string) => void
    type CreateCourse = (name: string, start: Date, end: Date) => void
    type UpdateCourse = (course:string, name: string, start: Date, end: Date) => void
    type CreateAssignment = (group: string, name: string, type: string, due: Date, link: string) => void
    type UpdateAssignment = (assignment: string, group: string, name: string, type: string, due: Date, link: string) => void
    type FeedbackCall = (file:string, feedback: string) => void
    type FinalCall = (accept: boolean, group:string, file:string) => void
    type RemoveUserCall = (group: string, isAdmin: boolean, user: string) => void
    type UserResults = (group: string, user: string) => void

    const ON_CONNECTION = "connection"
    const ON_CREATE_COURSE = "createCourse"
    const ON_REMOVE_COURSE = "removeCourse"
    const ON_CREATE_ASSIGNMENT = "createAssignment"
    const ON_UPDATE_ASSIGNMENT = "updateAssignment"
    const ON_REMOVE_ASSIGNMENT = "removeAssignment"
    const ON_GET_USERS = "getUsers"
    const ON_ADD_USERS = "addUsers"
    const ON_UPLOAD_FILES = "uploadFiles"
    const ON_FEEDBACK = "updateFeedback"
    const ON_SET_FINAL = "manageFinal"
    const ON_REMOVE_USER = "removeUser"
    const ON_UPDATE_COURSE = "updateCourse"
    const ON_USER_RESULTS = "getUserResults"
    const ON_ASSIGNMENT_RESULTS = "getAssignmentResults"

    const RESULT_CREATE_COURSE = "courseCreated"
    const RESULT_CREATE_ASSIGNMENT = "assignmentCreated"
    const RESULT_REMOVE_COURSE = "courseRemoved"
    const RESULT_REMOVE_ASSIGNMENT = "assignmentRemoved"
    const RESULT_UPDATE_ASSIGNMENT = "assignmentUpdated"
    const RESULT_GET_USERS = "usersGot"
    const RESULT_ADD_USERS = "usersAdded"
    const RESULT_UPLOAD_FILES = "fileUplaoded"
    const RESULT_FEEDBACK = "feedbacked"
    const RESULT_FINAL = "doneFinal"
    const RESULT_UPDATE_COURSE = "courseUpdated"
    const RESULT_REMOVE_USER = "userRemoved"
    const RESULT_USER_RESULTS = "userResultsGot"
    const RESULT_ASSIGNMENT_RESULTS = "assignmentResultsGot"

    let mainRoot: string

    export function bindHandlers(app: express.Express, io: SocketIO.Server, storage: azure.FileService, root: string) {
        io.on(ON_CONNECTION, connection(app, storage))

        mainRoot = root
    }

    export function connection(app: express.Express, storage: azure.FileService): Handler {
        return socket => {
            socket.on(ON_CREATE_COURSE, createCourse(app, socket))
            socket.on(ON_REMOVE_COURSE, removeCourse(app, socket))
            socket.on(ON_UPDATE_COURSE, updateCourse(app, socket))
            socket.on(ON_CREATE_ASSIGNMENT, createAssignment(app, socket))
            socket.on(ON_REMOVE_ASSIGNMENT, removeAssignment(app, socket))
            socket.on(ON_UPDATE_ASSIGNMENT, updateAssignment(app, socket))
            socket.on(ON_GET_USERS, getUsers(app, socket))
            socket.on(ON_ADD_USERS, addUsers(app, socket))
            socket.on(ON_UPLOAD_FILES, uploadFile(app, socket, storage))
            socket.on(ON_FEEDBACK, updateFeedback(app, socket))
            socket.on(ON_SET_FINAL, manageFinal(app, socket))
            socket.on(ON_REMOVE_USER, removeUser(app, socket))
            socket.on(ON_USER_RESULTS, userResults(app, socket))
            socket.on(ON_ASSIGNMENT_RESULTS, assignmentResults(app, socket))
        }
    }
    
    export function removeUser(app: express.Express, socket: SocketIO.Socket): RemoveUserCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_REMOVE_USER, success, error && (error as any).message ? (error as any).message : error)

        return (group, isAdmin, removeUser) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.removeUser(group, removeUser, isAdmin, true).then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }


    export function createCourse(app: express.Express, socket: SocketIO.Socket): CreateCourse {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_CREATE_COURSE, success, error && (error as any).message ? (error as any).message : error)

        return (name, start, end) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.create(MkTables.mkGroup(name, start, end)).flatMap(g =>
                        Groups.instance.addUser(g._id, user.id, true, true)).then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function updateCourse(app: express.Express, socket: SocketIO.Socket): UpdateCourse {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_UPDATE_COURSE, success, error && (error as any).message ? (error as any).message : error)

        return (course, name, start, end) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.updateOne(course, g => {
                        g.name = name
                        g.start = start
                        g.end = end
                    }).then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function updateAssignment(app: express.Express, socket: SocketIO.Socket): UpdateAssignment {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_UPDATE_ASSIGNMENT, success, error && (error as any).message ? (error as any).message : error)

        return (group, ass, name, type, due, link) => {
            console.log(group, ass, name, type, due, link)
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.isAdmin(group, user.id).flatMap(isAdmin => {
                        if (isAdmin) {
                            return Assignments.instance.updateOne(ass, a => {
                                if (type == a.typ) {
                                    a.name = name
                                    a.due = due
                                    a.link = link
                                }
                            }).flatMap(a => {
                                if (a.typ == type) return Future.unit(a)
                                else return Future.reject("You cannot change the type of an assignment!")
                            })
                        } else return Future.reject("You have insufficient rights to perform this action.")
                    }).then(a => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function createAssignment(app: express.Express, socket: SocketIO.Socket): CreateAssignment {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_CREATE_ASSIGNMENT, success, error && (error as any).message ? (error as any).message : error)

        return (group, name, type, due, link) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.isAdmin(group, user.id).flatMap(isAdmin => {
                        if (isAdmin) return Groups.instance.mkAndAddAssignment(group, MkTables.mkAssignment(name, group, due, type, link))
                        else return Future.reject("You have insufficient rights to perform this action.")
                    }).then(a => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function removeCourse(app: express.Express, socket: SocketIO.Socket): StringCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_REMOVE_COURSE, success, error && (error as any).message ? (error as any).message : error)

        return (course) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.isAdmin(course, user.id).flatMap(isAdmin => {
                        if (isAdmin) return Groups.removeGroup(course)
                        else Future.reject("You have insufficient rights to perform this action.")
                    }).then(v => emitResult(true), errors => emitResult(false, errors))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    //TODO still needs an isAdmin check!!!
    export function removeAssignment(app: express.Express, socket: SocketIO.Socket): StringCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_REMOVE_ASSIGNMENT, success, error && (error as any).message ? (error as any).message : error)

        return (assignment) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Assignments.instance.removeAssignment(assignment, true).then(v => emitResult(true), errors => emitResult(false, errors))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function getUsers(app: express.Express, socket: SocketIO.Socket): StringArrCall {
        const emitResult = (users: MkTables.UserTemplate[]) => socket.emit(RESULT_GET_USERS, users)

        return (usersNot: string[]) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Users.instance.exec(Users.instance.model.find({ "_id": { $nin: usersNot } }).sort({ "name": 1, "surename": 1 }).select("-groups"), false).then(users => {
                        emitResult(users), e => console.log(e)
                    })
                }
            }
        }
    }

    export function userResults(app: express.Express, socket: SocketIO.Socket): UserResults {
        const emitResult = (html: string, user: string) => socket.emit(RESULT_USER_RESULTS, html, user)

        return (group: string, theUser: string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Files.forStudentInGroup(theUser, group).then(userFiles => Render.render(app, "group/overviews/userResults", { files: userFiles._2 }, html => emitResult(html, theUser), err => emitResult(err.message, theUser)))
                } else emitResult("You have insufficient rights to perform this action.", theUser)
            } else emitResult("The session was lost, please login again.", theUser)
        }
    }

    export function assignmentResults(app: express.Express, socket: SocketIO.Socket): UserResults {
        const emitResult = (html: string, theAssignment: string) => socket.emit(RESULT_ASSIGNMENT_RESULTS, html, theAssignment)

        return (group: string, theAssignment: string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Assignments.instance.exec(Files.forAssignment(theAssignment)).then(ass => Render.render(app, "group/overviews/assignmentResults", { theAssignment: ass }, html => emitResult(html, theAssignment), err => emitResult(err.message, theAssignment)))
                } else emitResult("You have insufficient rights to perform this action.", theAssignment)
            } else emitResult("The session was lost, please login again.", theAssignment)
        }
    }

    //send mail to students that the instructor added or updated the feedback for their submission
    export function updateFeedback(app: express.Express, socket: SocketIO.Socket): FeedbackCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_FEEDBACK, success, error && (error as any).message ? (error as any).message : error)

        return (file: string, feedback: string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user

                if (user.admin) {
                    Files.instance.updateFeedback(file, feedback).then(f => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    //TODO still needs an isAdmin check!!!
    export function addUsers(app: express.Express, socket: SocketIO.Socket): AddUsersCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_ADD_USERS, success, error)

        return (group: string, users: string[], role: string) => {
            console.log(group, users, role)

            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.addUsers(group, users, role == "admin").then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficient rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function manageFinal(app: express.Express, socket: SocketIO.Socket): FinalCall {
        const emitResult = (success: boolean, error?:string) => socket.emit(RESULT_FINAL, success, error)

        return (accept: boolean, group: string, file: string) => {
            console.log(accept, group, file)
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                Users.instance.updateOne(user.id, u => {
                    const files = u.groups.find(g => g.group == group).files
                    const fileInst = files.find(f => f.file == file)

                    if (accept) fileInst.final = true
                    else files.splice(files.indexOf(fileInst), 1)
                }).then(u => {
                    if (accept) emitResult(true)
                    else Files.instance.updateOne(file, f => {
                        const students = f.students as string[]
                        const userIndex = students.indexOf(u._id)
                        students.splice(userIndex, 1)
                    }).then(f => emitResult(true), e => emitResult(false, e))
                }, e => emitResult(false, e))
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    //flatten....
    //send mail to partners that someone submitted something for them and then can either accept and decline from course home
    //send mail to instructor that there is a new submission that needs feedback
    export function uploadFile(app: express.Express, socket: SocketIO.Socket, storage: azure.FileService): UploadCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_UPLOAD_FILES, success, error)

        return (assignment: string, handInName:string, comments: string, students: string[], files: string[]) => {
            if (socket.request.session.passport) {
                let groupId = ""
                let groupName = ""
                let instructors = []
                let assignmentName = ""

                const user = socket.request.session.passport.user
                students.push(user.id)
                const properHandin = Assignments.instance.exec(Assignments.instance.populateFiles(Assignments.instance.getByID(assignment))).flatMap(ass => Groups.instance.exec(Groups.instance.getByID(ass.group as string)).map(g => new Tuple(ass, g))).flatMap(data => {
                    groupId = data._2._id
                    groupName = data._2.name
                    instructors = data._2.admins
                    assignmentName = data._1.name

                    for (let s in students) if ((data._2.students as string[]).indexOf(s) >= 0) return Future.reject("Student: '" + s + "' is not part of the course!")
                    if (data._1.typ == "open") return Future.unit(true)
                    else {
                        for (let file of data._1.files) {
                            for (let s of students) if (((file as MkTables.FileTemplate).students as MkTables.UserTemplate[]).find(st => st._id == s)) {
                                return Future.reject("Student: '" + s + "' already handed in this file!")
                            }
                        }
                        return Future.unit(true)
                    }
                })

                const quickCreate = (success) => {
                    if (!success) emitResult(false, "We were not able to validate your hand-in!")
                    else {
                        Files.instance.create(MkTables.mkFile(assignment, handInName, students, [], comments)).flatMap(file =>
                            Users.instance.makeFinal(user.id, groupId, file._id)
                        ).then(() => emitResult(true), e => emitResult(false, e))
                    }
                }

                const upload = (success) => {
                    if (!success) emitResult(false, "We were not able to validate your hand-in!")
                    else {
                        const root = "https://atlasprogramming.file.core.windows.net/handins/"
                        const temp = mainRoot + '/temp/' + assignment + "/" + user.id + "/"
                        const zipName = user.id + "_" + handInName + ".zip"
                        let zipFail = false

                        fs.readdirSync(temp).forEach(file => {
                            if(files.indexOf(file) >=0 && file == zipName) {
                                emitResult(false, "The filename: '" + zipName + "' (userID_handInName.zip) is reserved and cannot be uploaded, please change this name.")
                                zipFail = true
                            }
                        })

                        if(!zipFail){
                            fs.readdirSync(temp).forEach(file => {
                                if(files.indexOf(file) == -1) fs.unlink(temp + file)
                            })

                            const outZip = fs.createWriteStream(temp + zipName)
                            const zip = archiver('zip', {
                                zlib: { level: 9 }
                            })

                            outZip.on('close', function() {
                                Files.instance.create(MkTables.mkFile(assignment, handInName, students, [], comments)).then(file => {
                                    const id = file._id

                                    const mailAdmin = Mail.createBasicMailList("ATLAS Hub: " + groupName, "course", instructors.map(u => u + "@gmail.com"), "New submission on '" + assignmentName + "'")
                                    
                                    if (students.length > 1) mailAdmin.html = `<p>Students: ${students.reduce((acc, next) => acc + ((acc.length > 0)? ", ":"") + next, "")} send in a submission for assignment ${assignmentName}.`
                                    else mailAdmin.html = `<p>Student ${students[0]} has send in a submission for assignment ${assignmentName}.`

                                    mailAdmin.html += `<br>You can view this submission online at: <a href="https://uct.onl/file/${id}">${handInName}</a></p><p>This is an automated message to which cannot be replied.</p>`

                                    Mail.sendMail(mailAdmin)

                                    storage.createDirectoryIfNotExists('handins', "files", (error, resu, response) => {
                                        storage.createDirectoryIfNotExists('handins', "files/" + id, (error, resu, response) => {

                                            const fileToLink = (fileName: string) => new Future<string>((res, rej) => {
                                                storage.createFileFromLocalFile("handins", "files/" + id, fileName, temp + fileName, (error, resu, response) => {
                                                    if (error) rej(error.message)
                                                    else {
                                                        fs.unlink(temp + fileName)
                                                        res(root + "files/" + id + "/" + fileName + "?" + storage.generateSharedAccessSignature("handins", "files/" + id, fileName, {
                                                            AccessPolicy: {
                                                                Permissions: "r",
                                                                Expiry: azure.date.daysFromNow(3560)
                                                            }
                                                        }))
                                                    }
                                                })
                                            }) 

                                            fileToLink(zipName).flatMap(zipLink => {
                                                return IOMap.traverse<string, string, string>(List.apply(files), IOMap.apply).run(fileToLink).flatMap(links => {
                                                    file.urls = links.toArray()
                                                    file.urls.push(zipLink)
                                                    return file.save()
                                                }).flatMap(file => Users.instance.makeFinal(user.id, groupId, file._id))
                                            }).then(() => emitResult(true), e => emitResult(false, e))
                                        })
                                    })
                                }, e => emitResult(false, e))
                            })

                            outZip.on('error', function(err) {
                                emitResult(false, "An error occurred during the archiving of the uploaded files.")
                            })

                            zip.pipe(outZip)
                            files.forEach(file => {
                                 zip.file(temp + file, { name: file })
                            })
                            zip.finalize()
                        }
                    }
                }

                if(files.length == 0) properHandin.then(quickCreate, (err) => emitResult(false, err))
                else properHandin.then(upload, (err) => emitResult(false, err))
            }
        }
    }
}