/**
 * @class CtrlActionWANModem Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionWANModem = Object.create(new modulecontrolleraction.IControllerAction());
const comsignal = require("./ComWANModemSignal");
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionWANModem.formId = "WANModemForm";

CtrlActionWANModem.getParamsRest = function () {
    "use strict";

    let params = AppMain.ws().exec("GetParameters", {"wan1": ""}).getResponse(false);
    params = defined(params.GetParametersResponse.wan1)
        ? params.GetParametersResponse.wan1
        : {};
    return params;
};

CtrlActionWANModem.updateParamsWithInfos = function (params) {
    "use strict";
    const infos = AppMain.ws().exec("GetInfos", undefined).getResponse(false);
    if (infos && defined(infos.GetInfosResponse)) {
        infos.GetInfosResponse.info.forEach(function (infoValue) {
            if (infoValue.category === "wan") {
                params[infoValue.name] = infoValue.value;
            }
        });
    }
    return params;
};

const getParamsType = function (params) {
    "use strict";
    return (params.Type)
        ? AppMain.t(params.Type, "WAN_MODEM")
        : "---";
};

CtrlActionWANModem.updateParamsTranslate = function (params) {
    "use strict";
    params.Type = getParamsType(params);
    if (!params.CardID) {
        params.CardID = "---";
    }
    if (!params.Network) {
        params.Network = "---";
    }
    if (!params.IMEI) {
        params.IMEI = "---";
    }
    return params;
};

CtrlActionWANModem.exec = function () {
    "use strict";

    this.view.setTitle("WAN_MODEM");
    let params = this.getParamsRest();
    params = this.updateParamsWithInfos(params);
    params = this.updateParamsTranslate(params);
    comsignal.ComWANModemSignal.getConnectionStatus(params);

    this.view.render(this.controller.action, {
        title: AppMain.t("WAN", "WAN_MODEM"),
        params: params,
        elements: {
            enable: AppMain.html.formElementSwitch("enable", "true", {
                checked: params.enable === "true",
                labelClass: "switchEnable",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionWANModem.useInterface",
                    "data-rbac-element": "wan1.enable"
                }
            })
        },
        labels: {
            "apply": AppMain.t("APPLY", "global"),
            "connectionType": AppMain.t("CONN_TYPE", "WAN_MODEM"),
            "wakeUpMode": AppMain.t("WAKE_UP_MODE", "WAN_MODEM"),
            "enable": AppMain.t("ENABLED", "global"),
            "password": AppMain.t("PASS", "WAN_MODEM"),
            "userName": AppMain.t("USERNAME", "WAN_MODEM"),
            "callNumber": AppMain.t("CALL_NMB", "WAN_MODEM"),
            "network": AppMain.t("NETWORK_NAME", "WAN_MODEM"),
            "gsmSignalLevel": AppMain.t("SIGNAL_LEVEL", "WAN_MODEM"),
            "gsmStatus": AppMain.t("CONN_STATUS", "WAN_MODEM"),
            "modemType": AppMain.t("MODEM_TYPE", "WAN_MODEM"),
            "wanIP": AppMain.t("IP_ADDRESS", "WAN_MODEM"),
            "wanHeartbeatIP": AppMain.t("IP_ADDRESS", "WAN_MODEM"),
            "wanBackupHeartbeatIP": AppMain.t("BACKUP_IP_ADDRESS", "WAN_MODEM"),
            "heartbeatPeriod": AppMain.t("HEARTBEAT_PERIOD", "WAN_MODEM"),
            "wanNetmask": AppMain.t("WAN_MASK", "WAN_MODEM"),
            "version": AppMain.t("MODEM_FIRMWARE_VERSION", "WAN_MODEM"),
            "IMEI": AppMain.t("MODEM_IMEI", "WAN_MODEM"),
            "cardID": AppMain.t("ICCID", "WAN_MODEM"),
            "apn": AppMain.t("APN_NAME", "WAN_MODEM"),
            "exportParams": AppMain.t("EXP_PARAMS", "global"),
            "groupTitleWAN": AppMain.t("NETWORK", "WAN_MODEM"),
            "groupTitleModem": AppMain.t("MODEM", "WAN_MODEM"),
            "groupTitleSIM": AppMain.t("SIM", "WAN_MODEM"),
            "heartbeat": AppMain.t("HEARTBEAT", "WAN_MODEM"),
            "heartbeatTimeout": AppMain.t("HEARTBEAT_TIMEOUT", "WAN_MODEM"),
            "heartbeatMaxRetry": AppMain.t("HEARTBEAT_MAX_RETRY", "WAN_MODEM")
        }
    });

    const enabled = params.enable === "true";
    CtrlActionWANModem.enableInterface(enabled);
    this.showSignalIndicator(params.GSM_Signal_Level, params);
    AppMain.html.updateElements([".mdl-textfield"]);
    this.justNumberInputCheck();
};

CtrlActionWANModem.init = function () {
    "use strict";
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionWANModem.setParams = function () {
    "use strict";
    const form = $("#" + CtrlActionWANModem.formId);
    let data = form.serialize();
    data = form.deserialize(data);

    const response = AppMain.ws().exec("SetParameters", {"wan1": data}).getResponse(false);
    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else {
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    }
    AppMain.html.updateElements([".mdl-button"]);
};

/**
 * Form element callback: enable/disable interface.
 */
