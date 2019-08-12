/**
 * @class CtrlActionSystemUsers Controller action using IControllerAction interface.
 */
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemUsers = Object.create(new modulecontrolleraction.IControllerAction);

CtrlActionSystemUsers.exec = function() {    
    this.view.setTitle("SYS_USER_MNG");
    this.loggedUser = AppMain.user.getUserData();

    let users = AppMain.ws().exec("GetUserData", {}).getResponse(false);
    users = defined(users.GetUserDataResponse) ? users.GetUserDataResponse.user : {};
    this.roles = CtrlActionSystemUsers.getUserRoles();
    const allHtml = this._htmlUserList(users);

    this.view.render(this.controller.action, {
        _title: AppMain.t("USERS", "SYS_USER_MNG"),
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

/**
 * helper for create table html
 * @param users
 * @returns {{html: string, tooltips: string}}
 * @private
 */
CtrlActionSystemUsers._htmlUserList = function(users) {
    let all= {
        html: "",
        tooltips: ""
    };
    if(users.length === undefined){
        users = [users];
    }
    for (let i in users) {
        if (users.hasOwnProperty(i)) {
            all.html += "<tr>";
            all.html += "<td  style=\"text-align:left\">" + users[i].username + "</td>";
            all.html += "<td  style=\"text-align:left\">" + users[i]["user-role-name"] + "</td>";

            all.html += '<td><span data-rbac="users.actions">';

            if(users[i].username !== "admin" && users[i].username !== "user" && users[i].username !== "main")
                all.html += '<i class="material-icons cursor-pointer" id="delete_' + i +'" data-rbac="users.button-remove-user" data-username=\'' + users[i].username + '\' ' +
                    'data-bind-method="CtrlActionSystemUsers.removeUser" data-bind-event="click">clear</i>';

            all.html += '<i class="material-icons cursor-pointer" id="change_' + i +'" data-rbac="users.button-change-password" data-username="' + users[i].username + '" ' + ' data-user-role="' + users[i]["user-role-name"] + '" ' +
                'data-bind-method="CtrlActionSystemUsers.editUser" data-bind-event="click">lock' +'</i>';

            all.html += '</span></td>';

            all.tooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"change_" + i + "\">" + AppMain.t("CHANGE_PASS", "SYS_USER_MNG") + "</div>";
            if(users[i].username !== "admin" && users[i].username !== "user" && users[i].username !== "main")
                all.tooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"delete_" + i + "\">" + AppMain.t("REMOVE", "global") + "</div>";

            all.html += "</tr>";
        }
    }
    return all;
};

/**
 * pop-up to add new user or change password
 * @param username
 */
CtrlActionSystemUsers.addNewUser = function (username) {

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
        },undefined,"textfield-short-175");

    const roleHtml = "<tr> <td>" + AppMain.t("ROLE", "SYS_USER_MNG") + " * </td>" +
        "<td>" + roleSelector + "</td></tr>";

    let allHtml = "";
    if(username.event) {
        allHtml += AppMain.t("INSERT_USER_PARAMS", "SYS_USER_MNG") + "</br>" +
            "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">";
        allHtml += usernameHtml + pass1Html + pass2Html + roleHtml;
    }else{
        allHtml += AppMain.t("INSERT_PASS_PARAMS", "SYS_USER_MNG", [username]) + "</br>" +
            "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">";
        if(this.loggedUser["user-role-name"] === "admin"){
            allHtml += pass1Html + pass2Html;
        }else{
            allHtml += passOldHtml + pass1Html + pass2Html;
        }
    }

    allHtml += "</table><br/><br/>";

    $.confirm({
        title: username.event ? AppMain.t("ADD_NEW_USER", "SYS_USER_MNG"): AppMain.t("CHANGE_PASS", "SYS_USER_MNG"),
        content: allHtml,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: username.event ? AppMain.t("ADD", "global"): AppMain.t("CHANGE", "global"),
                action: function () {
                    let user = {};
                    if(username.event) {
                        user.username = $("input[name='username']").val();
                        if(user.username === ""){
                            CtrlActionSystemUsers.importAlert(AppMain.t("ADD_NEW_USER_ERROR", "SYS_USER_MNG"),
                                AppMain.t("USERNAME_ERROR", "SYS_USER_MNG"));
                            return false;
                        }
                        user.password = $("input[name='password']").val();
                        if(user.password === ""){
                            CtrlActionSystemUsers.importAlert(AppMain.t("ADD_NEW_USER_ERROR", "SYS_USER_MNG"),
                                AppMain.t("USER_NO_PASSWORD", "global"));
                            return false;
                        }
                        user.passwordRepeat = $("input[name='password-repeat']").val();
                        if(user.password !== user.passwordRepeat){
                            CtrlActionSystemUsers.importAlert(AppMain.t("ADD_NEW_USER_ERROR", "SYS_USER_MNG"),
                                AppMain.t("PASSWORD_ERROR", "SYS_USER_MNG"));
                            return false;
                        }
                        user.role = $("#role-select").val();
                        return CtrlActionSystemUsers._saveUser("add",user);
                    }else{
                        user.username = username;
                        user.oldPassword = $("input[name='password-old']").val();
                        user.password = $("input[name='password']").val();
                        if(user.password === ""){
                            CtrlActionSystemUsers.importAlert(AppMain.t("PASSWORD_TITLE_ERROR", "SYS_USER_MNG"),
                                AppMain.t("USER_NO_PASSWORD", "global"));
                            return false;
                        }
                        user.passwordRepeat = $("input[name='password-repeat']").val();
                        if(user.password !== user.passwordRepeat){
                            CtrlActionSystemUsers.importAlert(AppMain.t("PASSWORD_TITLE_ERROR", "SYS_USER_MNG"),
                                AppMain.t("PASSWORD_ERROR", "SYS_USER_MNG"));
                            return false;
                        }
                        return CtrlActionSystemUsers._saveUser("change",user);
                    }

                }
            },
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {
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
    const $this = $(e.target);
    const username = $this.attr("data-username");
    if (AppMain.user.getUserData("username")===username){
        $.confirm({
            title:  AppMain.t("CHANGE_PASS_WARNING", "SYS_USER_MNG"),
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
                    action:
                        function () {
                            return true;
                        }
                }
            }
        });
    }else{
        this.addNewUser(username);
    }
};

/**
 * helper for alert pop-up
 * @param title
 * @param content
 */
CtrlActionSystemUsers.importAlert = function (title, content) {
    $.alert({
        useBootstrap: false,
        theme: "material",
        title: title,
        content: content,
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
            }
        }
    });
    $("#file").val("");
    $(".select-file").show();
    $("#file-name").html("");
    $(".file-selected").hide();
};

