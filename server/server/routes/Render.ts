import {Routes} from './Routes'
import {Groups} from '../../database/tables/Groups'
import {TestJSON} from '../../autograder/Result'

import * as express from "express"

export namespace Render {
    export type Suc = (html: string) => void
    export type Err = (err: Error) => void

    export function withUserCourses(req: Routes.Req, res: Routes.Res, loc: string, courses: {}, data: {}) {
        const sendData = data
        sendData['user'] = req.user
        sendData['courses'] = courses

        res.render(loc, sendData)
    }

    export function withUser(req: Routes.Req, res: Routes.Res, loc: string, data: {} = {}) {
        const user = req.user

        if(user){
            Groups.getGroups(user.id).then(groups => {
                withUserCourses(req, res, loc, groups, data)
            }, err => error(req, res, err))
        } else withUserCourses(req, res, loc, [], {})
    }

    export function error(req: Routes.Req, res: Routes.Res, err: string) {
        res.render("error", {
            user: req.user,
            error: err
        })
    }

    export function render(app: express.Express, loc: string, data: {}, success: Suc, fail: Err) {
       app.render(loc, data, (err, suc) => {
           if (err) fail(err)
           else success(suc)
       })
    }
}