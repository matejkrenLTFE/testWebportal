/**
 * @class CtrlActionPLCRouting Controller action using IControllerAction interface.
 */
let modulecontrolleraction = require("./IControllerAction");
let CtrlActionPLCRouting = Object.create(new modulecontrolleraction.IControllerAction);
let moment = require("moment");
let build = require("../build.info");

CtrlActionPLCRouting.exec = function() {
    this.view.setTitle("PLC_ROUTING");

    this.view.renderEmpty("PLCRouting#ViewRouting", {
        labels: {
            title: AppMain.t("TITLE", "PLC_ROUTING"),
        },
        htmlRouting: "---"
    }, true);
    let routing = [];
    try{
        routing = AppMain.ws().exec("PlcRoutingTableGet").getResponse();

    }catch (e) {
        console.log("err: PlcRoutingTableGet")
    }

    let list = this._buildNeighborListHTML(this, routing);

    this.view.render("PLCRouting#ViewRouting", {
        labels: {
            title: AppMain.t("TITLE", "PLC_ROUTING"),
            btnRefresh: AppMain.t("REFRESH_LIST", "PLC_ROUTING"),
            btnExport: AppMain.t("EXP_SELECTED", "PLC_ROUTING"),
            destinationAddress: AppMain.t("DESTINATION_ADDRESS_SPLIT", "PLC_ROUTING"),
            nextHopAddress: AppMain.t("NEXT_HOP_ADDRESS_SPLIT", "PLC_ROUTING"),
            routeCost: AppMain.t("ROUTE_COST_SPLIT", "PLC_ROUTING"),
            hopCount: AppMain.t("HOP_COUNT_SPLIT", "PLC_ROUTING"),
            weakLinkCount: AppMain.t("WEAK_LINK_COUNT_SPLIT", "PLC_ROUTING"),
            lifeTime: AppMain.t("LIFE_TIME_SPLIT", "PLC_ROUTING"),
            filter: AppMain.t("FILTER", "global")
        },
        htmlRouting: list.htmlRouting
    }, true);

    const tableOptions = {
        valueNames: ["destination-address", "next-hop-address", "route-cost", "hop-count", "weak-link-count", "life-time"]
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
CtrlActionPLCRouting._buildNeighborListHTML = function(_this, routing) {
    let list = {totalNodes: 0, htmlRouting:""};

    routing = (routing.PlcRoutingTableGetResponse["routing-table"] instanceof Array) ? routing.PlcRoutingTableGetResponse["routing-table"] : routing.PlcRoutingTableGetResponse;

    if (typeof routing["__prefix"] !== "undefined")
        delete routing["__prefix"];

    let i = 1;
    $.each(routing, function(index, node){
        let destAdd = parseInt(node["destination-address"]).toString(16).toUpperCase();
        if (destAdd.length % 2) {
            destAdd = '0' + destAdd;
        }
        let nextHopAdd = parseInt(node["next-hop-address"]).toString(16).toUpperCase();
        if (nextHopAdd.length % 2) {
            nextHopAdd = '0' + nextHopAdd;
        }

        list.htmlRouting += "<tr>";
        list.htmlRouting += "<td class='checkbox-col'><input type='checkbox' name='selectNode' class='selectNode' " +
            "data-node-number='" + i + "' " +
            "data-node-destination-address='" + destAdd + "' " +
            "data-node-next-hop-address='" + nextHopAdd + "' " +
            "data-node-rout-cost='" + node["route-cost"]  + "' " +
            "data-node-hop-count='" + node["hop-count"] + "' " +
            "data-node-weak-link-count='" + node["weak-link-count"] + "' " +
            "data-node-life-time='" + node["life-time"] + "'/></td>";

        list.htmlRouting += "<td class='destination-address'>" + destAdd + "</td>";
        list.htmlRouting += "<td class='next-hop-address'>" + nextHopAdd + "</td>";
        list.htmlRouting += "<td class='route-cost'>" + node["route-cost"] + "</td>";
        list.htmlRouting += "<td class='hop-count'>" + node["hop-count"] + "</td>";
        list.htmlRouting += "<td class='weak-link-count'>" + node["weak-link-count"] + "</td>";
        list.htmlRouting += "<td class='life-time'>" + node["life-time"] + "</td>";
        list.htmlRouting += "</tr>";
        list.totalNodes++;
        i++;
    });

    return list;
};


CtrlActionPLCRouting.exportList = function() {
    let csv="";
    let inputC = $("input:checked");
    let isNotSelected = true;

    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        // csv += '"' + AppMain.t("#") + '",';
        csv += '"' + AppMain.t("DESTINATION_ADDRESS", "PLC_ROUTING") + '",';
        csv += '"' + AppMain.t("NEXT_HOP_ADDRESS", "PLC_ROUTING") + '",';
        csv += '"' + AppMain.t("ROUTE_COST", "PLC_ROUTING") + '",';
        csv += '"' + AppMain.t("HOP_COUNT", "PLC_ROUTING") + '",';
        csv += '"' + AppMain.t("WEAK_LINK_COUNT", "PLC_ROUTING") + '",';
        csv += '"' + AppMain.t("LIFE_TIME", "PLC_ROUTING") + '"';
        csv += '\r\n';

        inputC.each(function(i, elm){
            let element = $(elm);
            if(element.hasClass("selectNode")) {
                isNotSelected = false;
                // csv += element.attr("data-node-number") + ',';
                csv += '"' + element.attr("data-node-destination-address") + '",';
                csv += '"' + element.attr("data-node-next-hop-address") + '",';
                csv += '"' + element.attr("data-node-rout-cost") + '",';
                csv += '"' + element.attr("data-node-hop-count") + '",';
                csv += '"' + element.attr("data-node-weak-link-count") + '",';
                csv += '"' + element.attr("data-node-life-time") + '"';
                csv += '\r\n';
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("ROUTING_EXPORT", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_ROUTING", "success");

    var download = require("./vendor/download.js");
    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_PlcRoutingTable_" + moment().format('YYYY-MM-DD-HH-mm-ss') + ".csv", "text/csv");
};

CtrlActionPLCRouting.init = function() {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionPLCRouting.onBeforeExecute = function() {
    $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionPLCRouting = CtrlActionPLCRouting;
