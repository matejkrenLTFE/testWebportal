/**
 * @class CtrlActionDefault Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined, dmp, uptimeFormat */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const moment = require("moment");
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionDefault = Object.create(new modulecontrolleraction.IControllerAction());

CtrlActionDefault.exec = function () {
    "use strict";

    this.view.setTitle("DASHBOARD", "HEADER");

    let generalInfo = {
        system: {},
        wan: {}
    };

    // Get infos
    const info = AppMain.ws().exec("GetInfos", undefined).getResponse(false);

    // Prepare params
    $.each(info.GetInfosResponse.info, function (i, obj) {
        if (generalInfo[obj.category] !== undefined) {
            generalInfo[obj.category][obj.name] = (!obj.value)
                ? "---"
                : obj.value;
        }
    });

    generalInfo.system.DateTime = moment(generalInfo.system.DateTime).format(AppMain.localization("DATETIME_FORMAT"));
    if (defined(generalInfo.system.Uptime)) {
        generalInfo.system.Uptime = generalInfo.system.Uptime.split(",");
        generalInfo.system.Uptime = defined(generalInfo.system.Uptime[0])
            ? generalInfo.system.Uptime[0]
            : "";
    }

    // Battery level param translation
    if (defined(generalInfo.system.Battery_level)) {
        generalInfo.system.Battery_level = CtrlActionDefault.batteryChargeLevelStr(generalInfo.system.Battery_level);
    }
    /*eslint-disable camelcase*/
    if (defined(generalInfo.system.FW_library_version)) {
        generalInfo.system.FW_library_version = generalInfo.system.FW_library_version.split(" ")[0];
    }
    /*eslint-enable camelcase*/

    // Prepate counters
    const cnt = AppMain.ws().exec("GetCounters", undefined).getResponse(false);
    let counters = {};
    if (defined(cnt.GetCountersResponse.counter)) {
        $.each(cnt.GetCountersResponse.counter["cnt-sys"], function (index, cntValue) {
            if (index === "cpu-core-temperature" || index === "cpu-board-temperature") {
                const cntValuePom = (cntValue / 1000);
                cntValue = cntValuePom.toString().substring(0, 4);
            }
            if (index === "uptime") {
                //var uptimeTimestamp = (Date.now()/1000) - cntValue;
                //cntValue = moment.unix( uptimeTimestamp ).format( "HH:mm:ss.SSS" );
                cntValue = uptimeFormat(cntValue);
            }
            counters[index] = cntValue;
        });
    }

    this.view.render("Default#ViewDashboard", {
        generalTitle: AppMain.t("GENERAL", "DASHBOARD"),
        systemInfoTitle: AppMain.t("SYSTEM_INFO", "DASHBOARD"),
        connectionStatusTitle: AppMain.t("CONN_STAT", "DASHBOARD"),
        timeTitle: AppMain.t("TIME", "DASHBOARD"),
        alarmsTitle: AppMain.t("ALARMS", "DASHBOARD"),
        generalInfo: generalInfo.system,
        wanInfo: generalInfo.wan,
        counters: counters,
        EVT_SYS_MAIN_COVER_OPENED: this.getAlarmOccurrenceInfo("EVT_SYS_MAIN_COVER_OPENED"),
        EVT_SYS_TERMINAL_COVER_OPENED: this.getAlarmOccurrenceInfo("EVT_SYS_TERMINAL_COVER_OPENED"),
        EVT_SYS_BATTERY_DISCHARGED: this.getAlarmOccurrenceInfo("EVT_SYS_BATTERY_DISCHARGED"),
        labels: {
            hostname: AppMain.t("HOSTNAME", "DASHBOARD"),
            cpuLoad: AppMain.t("CPU_LOAD", "DASHBOARD"),
            internalTemperature: AppMain.t("INTERNAL_TEMP", "DASHBOARD"),
            cpuCoreTemperature: AppMain.t("CPU_CORE_TEMP", "DASHBOARD"),
            supercapChargeLevel: AppMain.t("BACKUP_CHARGE_LEVEL", "DASHBOARD"),
            batteryVoltage: AppMain.t("BACKUP_BATTERY_VOLT", "DASHBOARD"),
            dataMemoryUsage: AppMain.t("DATA_M_USAGE", "DASHBOARD"),
            serial: AppMain.t("SERIAL_NMB", "DASHBOARD"),
            batteryLevel: AppMain.t("BATTERY_LVL", "DASHBOARD"),
            softwareVersion: AppMain.t("SOFTWARE_VER", "DASHBOARD"),
            firmwareVersion: AppMain.t("FIRMWARE_LIBRARY_VER", "DASHBOARD"),
            currentTime: AppMain.t("CURRENT_TIME", "DASHBOARD"),
            timezone: AppMain.t("TIMEZONE", "DASHBOARD"),
            uptime: AppMain.t("UP_TIME", "DASHBOARD"),
            wanModemStatus: AppMain.t("WAN_MODEM_STATUS", "DASHBOARD"),
            wanEthernetStatus: AppMain.t("WAN_ETHERNET_STATUS", "DASHBOARD"),
            nanPlcStatus: AppMain.t("NAN_PLC_STATUS", "DASHBOARD"),
            deviceType: AppMain.t("DEV_TYPE", "DASHBOARD"),
            status: AppMain.t("STATUS", "DASHBOARD"),
            modemSignal: AppMain.t("MODEM_SIGNAL", "DASHBOARD"),
            lastOccurrence: AppMain.t("LAST_OCCURRENCE", "DASHBOARD"),
            alarmName: AppMain.t("ALARM_NAME", "DASHBOARD"),
            EVT_SYS_MAIN_COVER_OPENED: AppMain.t("EVT_SYS_MAIN_COVER_OPENED", "DASHBOARD"),
            EVT_SYS_TERMINAL_COVER_OPENED: AppMain.t("EVT_SYS_TERMINAL_COVER_OPENED", "DASHBOARD"),
            EVT_SYS_BATTERY_DISCHARGED: AppMain.t("EVT_SYS_BATTERY_DISCHARGED", "DASHBOARD"),
            count: AppMain.t("COUNT", "DASHBOARD")
        }
    }, true);

    AppMain.html.updateElements([".mdl-tooltip"]);
};

