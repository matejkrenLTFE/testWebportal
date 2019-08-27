/**
 * @class CtrlActionNANPlc Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined, dmp */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionNANPlc = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionNANPlc.formId = "NANPlcForm";
CtrlActionNANPlc.exec = function () {
    "use strict";
    this.view.setTitle("NAN_PLC");

    let params = AppMain.ws().exec("GetParameters", {"plc": ""}).getResponse(false);
    params = defined(params.GetParametersResponse.plc)
        ? params.GetParametersResponse.plc
        : {};

    this.view.render(this.controller.action, {
        title: AppMain.t("PLC", "NAN_PLC"),
        params: params,
        elements: {
            band: AppMain.html.formElementSelect("band", {"CENELEC_A": "CENELEC_A", "FCC": "FCC"}, {
                label: AppMain.t("SELECT_BAND", "NAN_PLC"),
                elementSelected: params.band,
                elementAttr: "data-rbac-element=\"plc.band\""
            }, undefined, "textfield-short-145 text-align-right")
        },
        labels: {
            "panId": AppMain.t("PAN_ID", "NAN_PLC"),
            "macAddress": AppMain.t("MAC_ADDRESS", "NAN_PLC"),
            "band": AppMain.t("FREQ_BAND", "NAN_PLC"),
            "macToneMask": AppMain.t("MAC_TONE_MASK", "NAN_PLC"),
            "psk": AppMain.t("PSK", "NAN_PLC"),
            "powerBackOff": AppMain.t("PLC_POWER_BACK_OFF", "NAN_PLC"),
            "useWhiteList": AppMain.t("USE_WHITE_LIST", "NAN_PLC"),
            "apply": AppMain.t("APPLY", "global"),
            "btnExportParams": AppMain.t("EXP_PARAMS", "global"),
            "plcModemRestartTooltip": AppMain.t("PLC_MODEM_RESTART", "NAN_PLC")
        }
    }, true);
};


CtrlActionNANPlc.setParams = function () {
    "use strict";
    dmp("setParams");
    const form = $("#" + CtrlActionNANPlc.formId);
    let data = form.serialize();
    data = form.deserialize(data);

    const response = AppMain.ws().exec("SetParameters", {"plc": data}).getResponse(false);
    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else {
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    }
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionNANPlc.exportParams = function () {
    "use strict";
    let response = AppMain.ws().exec("GetParameters", {"plc": ""}).getResponse(false);
    dmp("EXPORT PARAMS");
    dmp(response);

    if (defined(response.GetParametersResponse.plc)) {
        let xml = "<plc>\n";
        $.each(response.GetParametersResponse.plc, function (index, value) {
            if (Object.prototype.toString.call(value) === "[object Object]") {
                let key = Object.keys(value)[0];
                if (Object.prototype.toString.call(value[key]) === "[object Array]") {
                    $.each(value, function (secIndex, secValue) {
                        xml += "<" + index + ">";
                        secValue.forEach(function (param) {
                            xml += "<" + secIndex + ">";
                            xml += param;
                            xml += "</" + secIndex + ">\n";
                        });
                        xml += "</" + index + ">\n";
                    });
                } else {
                    xml += "<" + index + ">";
                    key = Object.keys(value)[0];
                    xml += "<" + key + ">" + value[`${key}`] + "</" + key + ">\n";
                    xml += "</" + index + ">\n";
                }
            } else {
                xml += "<" + index + ">" + value + "</" + index + ">\n";
            }
        });
        //return;
        xml += "</plc>";
        //return;
        const userRoleName = AppMain.user.getUserData("user-role-name");
        if (userRoleName !== "Factory") {
            //comment some lines
            //mac-address
            xml = xml.replace("<mac-address>", "<!--mac-address>");
            xml = xml.replace("</mac-address>", "<mac-address-->");
        }
        const dateStr = moment(new Date()).format(AppMain.localization("EXPORT_DATETIME_FORMAT"));
        download("data:application/xml;charset=utf-8;base64," + btoa(xml), build.device + "_Parameters_PLC_" + dateStr + ".xml", "application/xml");
    }
};

CtrlActionNANPlc.plcModemRestart = function () {
    "use strict";
    let html = AppMain.t("PLEASE_SELECT", "NAN_PLC") + "<br/><br/>";
    html += AppMain.html.formElementSelect("modem-reset-type", {"NETWORK-PRESERVATION": AppMain.t("NETWORK_PRESERVATION", "NAN_PLC"),
            "NETWORK-RESET": AppMain.t("NETWORK_RESET", "NAN_PLC")}, {
        elementSelected: "NETWORK_PRESERVATION"
    }, "330px") + "<br/><br/>";
    html += AppMain.t("CONFIRM_PLC_MODEM_RESET", "global");

    $.confirm({
        title: AppMain.t("PLC_MODEM_RESTART", "NAN_PLC"),
        content: html,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    return CtrlActionNANPlc.runPLCModemReset($("#modem-reset-type").val());
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

CtrlActionNANPlc.runPLCModemReset = function (resetType) {
    "use strict";
    /*const resp = */
    AppMain.ws().exec("ExecuteAction", {"PlcModemReset": resetType}).getResponse(false);
    return true;
};

module.exports.CtrlActionNANPlc = CtrlActionNANPlc;