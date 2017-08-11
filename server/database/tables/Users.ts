﻿import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { MkTables } from '../MkTables'
import { Groups } from './Groups'
import { Files } from './Files'
import { Future } from '../../functional/Future'
import { List } from '../../functional/List'

class User extends Table<Tables.User> {
    addToGroup(s: string, g: string, updateGroup: boolean, admin: boolean): Future<Tables.User> {
        return this.updateOne(s, (a: Tables.User) => {
            const ids = Users.groupIDs(a)
            const index = ids.toArray().indexOf(g) 
            if (index == -1) a.groups.push({ group: g, files: [], active: true })
            else if(!a.groups[index].active) {
                console.log("this must equal")
                console.log(g)
                console.log(a.groups[index].group)
                a.groups[index].active = true
            }
        }).flatMap(a => {
            if (updateGroup) return Groups.instance.addUser(g, s, admin, false).map(u => a)
            else return Future.unit(a)
        })
    }

    removeFromGroup(s: string, g: string, updateGroup: boolean, admin: boolean): Future<Tables.User> {
        return this.updateOne(s, (a: Tables.User) => {
            const ids = Users.groupIDs(a)
            const index = ids.toArray().indexOf(g.toString())
            if (index >= 0) a.groups[index].active = false

        }).flatMap(a => {
            if (updateGroup) return Groups.instance.removeUser(g, s, admin, false).map(u => a)
            else return Future.unit(a)
        })
    }

    getGroups(s: string): Future<Tables.Group[]> {
        return this.exec(this.getByID(s)).flatMap(u =>
            Groups.instance.exec(Groups.instance.getByIDs(Users.activeGroupIDs(u).toArray()).sort({ end: 1 }), false))
    }

    addFile(students: string[], group: string, file: string): Future<Tables.User[]> {
        return this.update(students, user => {
            List.apply(user.groups).filter(g => g.group == group).head(null).files.push({file:file, final:false})
        })
    }

    populateAllFiles<B>(user: Tables.User): Future<Tables.User> {
        return Future.lift(this.model.populate(user, {
            path: "groups.files.file groups.group"
        }))
    }

    getFullUser<B>(user: string): Future<Tables.User> {
        return Future.lift(this.getByID(user).populate("groups.group").populate({
            path:  "groups.files.file",
            options: {
                populate: "assignment"
            }
        }).exec())
    }

    populateGroupFiles2<B>(user: Tables.User, group: string): Future<Tables.File[]> {
        return Files.instance.exec(Files.instance.populateAssignment(Files.instance.getByIDs(user.groups.filter(g => g.group == group)[0].files.map(f => f.file as string))), false)
    }

    populateGroupFiles<B>(user: Tables.User, group: string): Future<Tables.User> {
        user.groups = [user.groups.find(g => g.group == group)]
        return this.populateAllFiles(user)
    }

    makeFinal(student:string, group: string, file: string): Future<Tables.User> {
        return this.updateOne(student, s => s.groups.find(g => g.group == group).files.find(f => f.file == file).final = true)
    }
}

export namespace Users {
    export type Query = mongoose.DocumentQuery<Tables.User[], Tables.User>
    export type QueryOne = mongoose.DocumentQuery<Tables.User, Tables.User> 
    export type QueryA<A> = mongoose.DocumentQuery<A, Tables.User> 

    export interface GoogleProfile {
        email: string,
        name: {
            familyName: string,
            givenName: string
        },
        _json: {
            domain: string
        }
    }

    export interface SimpleUser {
        id: string, 
        name: string,
        surename: string,
        admin: boolean
    }

    export const instance = new User(Tables.User)

    export function groupIDs(user: Tables.User): List<string> {
        return List.apply(user.groups).map(groupData => groupData.group as string)
    }

    export function activeGroupIDs(user: Tables.User): List<string> {
        return List.apply(user.groups).filter(g => g.active).map(groupData => groupData.group as string)
    }

    export function sortByName(query: Users.Query): Users.Query {
        return query.sort({ name: 1, surename: 1 })
    }

    export function getByGProfile(p: GoogleProfile): Future<Tables.User> {
        const id = getIDByGProfile(p)
        return instance.exec(instance.getByID(id), false).flatMap(u => returnOrCreate(id, p, u))
    }

    export function simplify(u: MkTables.UserTemplate): SimpleUser {
        return { id: u._id, name: u.name, surename: u.surename, admin: u.admin }
    }

    export function getIDByGProfile(p: GoogleProfile): string {
        return p.email.split("@")[0]
    }

    export function returnOrCreate(id: string, p: GoogleProfile, user: Tables.User): Future<Tables.User> {
        if (user) return Future.unit(user)
        else return instance.create(MkTables.mkUser(id, p.name.givenName, p.name.familyName))
    }
}