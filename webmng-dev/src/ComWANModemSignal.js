/**
 * WAM modem signal level graphic
 * @class ComWANModemSignal View component
 */
/* global AppMain, $, defined, dmp */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecomponent = require("./IComponent");
let ComWANModemSignal = Object.create(new modulecomponent.IComponent());

ComWANModemSignal.signal = null;
ComWANModemSignal.elementSelector = "";
ComWANModemSignal.init = function (config) {
    "use strict";

    if (!defined(config.elementSelector)) {
        throw "ComWANModemSignal: no element selector defined!";
    }

    this.signal = defined(config.signal)
        ? config.signal
        : 99;
    this.elementSelector = config.elementSelector;

    this.render(config.params);
};
/**
 * Main render method.
 */
ComWANModemSignal.render = function (params) {
    "use strict";

    $(this.elementSelector).removeClass();
    $(this.elementSelector).addClass("signalLevel_" + this.getSignalLevel(this.signal));

    const statusInt = parseInt(params.GSM_Status, 10);
    let statusByteString = statusInt.toString(2);
    while (statusByteString.length < 32) {
        statusByteString = "0" + statusByteString;
    }
    statusByteString = statusByteString.split("").reverse().join(""); // reverse for easier reading

    if (statusByteString[16] === "1") { // roaming
        $(this.elementSelector).addClass("roaming");
    }
    let tooltipText = this.rangesTooltip[this.getSignalLevel(this.signal)];
    if (!tooltipText) {
        tooltipText = AppMain.t("RSSI_ERROR", "global");
    }
    $(".SignalLevelTooltip").html(tooltipText);
};
/**
 * Translate numeric RSSI signal into string.
 */
ComWANModemSignal.getSignalLevel = function (signal) {
    "use strict";
    let level = null;
    signal = parseInt(signal, 10);
    if (defined(ComWANModemSignal.ranges[signal])) {
        level = ComWANModemSignal.ranges[signal];
    } else {
        $.each(ComWANModemSignal.ranges, function (index, item) {
            const range = index.split("-");
            if (range.length > -1 && signal >= range[0] && signal <= range[1]) {
                level = item;
            }
        });
    }

    if (level === null) {
        level = "RSSI_NO_SIGNAL";
    }

    return level;
};

ComWANModemSignal.ranges = {
    "0-9": "RSSI_VERY_LOW",
    "10-17": "RSSI_LOW",
    "18-24": "RSSI_MEDIUM",
    "25-31": "RSSI_HIGH",
    "99": "RSSI_UNKNOWN",
    "-1": "RSSI_ERROR"
};

ComWANModemSignal.rangesTooltip = {
    "RSSI_VERY_LOW": AppMain.t("RSSI_VERY_LOW", "global"),
    "RSSI_LOW": AppMain.t("RSSI_LOW", "global"),
    "RSSI_MEDIUM": AppMain.t("RSSI_MEDIUM", "global"),
    "RSSI_HIGH": AppMain.t("RSSI_HIGH", "global"),
    "RSSI_UNKNOWN": AppMain.t("RSSI_ERROR", "global"),
    "RSSI_ERROR": AppMain.t("RSSI_ERROR", "global"),
    "RSSI_NO_SIGNAL": AppMain.t("RSSI_ERROR", "global")
};

ComWANModemSignal.getBitStatus = function (statusCode) {
    "use strict";

    dmp("GET BIT STATUS");
    const status = {
        "0": "GSMRegistered",
        "1": "InstalationCallDone (not used)",
        "2": "GPRSRegistered",
        "3": "ActivePDPContext",
        "4": "Reserved04",
        "5": "Reserved05",
        "6": "Reserved06",
        "7": "Reserved07",
        "8": "SIMCardError",
        "9": "SIMCardPINRequire",
        "10": "ModemResetPending (not used)",
        "11": "InstalationCallFailure (not used)",
        "12": "Reserved12",
        "13": "Reserved13",
        "14": "Reserved14",
        "15": "Reserved15",
        "16": "GSMRoaming",
        "17": "GSMRegisterStopped",
        "18": "GSMRegisterSearch",
        "19": "GSMRegisterDenied",
        "20": "GSMRegisterUnknown",
        "21": "GPRSRoaming",
        "22": "GPRSRegisterStopped",
        "23": "GPRSRegisterSearch",
        "24": "GPRSRegisterDenied",
        "25": "GPRSRegisterUnknown",
        "26": "Network3G",
        "27": "SIMCardPUKRequire",
        "28": "Reserved28",
        "29": "Reserved29",
        "30": "Reserved30",
        "31": "Reserved31"
    };
    dmp(statusCode);
    return defined(status[statusCode])
        ? status[statusCode]
        : "Unknown";
};


