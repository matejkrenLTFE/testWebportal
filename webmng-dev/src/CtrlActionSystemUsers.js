/**
 * @class CtrlActionSystemUsers Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemUsers = Object.create(new modulecontrolleraction.IControllerAction());

CtrlActionSystemUsers.exec = function () {
    "use strict";

    this.view.setTitle("SYS_USER_MNG");
    this.loggedUser = AppMain.user.getUserData();

    let users = AppMain.ws().exec("GetUserData", {}).getResponse(false);
    users = defined(users.GetUserDataResponse)
        ? users.GetUserDataResponse.user
        : {};
    this.roles = CtrlActionSystemUsers.getUserRoles();
    const allHtml = this.htmlUserList(users);

    this.view.render(this.controller.action, {
        title: AppMain.t("USERS", "SYS_USER_MNG"),
        userList: allHtml.html,
        tooltips: allHtml.tooltips,
        labels: {
            thUsername: AppMain.t("USERNAME", "SYS_USER_MNG"),
            thRole: AppMain.t("ROLE", "SYS_USER_MNG"),
            addUser: AppMain.t("ADD_NEW_USER", "SYS_USER_MNG")
        }
    });

    AppMain.html.updateElements([".mdl-tooltip"]);
};

const isImportantUser = function (user) {
    "use strict";
    return (user.username !== "admin" && user.username !== "user" && user.username !== "main");
};

/**
 * helper for create table html
 * @param users
 * @returns {{html: string, tooltips: string}}
 * @private
 */
CtrlActionSystemUsers.htmlUserList = function (users) {
    "use strict";

    let all = {
        html: "",
        tooltips: ""
    };
    if (users.length === undefined) {
        users = [users];
    }
    users.forEach(function (user, i) {
        all.html += "<tr>";
        all.html += "<td  style=\"text-align:left\">" + user.username + "</td>";
        all.html += "<td  style=\"text-align:left\">" + user["user-role-name"] + "</td>";
        all.html += "<td><span data-rbac=\"users.actions\">";

        if (isImportantUser(user)) {
            all.html += "<i class=\"material-icons cursor-pointer\" id=\"delete_" + i + "\" data-rbac=\"users.button-remove-user\" data-username='" + user.username + "' " +
                    "data-bind-method=\"CtrlActionSystemUsers.removeUser\" data-bind-event=\"click\">clear</i>";
        }

        all.html += "<i class=\"material-icons cursor-pointer\" id=\"change_" + i + "\" data-rbac=\"users.button-change-password\" " +
                "data-username=\"" + user.username + "\" " + " data-user-role=\"" + user["user-role-name"] + "\" " +
                "data-bind-method=\"CtrlActionSystemUsers.editUser\" data-bind-event=\"click\">lock" + "</i>";
        all.html += "</span></td>";
        all.tooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"change_" + i + "\">" + AppMain.t("CHANGE_PASS", "SYS_USER_MNG") + "</div>";
        if (isImportantUser(user)) {
            all.tooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"delete_" + i + "\">" + AppMain.t("REMOVE", "global") + "</div>";
        }
        all.html += "</tr>";
    });
    return all;
};

const getHtmlForPassParams = function (allHtml, pass1Html, pass2Html, passOldHtml, username) {
    "use strict";
    allHtml += AppMain.t("INSERT_PASS_PARAMS", "SYS_USER_MNG", [username]) + "</br>" +
            "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">";
    if (this.loggedUser["user-role-name"] === "admin") {
        allHtml += pass1Html + pass2Html;
    } else {
        allHtml += passOldHtml + pass1Html + pass2Html;
    }
    return allHtml;
};


CtrlActionSystemUsers.checkImputedUser = function (user) {
    "use strict";
    if (user.username === "") {
        CtrlActionSystemUsers.importAlert(AppMain.t("ADD_NEW_USER_ERROR", "SYS_USER_MNG"),
                AppMain.t("USERNAME_ERROR", "SYS_USER_MNG"));
        return false;
    }
    if (user.password === "") {
        CtrlActionSystemUsers.importAlert(AppMain.t("ADD_NEW_USER_ERROR", "SYS_USER_MNG"),
                AppMain.t("USER_NO_PASSWORD", "global"));
        return false;
    }
    if (user.password !== user.passwordRepeat) {
        CtrlActionSystemUsers.importAlert(AppMain.t("ADD_NEW_USER_ERROR", "SYS_USER_MNG"),
                AppMain.t("PASSWORD_ERROR", "SYS_USER_MNG"));
        return false;
    }
    return true;
};

