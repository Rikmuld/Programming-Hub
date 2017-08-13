import {Routes} from './Routes'
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

    export function render(app: express.Express, loc: string, data: {}, success: Suc, fail: Err) {
       app.render(loc, data, (err, suc) => {
           if (err) fail(err)
           else success(suc)
       })
    }
}