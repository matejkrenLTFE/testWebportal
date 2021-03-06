/**
 * Bootstraping application and resources.
 *
 * Application bootstrap procedure gets called only on initial application request (e.g. page refresh).
 * Bootstraping happens after AppController and AppView gets initalized.
 *
 * @author LTFE
 */

/* global  AppMain, $, defined, window, Chart */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecomalarmsevents = require("./ComAlarmsEventsIndicator");
const build = require("../build.info");

module.exports.AppMainBootstrap = function () {
    "use strict";

    /**
     * @var ComAlarmsEventsIndicator
     */
    //_ComAlarmsEventsIndicator = null;

    /**
     * Check for new alarms interval (in milliseconds).
     */
    let _checkAlarmsInterval = 120000;

    /**
     * Indicator if alarm checking interval is running. Default: false.
     * @type {Boolean}
     */
    let _checkAlarmsIntervalRunning = false;

    const getFontStyle = function (centerConfig) {
        return centerConfig.fontStyle || "Arial";
    };

    const getTextColor = function (centerConfig) {
        return centerConfig.color || "#000";
    };
    const getSidePadding = function (centerConfig) {
        return centerConfig.sidePadding || 20;
    };

    this.init = function () {
        const _this = this;
        this.view = AppMain.getAppComponent("view");
        this.controller = AppMain.getAppComponent("controller");

        // Show username
        $("#SectionUsername").html(AppMain.user.getUserData("username"));
        // User menu
        $("#LogoutOption").html(AppMain.t("Logout", "global") + " - " + AppMain.user.getUserData("username"));
        $("#UserMenuOptions #LogoutOption").on("click", function () {
            _this.controller.userLogoutPrompt();
        });

        // Attach controller event callbacks
        this.controller.attachEvent("onBeforeExecute", this.controllerOnBeforeExecute);
        this.controller.attachEvent("onAfterExecute", this.controllerOnAfterExecute);

        $("title").append(" - " + build.device);
        $(window).on("load", function () {
            $("#AppWindow").show();
        });

        // Hide logout button if authType=Certificate
        if (AppMain.getConfigParams("authType") === AppMain.AUTH_TYPE_CERT) {
            $("#LogoutOption, [data-rbac='mainmenu.logout']").hide();
        }

        Chart.pluginService.register({
            beforeDraw: function (chart) {
                if (chart.config.options.elements.center) {
                    //Get ctx from string
                    const ctx = chart.chart.ctx;
                    const centerConfig = chart.config.options.elements.center;
                    const fontStyle = getFontStyle(centerConfig);
                    const txt = centerConfig.text;
                    const color = getTextColor(centerConfig);
                    const sidePadding = getSidePadding(centerConfig);
                    const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);
                    ctx.font = "30px " + fontStyle;

                    //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
                    const stringWidth = ctx.measureText(txt).width;
                    const elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

                    // Find out how much the font can grow in width.
                    const widthRatio = elementWidth / stringWidth;
                    const newFontSize = Math.floor(30 * widthRatio);
                    const elementHeight = (chart.innerRadius * 2);

                    // Pick a new font size so it will not be larger than the height of label.
                    const fontSizeToUse = Math.min(newFontSize, elementHeight);

                    //Set font settings to draw it correctly.
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    const centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
                    const centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);

                    ctx.font = fontSizeToUse + "px " + fontStyle;
                    ctx.fillStyle = color;
                    ctx.fillText(txt, centerX, centerY);
                }
            }
        });

    };

    const _checkAlarmEventsPom = function () {
        let events = AppMain.ws().exec("EventAlarms", {"GetAlarmFlags": ""}).getResponse(false);
        events = (defined(events.EventAlarmsResponse) && defined(events.EventAlarmsResponse["alarm-flags"]))
            ? events.EventAlarmsResponse["alarm-flags"]
            : {};

        // Clear previous events list
        AppMain.getComponent("ComAlarmsEventsIndicator").clearEvents();
        // Append events
        $.each(events, function (index) {
            AppMain.getComponent("ComAlarmsEventsIndicator").addEvent({id: index, clear: true});
        });
        AppMain.getComponent("ComAlarmsEventsIndicator").init();
    };

    /**
     * Check for alarm events based on _checkAlarmsInterval setting.
     */
    const _checkAlarmEvents = function () {
        _checkAlarmEventsPom();

        // Interval checking
        setInterval(function () {
            _checkAlarmEventsPom();
        }, _checkAlarmsInterval);
        _checkAlarmsIntervalRunning = true;
    };

    this.controllerOnBeforeExecute = function () {
        // Prepare lang menu list
        const langs = AppMain.locale.getLanguagesList();
        let langsMenu = "";
        langs.forEach(function (lang) {
            langsMenu += "<li class='mdl-menu__item'><a href='' data-bind-event='click' data-bind-method='setLanguage' "
                    + "data-language='" + (lang) + "'><div class='lang " + (lang.substring(0, 2)) + "'></div>"
                    + (lang.substring(0, 2)) + "</li>";
        });
        // Render mainmenu & langbar only when logged-in
        if (AppMain.getAppComponent("controller").action !== "Login") {
            // Render main menu before any action executes
            AppMain.getAppComponent("view").renderSectionStatic("Default#MainMenu", "section#MainMenu", {
                mainmenu: {
                    dashboard: AppMain.t("DASHBOARD", "mainmenu"),
                    nodes: AppMain.t("ATTACHED_DEVICES", "mainmenu"),
                    nodesList: AppMain.t("ATTACHED_DEVICES_LIST", "mainmenu"),
                    whiteList: AppMain.t("WHITE_LIST", "mainmenu"),
                    networkTopology: AppMain.t("NETWORK_TOPOLOGY", "mainmenu"),
                    plcNeighbor: AppMain.t("PLC_NEIGHBOR", "mainmenu"),
                    plcRouting: AppMain.t("PLC_ROUTING", "mainmenu"),
                    events: AppMain.t("ALARM_EVENTS", "mainmenu"),
                    events2: AppMain.t("ALARM_EVENTS2", "mainmenu"),
                    system: AppMain.t("SYSTEM", "mainmenu"),
                    settings: AppMain.t("SETTINGS", "mainmenu"),
                    systemSettings: AppMain.t("SYSTEM_SETTINGS", "mainmenu"),
                    systemReboot: AppMain.t("SYSTEM_REBOOT", "mainmenu"),
                    logout: AppMain.t("LOGOUT", "mainmenu"),
                    wan: AppMain.t("WAN", "mainmenu"),
                    modem: AppMain.t("MODEM", "mainmenu"),
                    ethernet: AppMain.t("ETHERNET", "mainmenu"),
                    nan: AppMain.t("NAN", "mainmenu"),
                    plc: AppMain.t("PLC", "mainmenu"),
                    rs485: AppMain.t("RS485", "mainmenu"),
                    lan: AppMain.t("LAN", "mainmenu"),
                    localEthernet: AppMain.t("LOCAL_ETHERNET", "mainmenu"),
                    firmwareUpgrade: AppMain.t("FIRMWARE_UPGRADE", "mainmenu"),
                    settingsExportImport: AppMain.t("SETTINGS_EXP_IMP", "mainmenu"),
                    userManagement: AppMain.t("USER_MNG", "mainmenu"),
                    certManager: AppMain.t("CERT_MNG", "mainmenu"),
                    firewallManager: AppMain.t("FW_MNG", "mainmenu"),
                    information: AppMain.t("INFORMATION", "mainmenu"),
                    userRole: AppMain.t("User role management", "mainmenu"),
                    monitoring: AppMain.t("MONITORING_AND_DIAGNOSTICS", "mainmenu"),
                    plcDiagnostics: AppMain.t("PLC_DIAGNOSTICS", "mainmenu"),
                    monitoringManager: AppMain.t("MONITORING_MANAGER", "mainmenu"),
                    taskManager: AppMain.t("TASK_MANAGER", "mainmenu"),
                    taskTable: AppMain.t("TASK_TABLE", "mainmenu"),
                    groupTable: AppMain.t("GROUP_TABLE", "mainmenu")
                }
            }, undefined);

            // Render language bar
            AppMain.getAppComponent("view").renderSectionStatic("Default#LanguageBar", "#SectionLanguage", {
                langMenu: langsMenu,
                langActive: AppMain.getLanguage().substring(0, 2)
            }, undefined);

            // Render alarms&events indicator component
            if (!AppMain.getComponent("ComAlarmsEventsIndicator")) {
                AppMain.setComponent("ComAlarmsEventsIndicator", modulecomalarmsevents.ComAlarmsEventsIndicator);
            }
            AppMain.getComponent("ComAlarmsEventsIndicator").init();
            //if(!defined(_ComAlarmsEventsIndicator))
            //  _ComAlarmsEventsIndicator = modulecomalarmsevents.ComAlarmsEventsIndicator;
            //_ComAlarmsEventsIndicator.init();
            //dmp( "AppMain.getComponent(ComAlarmsEventsIndicator)" );
            //dmp( AppMain.getComponent("ComAlarmsEventsIndicator") );
        }

        // Set menu active
        $("#MainMenu a.active").removeClass("active");
        $("#MainMenu a[href='" + window.location.hash + "']").addClass("active");

        $("#SectionBuildV").html("Dev-Build / " + build.version);
    };

    const updateActiveMenu = function (submenu, hasParrent) {
        if (defined(submenu) && submenu.nodeName === "UL") {
            $(submenu).addClass("mdl-navigation__submenu-active");
            if (hasParrent) {
                const parentLink = $(submenu).prev().get(0);
                $(parentLink).addClass("active");
            }
            return true;
        }
        return false;
    };

    this.controllerOnAfterExecute = function () {
        // Init alarm events checking component
        // Only do alarm events checking when logged-in and alarm interval is not yet running
        if (AppMain.getAppComponent("controller").action !== "Login" && !_checkAlarmsIntervalRunning) {
            _checkAlarmEvents(this);
        }

        AppMain.getLogger();

        // Main navigation - submenu transition stay opened
        $(".mdl-navigation__link").on("click", function () {
            $("ul.mdl-navigation__submenu-active").removeClass("mdl-navigation__submenu-active");
            // Submenu - next item
            let submenu = $(this).next().get(0);
            if (!updateActiveMenu(submenu, false)) {
                submenu = $(this).parent().parent().get(0);
                updateActiveMenu(submenu, true);
            }
        });

        // Hide logout button if authType=Certificate
        if (AppMain.getConfigParams("authType") === AppMain.AUTH_TYPE_CERT) {
            $("#LogoutOption, ul.list-navigation li:last").hide();
        }

        // Expand all
        const expMenu = $("#expandMenu");
        expMenu.on("click", function () {
            $("ul.mdl-navigation__submenu-active").removeClass("mdl-navigation__submenu-active");
            // Expand all submenus
            $("ul.list-navigation--sublevel").addClass("mdl-navigation__submenu-active");
            $("#collapseMenu").show();
            expMenu.hide();
        });
        // collapse all
        $("#collapseMenu").on("click", function () {
            $("ul.list-navigation--sublevel").removeClass("mdl-navigation__submenu-active");
            $("#collapseMenu").hide();
            expMenu.show();
        });
    };
};
