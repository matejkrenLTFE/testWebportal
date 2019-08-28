/**
 * @class CtrlActionSystemSettings Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
const CtrlActionSystemSettings = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");

CtrlActionSystemSettings.exec = function () {
    "use strict";

    this.view.setTitle("SYS_SETTINGS");

    const info = AppMain.ws().exec("GetInfos", undefined).getResponse(false);
    let generalInfo = {
        system: {}
    };

    $.each(info.GetInfosResponse.info, function (i, obj) {
        if (generalInfo[obj.category] !== undefined) {
            generalInfo[obj.category][obj.name] = (!obj.value)
                ? "---"
                : obj.value;
        }
    });
    generalInfo.system.DateTime = moment(generalInfo.system.DateTime).format(AppMain.localization("DATETIME_FORMAT"));

    let params = AppMain.ws().exec("GetParameters", {"dcmng": "", "iloc": "", "cntr": ""}).getResponse(false);
    params = defined(params.GetParametersResponse)
        ? params.GetParametersResponse
        : {};

    let timezones = AppMain.ws().exec("TimeZoneListGet", undefined).getResponse(false);
    if (timezones && timezones.TimeZoneListResponse) {
        timezones = timezones.TimeZoneListResponse.value;
    } else {
        timezones = {};
    }
    let timezoneObj = {};
    $.each(timezones, function (index, timezone) {
        timezoneObj[`${timezone}`] = timezone;
    });

    let intervalOpt = {
        "60": AppMain.t("HOUR1", "SYS_SETTINGS"),
        "180": AppMain.t("HOUR3", "SYS_SETTINGS"),
        "360": AppMain.t("HOUR6", "SYS_SETTINGS"),
        "720": AppMain.t("HOUR12", "SYS_SETTINGS"),
        "1440": AppMain.t("HOUR24", "SYS_SETTINGS"),
        "8640": AppMain.t("HOUR144", "SYS_SETTINGS")
    };
    if (defined(params.dcmng)) {
        if (!defined(intervalOpt[params.dcmng["ntp-sync-interval"]])) {
            intervalOpt[params.dcmng["ntp-sync-interval"]] = params.dcmng["ntp-sync-interval"] + " " + AppMain.t("MINUTES", "global");
        }
    }

    this.view.render(this.controller.action, {
        title: AppMain.t("SETTINGS", "SYS_SETTINGS"),
        titleTime: AppMain.t("TIME", "SYS_SETTINGS"),
        titleGeneral: AppMain.t("GENERAL", "SYS_SETTINGS"),
        elements: {
            selectTimezone: AppMain.html.formElementSelect("dcmng_sys-time-zone", timezoneObj, {
                label: "",
                elementSelected: defined(params.dcmng)
                    ? params.dcmng["sys-time-zone"]
                    : ""
            }, undefined, "textfield-short-145 text-align-right"),
            syncInterval: AppMain.html.formElementSelect("dcmng_ntp-sync-interval", intervalOpt, {
                label: AppMain.t("SELECT_INTERVAL", "SYS_SETTINGS"),
                elementSelected: defined(params.dcmng)
                    ? params.dcmng["ntp-sync-interval"]
                    : "",
                elementAttr: "data-rbac-element=\"settings.ntp-sync-interval\""
            }, undefined, "textfield-short-145 text-align-right"),
            enableSyncInterval: AppMain.html.formElementSwitch("enable", "true", {
                checked: !(defined(params.dcmng) && params.dcmng["ntp-sync-interval"] === "0"),
                labelClass: "switchEnable",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionSystemSettings.enableSyncIntervalClick",
                    "data-rbac-element": "settings.ntp-sync-interval"
                }
            }, undefined, "textfield-short-145 text-align-right")
        },
        paramsDcmng: defined(params.dcmng)
            ? params.dcmng
            : {},
        paramsIloc: defined(params.iloc)
            ? params.iloc
            : {},
        cntr: defined(params.cntr)
            ? params.cntr
            : {},
        params: {
            dateTime: generalInfo.system.DateTime
        },
        labels: {
            btnApply: AppMain.t("APPLY", "global"),
            btnApply2: AppMain.t("APPLY", "global"),
            btnApply3: AppMain.t("APPLY", "global"),
            btnSyncTime: AppMain.t("SYNC_TIME", "SYS_SETTINGS"),
            syncInterval: AppMain.t("SYNC_INTERVAL", "SYS_SETTINGS"),
            syncSystemTime: AppMain.t("SYNC_TIME_WITH_CLIENT", "SYS_SETTINGS"),
            dateTime: AppMain.t("DATE_TIME", "SYS_SETTINGS"),
            currentTime: AppMain.t("CURR_TIME", "SYS_SETTINGS"),
            device: AppMain.t("DEVICE", "SYS_SETTINGS"),
            server: AppMain.t("SERVER", "SYS_SETTINGS"),
            hostname: AppMain.t("HOSTNAME", "SYS_SETTINGS"),
            timezone: AppMain.t("TIMEZONE", "SYS_SETTINGS"),
            ntp: AppMain.t("NTP", "SYS_SETTINGS"),
            titleSet: AppMain.t("TITLE_SET", "SYS_SETTINGS"),
            pushRetries: AppMain.t("PUSH_RETRIES", "SYS_SETTINGS"),
            pushTimeout: AppMain.t("PUSH_TIMEOUT", "SYS_SETTINGS")
        }
    });
    this.enableSyncInterval(defined(params.dcmng) && params.dcmng["ntp-sync-interval"] === "0");
    AppMain.html.updateElements([".mdl-button", ".mdl-select"]);
};

CtrlActionSystemSettings.syncTime = function () {
    "use strict";

    if (!AppMain.user.getRBACpermissionElement("settings", "button-sync-time")) {
        return;
    }
    const time = new Date().toISOString();
    const resp = AppMain.ws().exec("DateTimeSet", time).getResponse(false);

    if (defined(resp.DateTimeSetResponse) && resp.DateTimeSetResponse.toString() === "OK") {
        AppMain.dialog("TIME_SYNC_WIH_CLIENT", "success", [time]);
    }
    this.exec();
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionSystemSettings.setParams = function () {
    "use strict";

    let params = {
        iloc: {
            "host-name": $("[name='iloc_host-name']").val()
        },
        dcmng: {
            "ntp-server": $("[name='dcmng_ntp-server']").val(),
            "ntp-sync-interval": $("[name='dcmng_ntp-sync-interval']").val(),
            "sys-time-zone": $("[name='dcmng_sys-time-zone']").val()
        },
        cntr: {
            "push-retries": $("#data-push-retries").val(),
            "push-retry-timeout": $("#data-push-retry-timeout").val()

        }
    };
    if ($("[name='enable']").val() === "false") {
        params.dcmng["ntp-sync-interval"] = "0";
    }

    const resp = AppMain.ws().exec("SetParameters", params).getResponse(false);
    if (defined(resp.SetParametersResponse) && resp.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else {
        AppMain.dialog("Error occurred!", "error");
    }
    this.exec();
    AppMain.html.updateElements([".mdl-button"]);
};

/**
 * Form element callback: enable/disable interface.
 */
