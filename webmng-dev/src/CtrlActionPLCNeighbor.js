/**
 * @class CtrlActionPLCNeighbor Controller action using IControllerAction interface.
 */

/* global AppMain, $ */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionPLCNeighbor = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionPLCNeighbor.exec = function () {
    "use strict";

    this.view.setTitle("PLC_NEIGHBOR");

    this.view.renderEmpty("PLCNeighbor#ViewNeighbors", {
        labels: {
            title: AppMain.t("TITLE", "PLC_NEIGHBOR")
        },
        htmlNeighbors: "---"
    }, true);

    const neighbors = AppMain.ws().exec("PlcNeighborTableGet", undefined).getResponse(false);

    const list = this.buildNeighborListHTML(neighbors);

    this.view.render("PLCNeighbor#ViewNeighbors", {
        labels: {
            title: AppMain.t("TITLE", "PLC_NEIGHBOR"),
            btnRefresh: AppMain.t("REFRESH_LIST", "PLC_NEIGHBOR"),
            btnExport: AppMain.t("EXP_SELECTED", "PLC_NEIGHBOR"),
            shortAddress: AppMain.t("SHORT_ADDRESS_SPLIT", "PLC_NEIGHBOR"),
            modulationScheme: AppMain.t("MODULATION_SCHEME_SPLIT", "PLC_NEIGHBOR"),
            toneMap: AppMain.t("TONE_MAP_SPLIT", "PLC_NEIGHBOR"),
            modulationType: AppMain.t("MODULATION_TYPE_SPLIT", "PLC_NEIGHBOR"),
            txGain: AppMain.t("TX_GAIN_SPLIT", "PLC_NEIGHBOR"),
            txCoeff: AppMain.t("TX_COEFF_SPLIT", "PLC_NEIGHBOR"),
            lqi: AppMain.t("LQI", "PLC_NEIGHBOR"),
            phaseDiff: AppMain.t("PHASE_DIFFERENCE_SPLIT", "PLC_NEIGHBOR"),
            tmrValidTime: AppMain.t("TMR_VALID_TIME_SPLIT", "PLC_NEIGHBOR"),
            neighborValidTime: AppMain.t("NEIGHBOR_VALID_TIME_SPLIT", "PLC_NEIGHBOR"),
            filter: AppMain.t("FILTER", "global")
        },
        htmlNeighbors: list.htmlNeighbors
    }, true);

    const tableOptions = {
        valueNames: ["short-address", "modulation-scheme", "tone-map", "modulation-type", "txGain", "tx-coeff", "lqi",
                "phase-differential", "tmr-valid-time", "neighbour-valid-time"]
    };
    this.initTable("neighborList", "neighborList", tableOptions);
    this.initSelectAll("selectAll");

    //Fix attached devices table width
    $(".main-canvas").addClass("main-canvas-attached-devices");
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionPLCNeighbor.buildNeighborListHTML = function (neighbor) {
    "use strict";

    let list = {totalNodes: 0, htmlNeighbors: ""};

    neighbor = (Object.prototype.toString.call(neighbor.PlcNeighborTableGetResponse["neighbour-table"]) === "[object Array]")
        ? neighbor.PlcNeighborTableGetResponse["neighbour-table"]
        : neighbor.PlcNeighborTableGetResponse;
    if (neighbor.__prefix !== undefined) {
        delete neighbor.__prefix;
    }

    let i = 1;
    $.each(neighbor, function(index, node) {
        let txGain = 0;
        if (node["tx-gain-resolution"] === "G3PLC_STEP_6_DB") {
            txGain = txGain * 6;
        } else {
            txGain = txGain * 3;
        }
        let shortAdd = parseInt(node["short-address"]).toString(16).toUpperCase();
        if (shortAdd.length % 2 !== 0) {
            shortAdd = "0" + shortAdd;
        }
        list.htmlNeighbors += "<tr>";
        list.htmlNeighbors += "<td class='checkbox-col'><input type='checkbox' name='selectNode' class='selectNode' " +
                "data-node-number='" + i + "' " +
                "data-node-short-address='" + shortAdd + "' " +
                "data-node-modulation-scheme='" + node["modulation-scheme"] + "' " +
                "data-node-tone-map='" + node["tone-map"] + "' " +
                "data-node-modulation-type='" + node["modulation-type"] + "' " +
                "data-node-tx-gain='" + txGain + "' " +
                "data-node-tx-coeff='" + node["tx-coeff"] + "' " +
                "data-node-lqi='" + node.lqi + "' " +
                "data-node-phase-differential='" + node["phase-differential"] + "' " +
                "data-node-tmr-valid-time='" + node["tmr-valid-time"] + "' " +
                "data-node-neighbour-valid-time='" + node["neighbour-valid-time"] + "'/></td>";
        // list.htmlNeighbors += "<td>"+i+"."+"</td>";
        list.htmlNeighbors += "<td class='short-address'>" + shortAdd + "</td>";
        list.htmlNeighbors += "<td class='modulation-scheme'>" + AppMain.t(node["modulation-scheme"], "PLC_NEIGHBOR") + "</td>";
        list.htmlNeighbors += "<td class='tone-map'>" + node["tone-map"] + "</td>";
        list.htmlNeighbors += "<td class='modulation-type'>" + AppMain.t(node["modulation-type"], "PLC_NEIGHBOR") + "</td>";
        list.htmlNeighbors += "<td class='txGain'>" + txGain + "</td>";
        list.htmlNeighbors += "<td class='tx-coeff'>" + node["tx-coeff"] + "</td>";
        list.htmlNeighbors += "<td class='lqi'>" + node.lqi + "</td>";
        list.htmlNeighbors += "<td class='phase-differential'>" + node["phase-differential"] + "</td>";
        list.htmlNeighbors += "<td class='tmr-valid-time'>" + node["tmr-valid-time"] + "</td>";
        list.htmlNeighbors += "<td class='neighbour-valid-time'>" + node["neighbour-valid-time"] + "</td>";
        list.htmlNeighbors += "</tr>";
        list.totalNodes += 1;
        i += 1;
    });

    return list;
};

CtrlActionPLCNeighbor.exportList = function () {
    "use strict";

    let csv = "";
    let inputC = $("input:checked");
    let isNotSelected = true;

    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        // csv += '"' + AppMain.t("#") + '",';
        csv += "\"" + AppMain.t("SHORT_ADDRESS", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("MODULATION_SCHEME", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("TONE_MAP", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("MODULATION_TYPE", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("TX_GAIN", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("TX_COEFF", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("LQI", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("PHASE_DIFFERENCE", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("TMR_VALID_TIME", "PLC_NEIGHBOR") + "\",";
        csv += "\"" + AppMain.t("NEIGHBOR_VALID_TIME", "PLC_NEIGHBOR") + "\"";
        csv += "\r\n";

        inputC.each(function(i, elm) {
            const element = $(elm);
            if (element.hasClass("selectNode")) {
                isNotSelected = false;
                // csv += element.attr("data-node-number") + ',';
                csv += "\"" + element.attr("data-node-short-address") + "\",";
                csv += "\"" + element.attr("data-node-modulation-scheme") + "\",";
                csv += "\"" + element.attr("data-node-tone-map") + "\",";
                csv += "\"" + element.attr("data-node-modulation-type") + "\",";
                csv += "\"" + element.attr("data-node-tx-gain") + "\",";
                csv += "\"" + element.attr("data-node-tx-coeff") + "\",";
                csv += "\"" + element.attr("data-node-lqi") + "\",";
                csv += "\"" + element.attr("data-node-phase-differential") + "\",";
                csv += "\"" + element.attr("data-node-tmr-valid-time") + "\",";
                csv += "\"" + element.attr("data-node-neighbour-valid-time") + "\"";
                csv += "\r\n";
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("NEIGHBOR_EXPORT", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_NEIGHBOUR", "success");

    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_PlcNeighbourTable_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
};

CtrlActionPLCNeighbor.init = function () {
    "use strict";

    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionPLCNeighbor.onBeforeExecute = function () {
    "use strict";

    $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionPLCNeighbor = CtrlActionPLCNeighbor;