CtrlActionWANModem.useInterface = function () {
    "use strict";
    // Show interface: enabled/disabled
    const switchButton = document.querySelector(".mdl-js-switch").MaterialSwitch;
    const enabled = $("[name='enable']").val() === "true";
    if (enabled === true) {
        $.confirm({
            title: AppMain.t("WAN", "WAN_MODEM"),
            content: AppMain.t("CONFIRM_PROMPT", "global"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        CtrlActionWANModem.enableInterface(!enabled);
                        if (enabled) {
                            switchButton.off();
                        } else {
                            switchButton.on();
                        }
                        CtrlActionWANModem.setParams();
                        return true;
                    }
                },
                cancel: {
                    text: AppMain.t("CANCEL", "global"),
                    action: function () {
                        switchButton.on(); //IE fix
                        return true;
                    }
                }
            }
        });
    } else {
        CtrlActionWANModem.enableInterface(!enabled);
        if (enabled) {
            switchButton.off();
        } else {
            switchButton.on();
        }
        CtrlActionWANModem.setParams();
    }
};

const processEnabledInterface = function () {
    "use strict";
    $("[name='enable']").val(true);
    $("#" + CtrlActionWANModem.formId).css({"color": "#000"});
    $("tr#FormActions > td").show();
    // tu noter daj preverjanje rbac!!!!
    if (AppMain.user.getRBACpermissionElement("wan1", "apn")) {
        $("input[type='text'][name='apn']").removeAttr("disabled");
    }
    if (AppMain.user.getRBACpermissionElement("wan1", "user-name")) {
        $("input[type='text'][name='user-name']").removeAttr("disabled");
    }
    if (AppMain.user.getRBACpermissionElement("wan1", "password")) {
        $("input[type='password'][name='password']").removeAttr("disabled");
    }
    $("input[type='checkbox']").removeAttr("disabled");
    $("label.mdl-switch").removeClass("is-disabled");
};

/**
 * Show interface as enabled/disabled (grayed out).
 * @param {Boolean} enabled
 */
CtrlActionWANModem.enableInterface = function (enabled) {
    "use strict";
    if (!enabled) {
        $("[name='enable']").val(false);
        $("#" + CtrlActionWANModem.formId).css({"color": "#e5e5e5"});
        this.processDisabledInterface();
    } else {
        processEnabledInterface();
    }
    AppMain.html.updateElements([".mdl-js-switch"]);
};

CtrlActionWANModem.showSignalIndicator = function (signal, params) {
    "use strict";
    comsignal.ComWANModemSignal.init({
        signal: signal,
        elementSelector: "#SignalLevelIndicator",
        params: params
    });
};

CtrlActionWANModem.exportParams = function () {
    "use strict";
    const response = AppMain.ws().exec("GetParameters", {"wan1": ""}).getResponse(false);

    if (defined(response.GetParametersResponse.wan1)) {
        let xml = "<wan1>\n";
        $.each(response.GetParametersResponse.wan1, function (elm, elmValue) {
            if (Object.prototype.toString.call(elmValue) === "[object Object]") {
                $.each(elmValue, function (value, elmSubValue) {
                    xml += "<" + elm + ">";
                    elmSubValue.forEach(function (param) {
                        xml += "<" + value + ">";
                        xml += param;
                        xml += "</" + value + ">\n";
                    });
                    xml += "</" + elm + ">\n";
                });
            } else {
                xml += "<" + elm + ">" + elmValue + "</" + elm + ">\n";
            }
        });
        xml += "</wan1>";
        const dateStr = moment(new Date()).format(AppMain.localization("EXPORT_DATETIME_FORMAT"));
        download("data:application/xml;charset=utf-8;base64," + btoa(xml), build.device + "_Parameters_Modem_" + dateStr + ".xml", "application/xml");
    }
};
module.exports.CtrlActionWANModem = CtrlActionWANModem;