/**
 * Main application component
 * @author LTFE
 */

/* global console, AppMain, $, defined, dmp, window */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */


global.dmp = function (input) {
    "use strict";
    /* eslint-disable no-console */
    console.log(input);
    /* eslint-enable no-console */
};
/**
 * Check if variable typeof in "not undefined" and is "not null".
 * @param variable
 * @return {Boolean}
 */
global.defined = function (variable) {
    "use strict";
    return (variable !== undefined && variable !== null);
};


/**
 * Generate random string.
 * @param len Default: 7
 */
global.randomStr = function (len) {
    "use strict";
    const length = len || 7;
    return Math.random().toString(36).substring(length);
};

/**
 * Create uptime from seconds.
 */
global.uptimeFormat = function (seconds) {
    "use strict";
    const dayHours = Math.floor(seconds / (60 * 60));
    const minutes = Math.floor(seconds % (60 * 60) / 60);
    const days = Math.floor(dayHours / 24);
    const hours = Math.floor((seconds - (days * 86400)) / 3600);

    return days + " " + AppMain.t("DAYS", "global") + ", " + hours + " " + AppMain.t("HOURS", "global") + ", " + minutes + " " + AppMain.t("MINUTES", "global");
};

require("./vendor/jquery-extensions");
const modulehtml = require("./AppHTML");
const moduleuser = require("./AppUser");
const modulebootstrap = require("./AppMainBootstrap");
const modulewebservice = require("./AppWebserviceClient");
const modulelocale = require("./AppLocale");
const modulecontroller = require("./AppController");
const moduleview = require("./AppView");
const modulerbac = require("./AppRBAC.js");
const appMessages = require("./includes/appMessages.js");
const X2JS = require("xml-json-parser");

