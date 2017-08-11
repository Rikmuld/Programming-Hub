"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("../Table");
const MkTables_1 = require("../MkTables");
const Groups_1 = require("./Groups");
const Files_1 = require("./Files");
const Future_1 = require("../../functional/Future");
const List_1 = require("../../functional/List");
class User extends Table_1.Table {
    addToGroup(s, g, updateGroup, admin) {
        return this.updateOne(s, (a) => {
            const ids = Users.groupIDs(a);
            const index = ids.toArray().indexOf(g);
            if (index == -1)
                a.groups.push({ group: g, files: [], active: true });
            else if (!a.groups[index].active) {
                console.log("this must equal");
                console.log(g);
                console.log(a.groups[index].group);
                a.groups[index].active = true;
            }
        }).flatMap(a => {
            if (updateGroup)
                return Groups_1.Groups.instance.addUser(g, s, admin, false).map(u => a);
            else
                return Future_1.Future.unit(a);
        });
    }
    removeFromGroup(s, g, updateGroup, admin) {
        return this.updateOne(s, (a) => {
            const ids = Users.activeGroupIDs(a);
            const index = ids.toArray().indexOf(g.toString());
            if (index >= 0)
                a.groups[index].active = false;
        }).flatMap(a => {
            if (updateGroup)
                return Groups_1.Groups.instance.removeUser(g, s, admin, false).map(u => a);
            else
                return Future_1.Future.unit(a);
        });
    }
    getGroups(s) {
        return this.exec(this.getByID(s)).flatMap(u => Groups_1.Groups.instance.exec(Groups_1.Groups.instance.getByIDs(Users.activeGroupIDs(u).toArray()).sort({ end: 1 }), false));
    }
    addFile(students, group, file) {
        return this.update(students, user => {
            List_1.List.apply(user.groups).filter(g => g.group == group).head(null).files.push({ file: file, final: false });
        });
    }
    populateAllFiles(user) {
        return Future_1.Future.lift(this.model.populate(user, {
            path: "groups.files.file groups.group"
        }));
    }
    getFullUser(user) {
        return Future_1.Future.lift(this.getByID(user).populate("groups.group").populate({
            path: "groups.files.file",
            options: {
                populate: "assignment"
            }
        }).exec());
    }
    populateGroupFiles2(user, group) {
        return Files_1.Files.instance.exec(Files_1.Files.instance.populateAssignment(Files_1.Files.instance.getByIDs(user.groups.filter(g => g.group == group)[0].files.map(f => f.file))), false);
    }
    populateGroupFiles(user, group) {
        user.groups = [user.groups.find(g => g.group == group)];
        return this.populateAllFiles(user);
    }
    makeFinal(student, group, file) {
        return this.updateOne(student, s => s.groups.find(g => g.group == group).files.find(f => f.file == file).final = true);
    }
}
var Users;
(function (Users) {
    Users.instance = new User(Table_1.Tables.User);
    function groupIDs(user) {
        return List_1.List.apply(user.groups).map(groupData => groupData.group);
    }
    Users.groupIDs = groupIDs;
    function activeGroupIDs(user) {
        return List_1.List.apply(user.groups).filter(g => g.active).map(groupData => groupData.group);
    }
    Users.activeGroupIDs = activeGroupIDs;
    function sortByName(query) {
        return query.sort({ name: 1, surename: 1 });
    }
    Users.sortByName = sortByName;
    function getByGProfile(p) {
        const id = getIDByGProfile(p);
        return Users.instance.exec(Users.instance.getByID(id), false).flatMap(u => returnOrCreate(id, p, u));
    }
    Users.getByGProfile = getByGProfile;
    function simplify(u) {
        return { id: u._id, name: u.name, surename: u.surename, admin: u.admin };
    }
    Users.simplify = simplify;
    function getIDByGProfile(p) {
        return p.email.split("@")[0];
    }
    Users.getIDByGProfile = getIDByGProfile;
    function returnOrCreate(id, p, user) {
        if (user)
            return Future_1.Future.unit(user);
        else
            return Users.instance.create(MkTables_1.MkTables.mkUser(id, p.name.givenName, p.name.familyName));
    }
    Users.returnOrCreate = returnOrCreate;
})(Users = exports.Users || (exports.Users = {}));
