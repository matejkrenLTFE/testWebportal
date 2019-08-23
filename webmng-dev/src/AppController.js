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
    this.event = null;

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

    this.eventsPom = {};

    /**
     * Attach component event. Events are executed in FIFO order.
     */
    this.attachEvent = function (eventName, callback) {
        if (!defined(this.eventsPom.onBeforeExecute)) {
            this.eventsPom.onBeforeExecute = [];
        }
        if (!defined(this.eventsPom.onAfterExecute)) {
            this.eventsPom.onAfterExecute = [];
        }
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

    function getControlerActionComponent(action) {
        let controlleractioncomponent = null;
        switch (action) {
        case "Default":
            controlleractioncomponent = require("./CtrlActionDefault");
            break;
        case "Nodes":
            controlleractioncomponent = require("./CtrlActionNodes");
            break;
        case "PLCNeighbor":
            controlleractioncomponent = require("./CtrlActionPLCNeighbor");
            break;
        case "PLCRouting":
            controlleractioncomponent = require("./CtrlActionPLCRouting");
            break;
        case "WhiteList":
            controlleractioncomponent = require("./CtrlActionWhiteList");
            break;
        case "Events":
            controlleractioncomponent = require("./CtrlActionEvents");
            break;
        case "EventsSettings":
            controlleractioncomponent = require("./CtrlActionEventsSettings");
            break;
        case "WANModem":
            controlleractioncomponent = require("./CtrlActionWANModem");
            break;
        case "WANEthernet":
            controlleractioncomponent = require("./CtrlActionWANEthernet");
            break;
        case "NANPlc":
            controlleractioncomponent = require("./CtrlActionNANPlc");
            break;
        case "NANRs":
            controlleractioncomponent = require("./CtrlActionNANRs");
            break;
        case "LANEthernet":
            controlleractioncomponent = require("./CtrlActionLANEthernet");
            break;
        case "TaskManager":
            controlleractioncomponent = require("./CtrlActionTaskManager");
            break;
        case "GroupTable":
            controlleractioncomponent = require("./CtrlActionGroupTable");
            break;
        case "MonitoringManager":
            controlleractioncomponent = require("./CtrlActionMonitoringManager");
            break;
        case "PLCdiagnostics":
            controlleractioncomponent = require("./CtrlActionPLCdiagnostics");
            break;
        case "Network":
            controlleractioncomponent = require("./CtrlActionNetwork");
            break;
        case "SystemSettings":
            controlleractioncomponent = require("./CtrlActionSystemSettings");
            break;
        case "SystemSettingsExport":
            controlleractioncomponent = require("./CtrlActionSystemSettingsExport");
            break;
        case "SystemUsers":
            controlleractioncomponent = require("./CtrlActionSystemUsers");
            break;
        case "SystemUpgrade":
            controlleractioncomponent = require("./CtrlActionSystemUpgrade");
            break;
        case "SystemReboot":
            controlleractioncomponent = require("./CtrlActionSystemReboot");
            break;
        case "SystemInformation":
            controlleractioncomponent = require("./CtrlActionSystemInformation");
            break;
        case "Login":
            controlleractioncomponent = require("./CtrlActionLogin");
            break;
        default:
            AppMain.log("Module not found.");
            dmp("AppMain.exec controller action exception message: Module not found.");
        }
        return controlleractioncomponent;
    }

    this.exec = function (action, event) {
        AppMain.log("AppController.exec");

        if (this.view === null) {
            throw "AppController: no view defined!";
        }

        if (defined(event)) {
            this.event = event;
        }

        this.action = (defined(action) && action !== "")
            ? action
            : this.actionDefault;

        this.ctrlActionComp = null;

        AppMain.log("Execute CtrlAction: " + this.action);

        // Check if user has permission to execute action
        if (this.action !== "Login" && !AppMain.rbac.hasExecCtrlActionPermission(this.action)) {
            return this.actionForbidden();
        }

        let controlleractioncomponent = getControlerActionComponent(this.action);

        if (controlleractioncomponent !== null) {
            this.ctrlActionComp = controlleractioncomponent["CtrlAction" + this.action];

            if (typeof this.ctrlActionComp.init === "function") {
                this.ctrlActionComp.init();
            }
            _beforeExec(this);
            this.ctrlActionComp.exec();
        }

        _afterExec(this);
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

    this.EventsCallback = function (e) {
        dmp("EventsCallback");
        dmp(e);
    };

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
                setTimeout(function () {//problem with localStorage authDigest being null
                    const userData = AppMain.ws().exec("GetUserData", {username: username}).getResponse(false);
                    AppMain.ws().exec("ExecuteAction", {"Command": "login"});
                    dmp(userData);

                    if (defined(userData.GetUserDataResponse) && defined(userData.GetUserDataResponse.user) && defined(userData.GetUserDataResponse.user["user-role-name"])) {
                        const user = userData.GetUserDataResponse.user;
                        const roleData = AppMain.ws().exec("GetUserData", {
                            "user-role-name": user["user-role-name"],
                            "operation": "ROLE"
                        }).getResponse(false);

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
                    } else {
                        AppMain.dialog("USER_LOGIN_FAILED", "error");
                        if (AppMain.environment === AppMain.ENVIRONMENT_DEV) {
                            AppMain.dialog("Response: " + userData.status + " " + userData.statusText, "error");
                        }
                    }
                }, 300);
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