CtrlActionSystemUsers.checkImputedUserNotEvent = function (user, username) {
    "use strict";
    user.username = username;
    user.oldPassword = $("input[name='password-old']").val();
    user.password = $("input[name='password']").val();
    if (user.password === "") {
        CtrlActionSystemUsers.importAlert(AppMain.t("PASSWORD_TITLE_ERROR", "SYS_USER_MNG"),
                AppMain.t("USER_NO_PASSWORD", "global"));
        return false;
    }
    user.passwordRepeat = $("input[name='password-repeat']").val();
    if (user.password !== user.passwordRepeat) {
        CtrlActionSystemUsers.importAlert(AppMain.t("PASSWORD_TITLE_ERROR", "SYS_USER_MNG"),
                AppMain.t("PASSWORD_ERROR", "SYS_USER_MNG"));
        return false;
    }
    return CtrlActionSystemUsers.saveUser("change", user);
};

/**
 * pop-up to add new user or change password
 * @param username
 */
CtrlActionSystemUsers.addNewUser = function (username) {
    "use strict";

    const usernameHtml = "<tr> <td>" + AppMain.t("USERNAME", "SYS_USER_MNG") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" name=\"username\"/></div></td>" +
            "</tr>";

    const passOldHtml = "<tr> <td>" + AppMain.t("PASSWORD_OLD", "SYS_USER_MNG") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"password\" name=\"password-old\"/></div></td>" +
            "</tr>";

    const pass1Html = "<tr> <td>" + AppMain.t("PASSWORD", "SYS_USER_MNG") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"password\" name=\"password\"/></div></td>" +
            "</tr>";

    const pass2Html = "<tr> <td>" + AppMain.t("PASSWORD_REPEAT", "SYS_USER_MNG") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"password\" name=\"password-repeat\"/></div></td>" +
            "</tr>";

    const roleSelector = AppMain.html.formElementSelect("role-select", CtrlActionSystemUsers.roles, {
        label: "",
        elementSelected: ""
    }, undefined, "textfield-short-175");

    const roleHtml = "<tr> <td>" + AppMain.t("ROLE", "SYS_USER_MNG") + " * </td>" +
            "<td>" + roleSelector + "</td></tr>";

    let allHtml = "";
    if (username.event) {
        allHtml += AppMain.t("INSERT_USER_PARAMS", "SYS_USER_MNG") + "</br>" +
                "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">";
        allHtml += usernameHtml + pass1Html + pass2Html + roleHtml;
    } else {
        getHtmlForPassParams(allHtml, pass1Html, pass2Html, passOldHtml, username);
    }

    allHtml += "</table><br/><br/>";

    $.confirm({
        title: username.event
            ? AppMain.t("ADD_NEW_USER", "SYS_USER_MNG")
            : AppMain.t("CHANGE_PASS", "SYS_USER_MNG"),
        content: allHtml,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: username.event
                    ? AppMain.t("ADD", "global")
                    : AppMain.t("CHANGE", "global"),
                action: function () {
                    let user = {};
                    if (username.event) {
                        user.username = $("input[name='username']").val();
                        user.password = $("input[name='password']").val();
                        user.passwordRepeat = $("input[name='password-repeat']").val();
                        user.role = $("#role-select").val();
                        if (!CtrlActionSystemUsers.checkImputedUser(user)) {
                            return false;
                        }
                        return CtrlActionSystemUsers.saveUser("add", user);
                    }
                    CtrlActionSystemUsers.checkImputedUserNotEvent(user, username);
                }
            },
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action: function () {
                    return true;
                }
            }
        }
    });
};

/**
 * pop-up for change password
 * @param e
 */