CtrlActionSystemSettings.enableSyncIntervalClick = function () {
    "use strict";

    // Show interface: enabled/disabled
    const switchButton = document.querySelector(".mdl-js-switch").MaterialSwitch;
    const enabled = $("[name='enable']").val() === "true";

    this.enableSyncInterval(enabled);
    if (enabled) {
        switchButton.off();
    } else {
        switchButton.on();
    }
};

CtrlActionSystemSettings.enableSyncInterval = function (enabled) {
    "use strict";

    const en = $("[name='enable']");
    if (enabled) { //now it is true -> make it false
        en.val(false);
        $(".ntp-sync-int").css({"color": "rgba(0,0,0,.5)"});
        $(".ntp-sync-int .mdl-textfield").addClass("is-disabled");
        $(".ntp-sync-int .mdl-select").addClass("is-disabled");
        $("input[name='dcmng_ntp-server']").attr("disabled", "disabled");
        $("select[name='dcmng_ntp-sync-interval']").attr("disabled", "disabled");
        $("label.mdl-switch").addClass("is-disabled");
    } else { // now it is false -> make it true
        en.val(true);
        $(".ntp-sync-int .is-disabled").removeClass("is-disabled");
        $(".ntp-sync-int .mdl-select").removeClass("is-disabled");
        $(".ntp-sync-int").css({"color": "#000"});
        $("input[name='dcmng_ntp-server']").removeAttr("disabled");
        $("select[name='dcmng_ntp-sync-interval']").removeAttr("disabled");
        $("label.mdl-switch").removeClass("is-disabled");
    }

    AppMain.html.updateElements([".mdl-js-switch", ".mdl-textfield", ".mdl-select"]);
};

module.exports.CtrlActionSystemSettings = CtrlActionSystemSettings;