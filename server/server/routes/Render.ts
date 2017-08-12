﻿import {Routes} from './Routes'
import {Groups} from '../../database/tables/Groups'
import {TestJSON} from '../../autograder/Result'

import * as express from "express"

export namespace Render {
    export type Suc = (html: string) => void
    export type Err = (err: Error) => void

    export function withUser(req: Routes.Req, res: Routes.Res, loc: string, data: {} = {}) {
        const sendData = data
        sendData['user'] = req.user

        res.render(loc, sendData)
    }

    export function error(req: Routes.Req, res: Routes.Res, err: string) {
        res.render("error", {
            user: req.user,
            error: err
        })
    }

    //export function groupDetails(req: Routes.Req, res: Routes.Res, loc: string, data: Groups.GroupDetails) {
    //    res.render(loc, {
    //        user: req.user,
    //        admin: data.admins.indexOf(req.user.id) >= 0,
    //        a_open: data.openAssignments,
    //        a_close: data.closedAssignments,
    //        a_done: data.doneAssignments,
    //        group: {
    //            id: data.id,
    //            name: data.name
    //        }
    //    })
    //}

    //export function file(req: Routes.Req, res: Routes.Res, loc: string, data: Tables.File, group: string, token: string, admin: boolean) {
    //    res.render(loc, {
    //        user: req.user,
    //        file: data,
    //        admin: admin,
    //        group: group,
    //        token: token
    //    })
    //}

    export function userResults(app: express.Express, data: {}, success: Suc, fail: Err) {
       render(app, "group/overviews/userResults", data, success, fail)
    }

    //export function upload(app: express.Express, loc: string, project:string, filename:string, success: Suc, fail: Err) {
    //    render(app, loc, {
    //        project: project, 
    //        file: filename
    //    }, success, fail)
    //}

    //export function users(app: express.Express, loc: string, data: Tables.User[], success: Suc, fail: Err) {
    //    render(app, loc, {
    //        users: data
    //    }, success, fail)
    //}

    //export function userResults(req: express.Request, res: express.Response, loc: string, files: Tables.Assignment[], group: Tables.Group, student: Tables.User) {
    //    withUser(req, res, loc, {
    //        assignments: files,
    //        group: group,
    //        student: student
    //    })
    //}

    //export function files(app: express.Express, loc: string, data: Tables.File[], success: Suc, fail: Err) {
    //    render(app, loc, {
    //        files: data
    //    }, success as Suc, fail)
    //}

    export function render(app: express.Express, loc: string, data: {}, success: Suc, fail: Err) {
       app.render(loc, data, (err, suc) => {
           if (err) fail(err)
           else success(suc)
       })
    }

    //export function results(app: express.Express, loc: string, project:string, data: TestJSON<any>[], success: Suc, fail: Err) {
    //    render(app, loc, {
    //        tests: data,
    //        project: project
    //    }, success, fail)
    //}
}