global.AppMain = function (conf) {
    "use strict";
    const config = conf || {};

    this.STATE_LOADED = 1;
    this.STATE_ACTION_EXECUTED = 2;
    this.ENVIRONMENT_DEV = "dev";
    //this.ENVIRONMENT_PROD = "prod";
    const Json2Xml = new X2JS();

    /**
     * Authentication type used by application config: authType.
     */
    this.AUTH_TYPE_BASIC = "basic";
    this.AUTH_TYPE_CERT = "certificate";

    /**
     * Internal application state log.
     */
    this.logger = [];

    /**
     * AppView instance.
     */
    this.view = null;

    /**
     * AppHTML HTML rendering helper.
     */
    this.html = null;

    /**
     * AppController instance.
     */
    this.controller = null;

    /**
     * AppWebserviceClient instance.
     */
    let _webservice = null;

    /**
     * AppWebserviceClient instance.
     */
    let _webserviceMes = null;

    /**
     * AppLocale component.
     * Application locale string used for translation and localization.
     * @type AppLocale
     */
    this.locale = null;

    /**
     * Application environment state (ENV_DEV|ENV_PROD). Default: ENV_DEV
     */
    this.environment = "dev";

    /**
     * Application supported languages.
     * Language files MUST be located in ./locale folder.
     * @type {Array}
     */
    this.supportedLocale = null;

    /**
     * Internal application routes, used for building URLs.
     */
    let _routes = {};

    /**
     * Enable HTTP Basic Auth.
     */
    this.authBasic = false;

    /**
     * Event socket host IP.
     */
    this.socketEventsHost = null;

    /**
     * Enable https:// protocol for application routes.
     */
    this.httpsEnabled = false;

    /**
     * Trigger callback when application completes execution.
     */
    this.afterRun = null;

    /**
     * Trigger callback after AppMain.init() was executed (app was initialized).
     */
    this.afterInit = null;

    /**
     * Trigger callback when AppMain state changes, @see STATE_* constants
     */
    this.onStateChange = null;

    /**
     * Application components which should be accessed globally.
     */
    let _components = {};


    /**
     * Set app configuration passed into constructor.
     */
    const _setConfig = function (_this, config) {
        $.each(config, function (index, value) {
            if (value !== undefined) {
                _this[index] = value;
            }
        });
    };

    /**
     * Init application routes.
     */
    function _initRoutes(_this) {
        _routes = {
            base: "/",
            login: "/",
            app: (_this.environment === _this.ENVIRONMENT_DEV)
                ? "/webmng-dev"
                : "/webmng"
        };
    }

    /**
     * Triggered when application state changes:
     * - application was loaded (after AppMain.run)
     * - controller action executed
     */
    const _stateChanged = function (_this, state) {
        if (typeof _this.onStateChange === "function") {
            _this.onStateChange({state: state});
        }
    };

    /**
     * Initialize application before AppMain.run()
     */
    this.init = function () {
        dmp("AppMain.init");
        _setConfig(this, config);
        _initRoutes(this);

        if (defined(this.afterInit) && (typeof this.afterInit === "function")) {
            this.afterInit(this);
        }

        // Init HTML helper
        this.html = new modulehtml.AppHTML();
        // Init user session
        this.user = new moduleuser.AppUser();
        this.rbac = new modulerbac.AppRBAC();

        // Set application locale
        this.locale = new modulelocale.AppLocale(this.getLanguage());
        this.locale.setSupportedLocale(this.supportedLocale);
    };

    this.run = function () {
        this.init();

        // AuthFormLogoutLocation fix
        // User has logged-out, refresh login page because of forced session expiration
        // Problem: if user will relog after logout, "Unauthorized error" is shown
        if (window.location.search === "?logout") {
            window.location = "/";
        }

        const loginUrl = this.getUrl("login") + "/";
        this.controller = new modulecontroller.AppController();
        this.controller.actionDefault = (window.location.href === loginUrl || window.location.search === "?logout")
            ? "Login"
            : "Default";

        dmp("AppMain.run");
        dmp(this.controller.actionDefault);

        this.view = new moduleview.AppView();
        this.view.canvas = ".section.main-canvas";
        this.view.replaceEmptyVars = (defined(config.replaceEmptyVars))
            ? config.replaceEmptyVars
            : true;
        this.view.controller = this.controller;
        this.controller.view = this.view;

        // user login because of certificate login
        if (config.authType === AppMain.AUTH_TYPE_CERT) {
            this.certificateInitUser();
        }

        dmp("run-app");
        dmp(window.location.hash.substring(1));

        // Bootstrap application procedure
        this.bootstrap = new modulebootstrap.AppMainBootstrap();
        this.bootstrap.init();

        this.logger.env = this.environment;
        this.controller.exec(window.location.hash.substring(1));

        const _this = this;
        $(window).bind("hashchange", function (e) {
            $(".main-canvas").css("height", "unset");
            $("main.mdl-layout__content").removeClass("is-full-screen");
            _this.controller.exec(window.location.hash.substring(1), e);
            _stateChanged(_this, _this.STATE_ACTION_EXECUTED);
        });

        if (typeof this.afterRun === "function") {
            this.afterRun(_this);
        }

        _stateChanged(this, this.STATE_LOADED);

        setTimeout(function () {
            // Expand all
            const exMenu = $("#expandMenu");
            const colMenu = $("#collapseMenu");
            exMenu.on("click", function () {
                $("ul.mdl-navigation__submenu-active").removeClass("mdl-navigation__submenu-active");
                // Expand all submenus
                $("ul.list-navigation--sublevel").addClass("mdl-navigation__submenu-active");
                colMenu.show();
                exMenu.hide();
            });
            // collapse all
            colMenu.on("click", function () {
                $("ul.list-navigation--sublevel").removeClass("mdl-navigation__submenu-active");
                colMenu.hide();
                exMenu.show();
            });
        }, 500);
    };

    this.loggedIn = function () {
        return (sessionStorage.getItem("loggedIn") === true);
    };

    this.getProtocol = function () {
        return this.httpsEnabled
            ? "https://"
            : "http://";
    };

    /**
     * Get app config params or config param value.
     * @param {String} paramName Optional.
     * @return {mixed} App config object or config param value.
     */
    this.getConfigParams = function (paramName) {
        if (paramName) {
            if (defined(config[paramName])) {
                return config[paramName];
            }
            throw "ERROR: cannot return config param value '" + paramName + "' since it has not been set.";
        }
        return config;
    };

    /**
     * Get application route URL.
     * @param {String} routeName Valid route names:
     * - "base" || "/"
     * - "login"
     * - "app"
     */
    this.getUrl = function (routeName) {
        if (routeName === undefined || _routes[routeName] === undefined) {
            throw "getUrl: undefined or invalid route --> " + routeName;
        }
        return (_routes[routeName] === "/")
            ? this.getProtocol() + window.location.hostname
            : this.getProtocol() + window.location.hostname + _routes[`${routeName}`];
    };

    // /**
    //  * Set current active langauge.
    //  * @param {String} locale ISO 15897 format
    //  */
    // this.setLanguage = function(locale) {
    //     sessionStorage.setItem("locale", locale);
    // };

    /**
     * Get current active language. Default: en_US
     */
    this.getLanguage = function () {
        const locale = sessionStorage.getItem("locale");
        if (locale) {
            return locale;
        }
        return "en_US";
    };

    /**
     * Translate string according to application locale. (AppLocale.stringTranslate wrapper)
     * @param {String} string
     * @param {String} context Optional. By default all strings are taken from "global" context.
     * @param stringVars Optional
     * @return {String} translate string.
     */
    this.t = function (string, context, stringVars) {
        return this.locale.stringTranslate(string, context, stringVars);
    };

    /**
     * Get application component instance: AppView, AppController, AppLocale.
     * @param {String} componentName Component name in lowercase without App prefix.
     * @return {Object} initialized component.
     */
    this.getAppComponent = function (componentName) {
        if (defined(this[`${componentName}`])) {
            return this[`${componentName}`];
        }
        throw "AppMain: call to non-existing component " + componentName;
    };

    /**
     * Diplay dialog message inside template dialog message section.
     * Proxy method for AppView.showDialogMessage.
     * @param {String} message Message string.
     * @param  vars.
     * @param {String} type Dialog type: default, warning, error, success. If no type is provided "default" is which disappears after 5sec.
     */
    this.dialog = function (message, type, vars) {
        this.view.showDialogMessage(AppMain.t(message, "dialog", vars), type);
    };

    /**
     * Get application localization option.
     * @see AppLocale.localeDefault.localization
     * @return {string}
     */
    this.localization = function (paramName, selectLocale) {
        const params = this.locale.localization(selectLocale);
        return defined(params[`${paramName}`])
            ? params[`${paramName}`]
            : params;
    };

    /**
     * Get AppWebserviceClient instance.
     * @return {AppWebserviceClient}
     */
    this.ws = function () {
        if (_webservice === null) {
            _webservice = new modulewebservice.AppWebserviceClient();
            _webservice.setNamespace("gw:");
            return _webservice;
        }
        return _webservice;
    };

    /**
     * Get AppWebserviceClient instance.
     * @return {AppWebserviceClient}
     */
    this.wsMes = function () {
        if (_webserviceMes === null) {
            _webserviceMes = new modulewebservice.AppWebserviceClient();
            _webserviceMes.setNamespace("mes:");
            return _webserviceMes;
        }
        return _webserviceMes;
    };

    /**
     * Set custom global component.
     */
    this.setComponent = function (name, component) {
        _components[`${name}`] = component;
    };

    /**
     * Get custom global component. For getting application core component @see AppMain.getAppComponent.
     * @param {string} name Component name.
     */
    this.getComponent = function (name) {
        return defined(_components[name])
            ? _components[name]
            : null;
    };

    /**
     * Add log message to internal app logger.
     * @param {String} message
     */
    this.log = function (message) {
        this.logger[this.logger.length] = message;
    };

    /**
     * Get internal app logger trace.
     */
    this.getLogger = function () {
        return this.logger;
    };

    /**
     * Handle application response messages.
     * @param {String} messageId
     * @return {String}
     */
    this.getAppMessage = function (messageId) {
        return defined(appMessages[messageId])
            ? this.t(appMessages[messageId], "global")
            : "";
    };

    this.certificateInitUser = function () {
        // Fetch user data from certificate
        const userData = AppMain.ws().exec("GetUserData", {
            "operation": "CERTIFICATE"
        }).getResponse(false);

        if (defined(userData.GetUserDataResponse) && defined(userData.GetUserDataResponse.user) && defined(userData.GetUserDataResponse.role)) {
            const user = userData.GetUserDataResponse.user;
            user.role = Json2Xml.xml_str2json("<role>" + userData.GetUserDataResponse.role["user-role"] + "</role>");
            if (user.role && user.role.role) {
                user.role = user.role.role;
            } else {
                return;
            }
            user["access-level"] = userData.GetUserDataResponse.role["access-level"];
            dmp("USER_DATA");
            dmp(userData);
            AppMain.user.setUserData(user);
            // CtrlActionLogin.controller.userLogin(user);
        }
    };
};