ComWANModemSignal.getConnectionStatus = function (params) {
    "use strict";

    const statusInt = parseInt(params.GSM_Status, 10);
    let statusByteString = statusInt.toString(2);
    while (statusByteString.length < 32) {
        statusByteString = "0" + statusByteString;
    }
    statusByteString = statusByteString.split("").reverse().join(""); // reverse for easier reading

    // // test 2G
    // statusByteString = "10110000100000001000000000000000";
    // // test 3G
    // statusByteString = "10010000100000001000000000100000";
    // // test 4G
    // statusByteString = "10010000100000001000000000001000";
    // statusByteString = "10000000100000000000000000001000";
    // 00000000100000000100001000000000

    let status = {
        txt: AppMain.t("NOT_REGISTERED", "global"),
        icon1: "",
        icon2: "",
        icon1Tooltip: "",
        icon1Style: "display:none;",
        icon2Tooltip: "",
        icon2Style: "display:none;"
    };
    if (statusByteString[0] === "0" && statusByteString[16] === "0") { // Not registered
        status.txt = AppMain.t("NOT_REGISTERED", "global");
        //modem not registered, look for errors
        if (statusByteString[8] === "1") {
            status.txt = AppMain.t("SIM_ERROR", "global");
        } else {
            if (statusByteString[9] === "1") {
                status.txt = AppMain.t("PIN_REQ", "global");
            } else {
                if (statusByteString[27] === "1") {
                    status.txt = AppMain.t("PUK_REQ", "global");
                }
            }
        }
    } else { //registered
        status.txt = "";
        let green = "";
        if (statusByteString[3] === "1") {
            green = " green";
            status.icon1Style = "G3PLC-NODE-ACTIVE";
        }
        if (statusByteString[2] === "1") { //2G
            status.txt = AppMain.t("NETWORK2G", "global");
            status.icon1 = "N2G" + green;
            status.icon1Tooltip = AppMain.t("NETWORK2G", "global");
            // status.icon1Style= ""
        }
        if (statusByteString[26] === "1") { //3G
            status.txt = AppMain.t("NETWORK3G", "global");
            status.icon1 = "N3G" + green;
            status.icon1Tooltip = AppMain.t("NETWORK3G", "global");
            // status.icon1Style= ""
        }
        if (statusByteString[28] === "1") { //4G
            status.txt = AppMain.t("NETWORK4G", "global");
            status.icon1 = "N4G" + green;
            status.icon1Tooltip = AppMain.t("NETWORK4G", "global");
            // status.icon1Style= ""
        }
        if (statusByteString[16] === "1") {
            status.icon2 = "roaming";
            status.icon2Tooltip = AppMain.t("ROAMING", "global");
            status.icon2Style = "";
        }
    }
    /*eslint-disable camelcase*/
    params.GSM_Status_txt = status.txt;
    params.GSM_Status_icon1 = status.icon1;
    params.GSM_Status_icon1Tooltip = status.icon1Tooltip;
    params.GSM_Status_icon1Style = status.icon1Style;
    params.GSM_Status_icon2 = status.icon2;
    params.GSM_Status_icon2Tooltip = status.icon2Tooltip;
    params.GSM_Status_icon2Style = status.icon2Style;
    /*eslint-enable camelcase*/
};
module.exports.ComWANModemSignal = ComWANModemSignal;