CtrlActionSystemUsers.editUser = function (e) {
    "use strict";

    const $this = $(e.target);
    const username = $this.attr("data-username");
    if (AppMain.user.getUserData("username") === username) {
        $.confirm({
            title: AppMain.t("CHANGE_PASS_WARNING", "SYS_USER_MNG"),
            content: AppMain.t("CURRENT_USER_PASSWORD_WARNING", "SYS_USER_MNG"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        CtrlActionSystemUsers.addNewUser(username);
                    }
                },
                cancel: {
                    text: AppMain.t("CANCEL", "global"),
                    action: function () {
                        return true;
                    }
                }
            }
        });
    } else {
        this.addNewUser(username);
    }
};

/**
 * helper for all user roles
 */
CtrlActionSystemUsers.getUserRoles = function () {
    "use strict";

    let roles = AppMain.ws().exec("GetUserData", {operation: "ROLE"}).getResponse(false);
    roles = defined(roles.GetUserDataResponse.role)
        ? roles.GetUserDataResponse.role
        : {};
    let rolesList = {};
    roles.forEach(function (role) {
        rolesList[role["user-role-name"]] = role["user-role-name"];
    });

    return rolesList;
};

/**
 * Remove user confirm pop-up
 * @param e
 */
CtrlActionSystemUsers.removeUser = function (e) {
    "use strict";

    const username = $(e.target).attr("data-username");

    $.confirm({
        title: AppMain.t("DELETE_USER_WARNING_TITLE", "SYS_USER_MNG"),
        content: AppMain.t("DELETE_USER_WARNING", "SYS_USER_MNG", [username]),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    CtrlActionSystemUsers.remove(username);
                }
            },
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action: function () {
                    return true;
                }
            }
        }
    });
};

/**
 * Remove user rest
 * @param username
 */
CtrlActionSystemUsers.remove = function (username) {
    "use strict";

    let response = AppMain.ws().exec("SetUserData", {
        "operation": "DELETE-USER",
        "username": username
    }).getResponse(false);

    if (defined(response.SetUserDataResponse) && response.SetUserDataResponse.toString() === "OK") {
        AppMain.dialog("SUCC_USER_REMOVE", "success", [username]);
    }
    this.exec();
};

CtrlActionSystemUsers.saveAddUser = function (user) {
    "use strict";
    let response = AppMain.ws().exec("SetUserData", {
        operation: CtrlActionSystemUsers.operations.addUser,
        username: user.username,
        password: user.password,
        "user-role-name": user.role
    }).getResponse(false);

    if (defined(response.SetUserDataResponse) && response.SetUserDataResponse.toString() === "OK") {
        AppMain.dialog("SUCC_USER_CREATED", "success");
    } else {
        AppMain.dialog("ERR_USER_CREATED", "error");
    }
    this.exec();
};
CtrlActionSystemUsers.saveChangeUser = function (user) {
    "use strict";
    let response = AppMain.ws().exec("SetUserData", {
        operation: CtrlActionSystemUsers.operations.changePassword,
        "old-password": user.oldPassword,
        username: user.username,
        password: user.password
    }).getResponse(false);

    if (defined(response.SetUserDataResponse) && response.SetUserDataResponse.toString() === "OK") {
        AppMain.dialog("SUCC_USER_PASSWORD", "success");
        if (AppMain.user.getUserData("username") === user.username) {
            AppMain.dialog("USER_REAUTH", "warning");
            window.setTimeout(function () {
                AppMain.user.logout();
            }, 2000);
        }
    } else {
        AppMain.dialog("ERR_USER_PASSWORD", "error");
    }
    this.exec();
};

/**
 * save user rest
 * @param type
 * @param user
 * @private
 */
CtrlActionSystemUsers.saveUser = function (type, user) {
    "use strict";

    if (type === "add") {
        CtrlActionSystemUsers.saveAddUser(user);
    }
    if (type === "change") {
        CtrlActionSystemUsers.saveChangeUser(user);
    }
};

/**
 * helper for rest
 * @type {{addUser: string, changePassword: string}}
 */
CtrlActionSystemUsers.operations = {
    changePassword: "SET-USER-PASSWORD",
    addUser: "ADD-USER"
};

module.exports.CtrlActionSystemUsers = CtrlActionSystemUsers;