/**
 * helper for all user roles
 */
CtrlActionSystemUsers.getUserRoles = function() {
    let roles = AppMain.ws().exec("GetUserData", {operation: "ROLE"}).getResponse(false);
    roles = defined(roles.GetUserDataResponse.role) ? roles.GetUserDataResponse.role : {};
    let rolesList={};

    for(let i in roles)
        if(roles.hasOwnProperty(i)){
            rolesList[roles[i]["user-role-name"]] = roles[i]["user-role-name"];
        }
    return rolesList;
};

/**
 * Remove user confirm pop-up
 * @param e
 */
CtrlActionSystemUsers.removeUser = function(e) {
    const username = $(e.target).attr("data-username");

    $.confirm({
        title:  AppMain.t("DELETE_USER_WARNING_TITLE", "SYS_USER_MNG"),
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
                action:
                    function () {
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
CtrlActionSystemUsers.remove = function(username) {
    let response = AppMain.ws().exec("SetUserData", {
        "operation": "DELETE-USER",
        "username": username
    }).getResponse(false);

    if (defined(response.SetUserDataResponse) && response.SetUserDataResponse.toString()==="OK") {
        AppMain.dialog("SUCC_USER_REMOVE", "success", [username]);
    }
    this.exec();
};

/**
 * save user rest
 * @param type
 * @param user
 * @private
 */
CtrlActionSystemUsers._saveUser = function(type, user) {
    let response;
    switch (type) {
        case "add":
            response = AppMain.ws().exec("SetUserData", {
                operation: CtrlActionSystemUsers.operations["addUser"],
                username: user.username,
                password: user.password,
                "user-role-name": user.role
            }).getResponse(false);

            if (defined(response.SetUserDataResponse) && response.SetUserDataResponse.toString()==="OK")
                AppMain.dialog("SUCC_USER_CREATED", "success");
            else
                AppMain.dialog("ERR_USER_CREATED", "error");
            this.exec();
            break;
        case "change":
            response = AppMain.ws().exec("SetUserData", {
                operation: CtrlActionSystemUsers.operations["changePassword"],
                "old-password": user.oldPassword,
                username: user.username,
                password: user.password
            }).getResponse(false);

            if (defined(response.SetUserDataResponse) && response.SetUserDataResponse.toString()==="OK") {
                AppMain.dialog("SUCC_USER_PASSWORD", "success");
                if (AppMain.user.getUserData("username") === user.username){
                    AppMain.dialog("USER_REAUTH", "warning");
                    window.setTimeout(function(){
                        AppMain.user.logout();
                    }, 2000);
                }
            }
            else
                AppMain.dialog("ERR_USER_PASSWORD", "error");
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