CtrlActionDefault.getAlarmOccurrenceInfo = function (alarmName) {
    "use strict";

    let alarmInfo = {
        lastOcc: "---",
        count: "0"
    };

    const cnt = AppMain.ws().exec("GetEventCounter", {
        eventName: alarmName
    }).getResponse(false);

    if (defined(cnt.GetEventCounterResponse.EventCount)) {
        alarmInfo.count = cnt.GetEventCounterResponse.EventCount.count;
        if (alarmInfo.count !== "0") {
            alarmInfo.lastOcc = moment(cnt.GetEventCounterResponse.EventCount["last-accur"]).format(AppMain.localization("DATETIME_FORMAT"));
        }
    }

    return alarmInfo;
};

CtrlActionDefault.onAfterExecute = function () {
    "use strict";

    dmp("CtrlActionDefault.onAfterExecute");
    AppMain.html.updateAllElements();
};

CtrlActionDefault.onBeforeExecute = function () {
    "use strict";
    dmp("CtrlActionDefault.onBeforeExecute --> FROM default");
    // Clear show signal interval component
    clearInterval(AppMain.getComponent("ComWANSignalInterval"));
    AppMain.setComponent("ComWANSignalInterval", null);
};

CtrlActionDefault.init = function () {
    "use strict";
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

/**
 * Get capacitor charge level.
 * @return {String}
 */
CtrlActionDefault.batteryChargeLevelStr = function (level) {
    "use strict";
    const levelStr = {
        "BATTERY_NOT_INSTALLED": AppMain.t("NO_BATTERY", "DASHBOARD"),
        "BATTERY_EMPTY": AppMain.t("DISCHARGED", "DASHBOARD"),
        "BATTERY_LOW": AppMain.t("LOW", "DASHBOARD"),
        "BATTERY_FULL": AppMain.t("FULL", "DASHBOARD")
    };
    return defined(levelStr[level])
        ? levelStr[level]
        : "";
};

module.exports.CtrlActionDefault = CtrlActionDefault;