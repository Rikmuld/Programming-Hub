﻿import * as mongoose from 'mongoose'
import * as mongodb from 'mongodb'
import { Table, Tables } from '../Table'
import { MkTables } from '../MkTables'
import { Assignments } from './Assignments'
import { Groups } from './Groups'
import { Users } from './Users'
import { Future } from '../../functional/Future'
import { Tuple } from '../../functional/Tuple'

class File extends Table<Tables.File> {
    create(a: MkTables.FileTemplate): Future<Tables.File> {
        return super.create(a).flatMap(file => {
            return Assignments.instance.addFile(file.assignment as string, file._id).flatMap(a =>
                Users.instance.addFile(file.students as string[], a.group as string, file._id).map(u => file)
            )
        })
    }

    populateUsers<B>(query: Files.QueryA<B>): Files.QueryA<B> {
        return query.populate({
            path: "students",
            options: {
                select: "name surename"
            }
        })
    }

    populateAssignment<B>(query: Files.QueryA<B>): Files.QueryA<B> {
        return query.populate({
            path: "assignment",
            options: {
                populate: "group",
                options: {
                    select: "name"
                }
            }
        })
    }

    populateAll<B>(query: Files.QueryA<B>): Files.QueryA<B> {
        return this.populateUsers(this.populateAssignment(query))
    }

    removeStudent(file: string, student: string): Future<Tables.File> {
        return this.updateOne(file, (file: Tables.File) => {
            const index = (file.students as string[]).indexOf(student)
            if (index >= 0) (file.students as string[]).splice(index, 1)
        })
    }

    updateFeedback(file: string, feedback: string): Future<Tables.File> {
        return this.updateOne(file, file => file.feedback = feedback)
    }

    updateNotes(file: string, notes: string): Future<Tables.File> {
        return this.updateOne(file, file => file.notes = notes)
    }
}

export namespace Files {
    export type QueryA<A> = mongoose.DocumentQuery<A, Tables.File>
    export type Query = mongoose.DocumentQuery<Tables.File[], Tables.File>
    export type QueryOne = mongoose.DocumentQuery<Tables.File, Tables.File> 

    export const instance = new File(Tables.File)

    export function forStudentInGroup(student: string, group: string): Future<Tuple<Tables.User, Users.FinalFile[]>> {
        return Users.instance.exec(Users.instance.getByID(student)).flatMap(s => Users.instance.populateGroupFiles(s, group).map(files => new Tuple(s, files)))
    }

    export function forAssignment(assignment: string): Assignments.QueryOne {
        return Assignments.instance.populateFiles(Assignments.instance.getByID(assignment))
    }

    export function forGroup(group: string): Groups.QueryOne {
        return Groups.instance.populateFiles(Groups.instance.getByID(group))
    }
}