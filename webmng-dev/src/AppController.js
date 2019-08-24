/**
 * AppController component
 * @author LTFE
 * @module src/AppController
 */

/* global AppMain, $, defined, dmp, window */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulewebservice = require("./AppWebserviceClient");
const X2JS = require("xml-json-parser");
const Json2Xml = new X2JS();

/**
 * Application controller component.
 * This is where action from URL hash part are being executed: /#SomeAction
 *
 * Supported event callbacks:
 * - onBeforeExecute: before controller action gets called
 * - onAfterExecute: after controller action gets called
 *
 * @class AppController
 *
 */
module.exports.AppController = function () {
    "use strict";

    /**
     * AppView instance
     */
    this.view = null;
    this.action = null;
    this.actionDefault = "Default";

    /**
     * @type AppController Self reference for easier action component migration.
     */
    this.controller = this;

    /**
     * @property IControllerAction Reference to controller action CtrlAction[ActionName] component (if exists).
     */
    this.ctrlActionComp = null;

    /**
     * AppWebservice instance.
     * @type AppWebserviceClient
     */
    this.wsPom = null;

    this.eventsPom = {
        onBeforeExecute: [],
        onAfterExecute: []
    };

    /**
     * Attach component event. Events are executed in FIFO order.
     */
    this.attachEvent = function (eventName, callback) {
        switch (eventName) {
        case "onBeforeExecute":
            this.eventsPom.onBeforeExecute.push(callback);
            break;
        case "onAfterExecute":
            this.eventsPom.onAfterExecute.push(callback);
            break;
        default:
            dmp("Unknown event name to execute: " + eventName);
        }
    };

    let executeFunction = function (value) {
        if (typeof value === "function") {
            value();
        }
    };

    /**
     * Execute component event
     */
    this.executeEvent = function (eventName) {
        // Execute event callbacks
        switch (eventName) {
        case "onBeforeExecute":
            this.eventsPom.onBeforeExecute.forEach(executeFunction);
            break;
        case "onAfterExecute":
            this.eventsPom.onAfterExecute.forEach(executeFunction);
            break;
        default:
            dmp("Unknown event name to execute: " + eventName);
        }
    };

    /**
     * Event callback handler: before controller action executes.
     *
     * @function
     * @param {AppController} _this Self instance.
     * @returns {string} Some string
     */
    function _beforeExec(_this) {
        // Set default title
        _this.view.setTitle(_this.action);
        AppMain.log("Action called: " + _this.action);
        _this.executeEvent("onBeforeExecute", _this);
    }

    /**
     * After controller action exceute.
     */
    function _afterExec(_this) {
        _this.executeEvent("onAfterExecute", _this);

        AppMain.html.updateElements([".mdl-select", ".mdl-switch", ".mdl-tooltip"]);
    }

    const controllers = ["Default", "Nodes", "PLCNeighbor", "PLCRouting", "WhiteList", "Events", "EventsSettings", "WANModem",
            "WANEthernet", "NANPlc", "NANRs", "LANEthernet", "TaskManager", "GroupTable", "MonitoringManager", "PLCdiagnostics",
            "Network", "SystemSettings", "SystemSettingsExport", "SystemUsers", "SystemUpgrade", "SystemReboot", "SystemInformation",
            "Login"];

    function getControllerActionComponent(action) {
        let controlleractioncomponent = null;
        if (controllers.indexOf(action) !== -1) { // protect dynamic require
            controlleractioncomponent = require("./CtrlAction" + action); // eslint-disable-line import/no-dynamic-require
        } else {
            AppMain.log("Module not found.");
            dmp("AppMain.exec controller action exception message: Module not found.");
        }
        return controlleractioncomponent;
    }

    this.executeCtrl = function () {
        let controlleractioncomponent = getControllerActionComponent(this.action);

        if (controlleractioncomponent !== null) {
            this.ctrlActionComp = controlleractioncomponent["CtrlAction" + this.action];

            if (typeof this.ctrlActionComp.init === "function") {
                this.ctrlActionComp.init();
            }
            _beforeExec(this);
            this.ctrlActionComp.exec();
            _afterExec(this);
        }
    };

    this.test = function () {
        // Check if user has permission to execute action
        if (this.action !== "Login" && !AppMain.rbac.hasExecCtrlActionPermission(this.action)) {
            return this.actionForbidden();
        }
        this.executeCtrl();
    };

    this.exec = function (action) {
        AppMain.log("AppController.exec");

        this.action = (defined(action) && action !== "")
            ? action
            : this.actionDefault;

        AppMain.log("Execute CtrlAction: " + this.action);

        this.test();
    };

    this.actionForbidden = function () {
        this.view.setTitle("Permission denied");
        this.view.render("Forbidden", {
            title: AppMain.t("PER_DENIED", "global"),
            text: AppMain.t("GO_AWAY", "global")
        });
    };

    /**
     * Get webservice instance.
     */
    this.ws = function () {
        if (this.wsPom === null) {
            this.wsPom = new modulewebservice.AppWebserviceClient();
        }
        return this.wsPom;
    };

    function addRoleDataToUserObject(roleData, user) {
        // Add role data to user object
        if (defined(roleData.GetUserDataResponse.role)) {
            const permissions = Json2Xml.xml_str2json("<role>" + roleData.GetUserDataResponse.role["user-role"] + "</role>");
            user.role = permissions.role;
            user["access-level"] = roleData.GetUserDataResponse.role["access-level"];
            AppMain.user.setUserData(user);
            AppMain.dialog("CREDENTIALS_OK_LOADING", "success");
            setTimeout(function () {
                window.location = AppMain.getUrl("app");
            }, 1500);
        }
    }

    /**
     * Application login action.
     * @param {object} userLoginData Required for: AUTH_TYPE_CERT
     * Object containing user session data:
     *    - username
     *  - access-level
     *  - role
     */
    this.userLogin = function (userLoginData) {
        AppMain.log("AppController.userLogin executed");

        const username = $("[name='username']").val();
        const password = $("[name='password']").val();

        // Authenticate user based on different authentication type
        switch (AppMain.getConfigParams("authType")) {
        case AppMain.AUTH_TYPE_BASIC:
            AppMain.dialog("CHECK_CREDENTIALS", undefined);

            $.ajax({
                url: AppMain.getUrl("app") + "/index.html",
                method: "POST",
                data: {
                    "httpd_username": username,
                    "httpd_password": password
                }
            }).done(function () {
                // HTTP auth succeeded, fetch user info from WS
                localStorage.setItem("authDigest", btoa(username + ":" + password));
                const userData = AppMain.ws().exec("GetUserData", {username: username}).getResponse(false);
                AppMain.ws().exec("ExecuteAction", {"Command": "login"});

                if (defined(userData.GetUserDataResponse) && defined(userData.GetUserDataResponse.user) && defined(userData.GetUserDataResponse.user["user-role-name"])) {
                    const user = userData.GetUserDataResponse.user;
                    const roleData = AppMain.ws().exec("GetUserData", {
                        "user-role-name": user["user-role-name"],
                        "operation": "ROLE"
                    }).getResponse(false);
                    addRoleDataToUserObject(roleData, user);
                } else {
                    AppMain.dialog("USER_LOGIN_FAILED", "error");
                }
            }).fail(function (resp) {
                if (resp.status === 401) {
                    AppMain.dialog("Wrong username or password!", undefined);
                    return;
                }
                AppMain.dialog("Authentication problem occurred!", "error");
            });
            break;
        case AppMain.AUTH_TYPE_CERT:
            AppMain.dialog("ROLE_SUCC_AUTHENTICATED", "success", [userLoginData["user-role-name"]]);
            AppMain.user.setUserData(userLoginData);
            break;

        default:
            AppMain.dialog("UNDEFINED_APP_AUTHENTICATION", "error");
        }
    };

    /**
     * @method Method callback: logout user session
     */
    this.userLogout = function () {
        AppMain.user.logout();
    };

    /**
     * @method Method callback: logout user session
     */
    this.userLogoutPrompt = function () {
        $.confirm({
            title: AppMain.t("LOGOUT", "global"),
            content: AppMain.t("LOGOUT_PROMPT", "global"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        AppMain.user.logout();
                        return true;
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

    this.setRequestParam = function (name, value) {
        return localStorage.setItem(name, value);
    };

    this.getRequestParam = function (name) {
        return localStorage.getItem(name);
    };
};