"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("../Table");
const Assignments_1 = require("./Assignments");
const Groups_1 = require("./Groups");
const Users_1 = require("./Users");
class File extends Table_1.Table {
    create(a) {
        return super.create(a).flatMap(file => {
            return Assignments_1.Assignments.instance.addFile(file.assignment, file._id).flatMap(a => Users_1.Users.instance.addFile(file.students, a.group, file._id).map(u => file));
        });
    }
    populateUsers(query) {
        return query.populate({
            path: "students",
            options: {
                select: "name surename"
            }
        });
    }
    populateAssignment(query) {
        return query.populate({
            path: "assignment",
            options: {
                populate: "group",
                options: {
                    select: "name"
                }
            }
        });
    }
    populateAll(query) {
        return this.populateUsers(this.populateAssignment(query));
    }
    removeStudent(file, student) {
        return this.updateOne(file, (file) => {
            const index = file.students.indexOf(student);
            if (index >= 0)
                file.students.splice(index, 1);
        });
    }
    updateFeedback(file, feedback) {
        return this.updateOne(file, file => file.feedback = feedback);
    }
    updateNotes(file, notes) {
        return this.updateOne(file, file => file.notes = notes);
    }
}
var Files;
(function (Files) {
    Files.instance = new File(Table_1.Tables.File);
    function forStudent(student) {
        return Users_1.Users.instance.exec(Users_1.Users.instance.getByID(student)).flatMap(s => Users_1.Users.instance.populateAllFiles(s));
    }
    Files.forStudent = forStudent;
    //actually Future<[File[], User]>
    function forStudentInGroup2(student, group) {
        return Users_1.Users.instance.exec(Users_1.Users.instance.getByID(student)).flatMap(s => Users_1.Users.instance.populateGroupFiles2(s, group).map(f => [f, s]));
    }
    Files.forStudentInGroup2 = forStudentInGroup2;
    function forStudentInGroup(student, group) {
        return Users_1.Users.instance.exec(Users_1.Users.instance.getByID(student)).flatMap(s => Users_1.Users.instance.populateGroupFiles(s, group));
    }
    Files.forStudentInGroup = forStudentInGroup;
    function forStudentInGroup3(student, group) {
        return Users_1.Users.instance.exec(Users_1.Users.instance.getByID(student)).flatMap(s => Users_1.Users.instance.populateGroupFiles3(s, group));
    }
    Files.forStudentInGroup3 = forStudentInGroup3;
    function forAssignment(assignment) {
        return Assignments_1.Assignments.instance.populateFiles(Assignments_1.Assignments.instance.getByID(assignment));
    }
    Files.forAssignment = forAssignment;
    function forGroup(group) {
        return Groups_1.Groups.instance.populateFiles(Groups_1.Groups.instance.getByID(group));
    }
    Files.forGroup = forGroup;
})(Files = exports.Files || (exports.Files = {}));
