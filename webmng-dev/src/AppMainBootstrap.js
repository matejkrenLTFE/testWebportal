/**
 * Bootstraping application and resources.
 *
 * Application bootstrap procedure gets called only on initial application request (e.g. page refresh).
 * Bootstraping happens after AppController and AppView gets initalized.
 *
 * @author LTFE
 */
const modulecomalarmsevents = require("./ComAlarmsEventsIndicator");
const build = require("../build.info");

module.exports.AppMainBootstrap = function () {
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

                    //Get options from the center object in options
                    const centerConfig = chart.config.options.elements.center;
                    const fontStyle = centerConfig.fontStyle || 'Arial';
                    const txt = centerConfig.text;
                    //const txt_under = centerConfig.text_under;
                    const color = centerConfig.color || '#000';
                    const sidePadding = centerConfig.sidePadding || 20;
                    const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);
                    //Start with a base font of 30px
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
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
                    const centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
                    // const centerY_up = ((chart.chartArea.top + chart.chartArea.bottom)* (51/100.0));
                    // const centerY_down = ((chart.chartArea.top + chart.chartArea.bottom)* (49/100.0));

                    ctx.font = fontSizeToUse + "px " + fontStyle;
                    ctx.fillStyle = color;

                    //Draw text in center
                    ctx.fillText(txt, centerX, centerY);
                    // ctx.fillText(txt_under, centerX, centerY_up);
                }
            }
        });

    };

    /**
     * Check for alarm events based on _checkAlarmsInterval setting.
     */
    const _checkAlarmEvents = function () {
        // Initial checking
        let events = AppMain.ws().exec("EventAlarms", {"GetAlarmFlags": ""}).getResponse(false);
        events = defined(events.EventAlarmsResponse) ? events.EventAlarmsResponse["alarm-flags"] : {};

        // Clear previous events list
        AppMain.getComponent("ComAlarmsEventsIndicator").clearEvents();
        // Append events
        for (let i in events)
            AppMain.getComponent("ComAlarmsEventsIndicator").addEvent({id: i, clear: true});
        AppMain.getComponent("ComAlarmsEventsIndicator").init();

        // Interval checking
        setInterval(function () {
            let events = AppMain.ws().exec("EventAlarms", {"GetAlarmFlags": ""}).getResponse(false);
            events = defined(events.EventAlarmsResponse) ? events.EventAlarmsResponse["alarm-flags"] : {};

            // Clear previous events list
            AppMain.getComponent("ComAlarmsEventsIndicator").clearEvents();
            // Append events
            for (let i in events)
                AppMain.getComponent("ComAlarmsEventsIndicator").addEvent({id: i, clear: true});

            AppMain.getComponent("ComAlarmsEventsIndicator").init();
        }, _checkAlarmsInterval);
        _checkAlarmsIntervalRunning = true;
    };

    this.controllerOnBeforeExecute = function () {
        // Prepare lang menu list
        const langs = AppMain.locale.getLanguagesList();
        let langsMenu = "";
        for (let lang in langs)
            langsMenu += "<li class='mdl-menu__item'><a href='' data-bind-event='click' data-bind-method='setLanguage' " +
                "data-language='" + (langs[lang]) + "'><div class='lang " + (langs[lang].substring(0, 2)) + "'></div>" +
                (langs[lang].substring(0, 2)) + "</li>";

        // Render mainmenu & langbar only when logged-in
        if (AppMain.getAppComponent("controller").action !== "Login") {
            // Render main menu before any action executes
            AppMain.getAppComponent("view").renderSectionStatic("Default#MainMenu", "section#MainMenu", {
                mainmenu: {
                    dashboard: AppMain.t("DASHBOARD", "mainmenu"),
                    nodes: AppMain.t("ATTACHED_DEVICES", "mainmenu"),
                    nodes_list: AppMain.t("ATTACHED_DEVICES_LIST", "mainmenu"),
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
            if (!AppMain.getComponent("ComAlarmsEventsIndicator"))
                AppMain.setComponent("ComAlarmsEventsIndicator", modulecomalarmsevents.ComAlarmsEventsIndicator);
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

    this.controllerOnAfterExecute = function () {
        // Init alarm events checking component        
        // Only do alarm events checking when logged-in and alarm interval is not yet running
        if (AppMain.getAppComponent("controller").action !== "Login" && !_checkAlarmsIntervalRunning)
            _checkAlarmEvents(this);

        AppMain.getLogger();

        // Main navigation - submenu transition stay opened
        $(".mdl-navigation__link").on("click", function () {
            $("ul.mdl-navigation__submenu-active").removeClass("mdl-navigation__submenu-active");
            // Submenu - next item
            let submenu = $(this).next().get(0);
            if (defined(submenu) && submenu.nodeName === "UL") {
                $(submenu).addClass("mdl-navigation__submenu-active");
                return;
            }
            // Submenu - parent
            submenu = $(this).parent().parent().get(0);
            if (defined(submenu) && submenu.nodeName === "UL") {
                $(submenu).addClass("mdl-navigation__submenu-active");
                const parentLink = $(submenu).prev().get(0);
                //dmp( $(submenu).prev().get(0) );
                //$($(submenu).prev().get(0)).addClass("active");
                $(parentLink).addClass("active");
            }
        });

        // Hide logout button if authType=Certificate
        if (AppMain.getConfigParams("authType") === AppMain.AUTH_TYPE_CERT)
            $("#LogoutOption, ul.list-navigation li:last").hide();

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
    }
};
