/**
 * @class CtrlActionNodes Controller action using IControllerAction interface.
 */
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionNodes = Object.create(new modulecontrolleraction.IControllerAction);
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionNodes.exec = function () {
    this.view.setTitle("NODES");

    this.view.renderEmpty("Nodes", {
        labels: {
            title: AppMain.t("LIST_ATT_DEV", "NODES"),
            description: ""
        },
        htmlNodes: "---",
        totalNodes: 0,
        activeNodes: 0
    }, true);

    let nodes = AppMain.ws().exec("GetNodeList", {"with-data": true}).getResponse(false);

    nodes = (nodes && nodes.GetNodeListResponse && nodes.GetNodeListResponse.node instanceof Array) ?
        nodes.GetNodeListResponse.node : nodes.GetNodeListResponse;
    if (typeof nodes["__prefix"] !== "undefined")
        delete nodes["__prefix"];

    const nodesCosemStat = AppMain.wsMes().exec("CosemDeviceStatisticRequest", undefined).getResponse(false);
    this.nodesCosemStat = {};
    if (nodesCosemStat && nodesCosemStat.GetCosemDeviceStatisticResponse &&
        nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"])
        nodes = this.arrangeNodes(nodes, nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"]);

    let list = this._buildNodeListHTML(this, nodes);
    const totalDC = list.joinedNodes+ list.commissionedNodes+ list.activeNodes+ list.notActiveNodes+ list.lostNodes;

    this.view.render("Nodes", {
        labels: {
            title: AppMain.t("LIST_ATT_DEV", "NODES"),
            description: "",
            btnRefresh: AppMain.t("REFRESH_LIST", "NODES"),
            btnKickOff: AppMain.t("KICK_OFF_SEL", "NODES"),
            btnExport: AppMain.t("EXP_SELECTED", "NODES"),
            ipAddress: AppMain.t("IP_ADDRESS", "NODES"),
            macAddress: AppMain.t("MAC_ADDRESS", "NODES"),
            macAddressSplit: AppMain.t("MAC_ADDRESS_SPLIT", "NODES"),
            shortAddress: AppMain.t("SHORT_ADDRESS_SPLIT", "NODES"),
            joinTime: AppMain.t("JOIN_TIME", "NODES"),
            successRate: AppMain.t("SUCCESS_RATE", "NODES"),
            succRateSplit: AppMain.t("SUCCESS_RATING_SPLIT", "NODES"),
            succRate: AppMain.t("SUCCESS_RATING", "NODES"),
            rxPackets: AppMain.t("RX_PACKETS", "NODES"),
            txPackets: AppMain.t("TX_PACKETS", "NODES"),
            nodeState: AppMain.t("NODE_STATE", "NODES"),
            lastCommunicationTime: AppMain.t("LAST_SUCC_COMM_TIME", "NODES"),
            commissioningTime: AppMain.t("COMMISSIONING_TIME_SPLIT", "NODES"),
            lastCommunicationTimeShort: AppMain.t("LAST_SUCC_COMM_TIME_SHORT", "NODES"),
            lastCommunicationTimeSplit: AppMain.t("LAST_SUCC_COMM_TIME_SPLIT", "NODES"),
            totalAttachedDevices: AppMain.t("TOTAL_ATT_DEV", "NODES"),
            deviceTitle: AppMain.t("DEVICE_TITLE", "NODES"),
            deviceTitleSplit: AppMain.t("DEVICE_TITLE_SPLIT", "NODES"),
            dcStatus: AppMain.t("DC_STATUS", "NODES"),
            plcStatus: AppMain.t("PLC_STATUS", "NODES"),
            plcStatusSplit: AppMain.t("PLC_STATUS_SPLIT", "NODES"),
            attachedDevicesSummary: AppMain.t("ATT_DEV_STATISTICS", "NODES"),
            activeDevices: AppMain.t("ACTIVE_DEVICES", "NODES"),
            joinedDevices: AppMain.t("JOINED_DEVICES", "NODES"),
            routeDiscoveredNodes: AppMain.t("ROUTE_DISCOVERED_DEVICES", "NODES"),
            commissionedNodes: AppMain.t("COMMISSIONED_DEVICES", "NODES"),
            notAvailableNodes: AppMain.t("NOT_AVAILABLE_DEVICES", "NODES"),
            notActiveNodes: AppMain.t("NOT_ACTIVE_DEVICES", "NODES"),
            lostNodes: AppMain.t("LOST_DEVICES", "NODES"),
            statisticsTime: AppMain.t("STATISTICS_TIME", "NODES"),
            filter: AppMain.t("FILTER", "global")
        },
        htmlNodes: list.htmlNodes,
        htmlTooltips: list.htmlTooltips,
        totalNodes: list.totalNodes,
        totalNodesDC: totalDC,
        totalDevicesText: (totalDC === 1 ? AppMain.t("DEVICE", "NODES") : AppMain.t("DEVICES", "NODES")),
        activeNodes: list.activeNodes,
        joinedNodes: list.joinedNodes,
        commissionedNodes: list.commissionedNodes,
        notActiveNodes: list.notActiveNodes,
        lostNodes: list.lostNodes,
        statisticsTime: moment().format(AppMain.localization("DATETIME_FORMAT"))
    }, true);

    const tableOptions = {
        valueNames: ["short-address", "mac-address", "node-title", "dc-state", "node-state", "device-joined", "success-rate",
            "device-last-tx-ack-timestamp", "ack-timestamp"]
    };
    this.initTable("nodesList", "nodesList", tableOptions);
    this.initSelectAll("selectAllNodes");

    const dataValues = [list.joinedNodes, list.commissionedNodes, list.activeNodes, list.notActiveNodes, list.lostNodes];
    const dataColors = ["rgb(102, 153, 255)", "rgb(0, 0, 255)", "#009E00", "rgb(249, 168, 7)", "rgb(255,0,0)"];
    const centerColor = "#009E00";

    const data = {
        datasets: [{
            data: dataValues,
            backgroundColor: dataColors
        }],
        labels: [
            AppMain.t("JOINED_DEVICES", "NODES"),
            AppMain.t("COMMISSIONED_DEVICES", "NODES"),
            AppMain.t("ACTIVE_DEVICES", "NODES"),
            AppMain.t("NOT_ACTIVE_DEVICES", "NODES"),
            AppMain.t("LOST_DEVICES", "NODES")
        ]
    };

    const ctx2 = document.getElementById('chart_attached').getContext('2d');

    new Chart(ctx2, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: false,
                text: 'Attached devices'
            },
            animation: {
                animateScale: true,
                animateRotate: true
            },
            legend: {
                position: "left"
            },
            elements: {
                center: {
                    text: totalDC > 0 ? parseInt((list.activeNodes / totalDC) * 100) + "%" : "",
                    color: centerColor,
                    fontStyle: 'Arial',
                    sidePadding: 20
                }
            }
        }
    });
    $(".main-canvas").addClass("main-canvas-attached-devices");
    AppMain.html.updateAllElements();
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionNodes._buildNodeListHTML = function (_this, nodes) {
    let list = {
        totalNodes: 0,
        htmlNodes: "",
        htmlTooltips: "",
        joinedNodes: 0, //meter-joined
        commissionedNodes: 0, //METER-COMMISSIONED
        activeNodes: 0,
        notActiveNodes: 0,
        lostNodes: 0
    };

    let successRate = 0;
    let i = 1;
    $.each(nodes, function (index, node) {
        let shortAddress = "";
        if(node["ip-address"]){
            const arr = node["ip-address"].split(":");
            shortAddress = arr[arr.length-1].toUpperCase();
            if(shortAddress.length%2 === 1){
                shortAddress = "0" + shortAddress;
            }
        }
        let deviceLastRxTimestamp = "---";
        if (node["device-last-rx-timestamp"])
            deviceLastRxTimestamp = node["device-last-rx-timestamp"];
        let deviceLastTxAckTimestamp = "---";
        if (node["device-last-tx-ack-timestamp"] && node["device-last-tx-ack-timestamp"] !== "0" && node["device-last-tx-ack-timestamp"] !== 0)
            deviceLastTxAckTimestamp = node["device-last-tx-ack-timestamp"];
        let deviceLastTxNoAckTimestamp = "---";
        if (node["device-last-tx-no-ack-timestamp"] && node["device-last-tx-no-ack-timestamp"]!== "0" && node["device-last-tx-no-ack-timestamp"] !== 0)
            deviceLastTxNoAckTimestamp = node["device-last-tx-no-ack-timestamp"];
        let deviceJoined = "---";
        if (node["device-joined"] && node["device-joined"]!== "0" && node["device-joined"] !== 0)
            deviceJoined = moment(node["device-joined"]).format(AppMain.localization("DATETIME_FORMAT"));
        let commissioningTime = "---";
        if (node["node-commissioned"] && node["node-commissioned"]!== "0" && node["node-commissioned"] !== 0){
            commissioningTime = moment(node["node-commissioned"]).format(AppMain.localization("DATETIME_FORMAT"));
        }


        let lastSuccTime = "---";
        if (node["node-last-comm"] && node["node-last-comm"]!== "0" && node["node-last-comm"]!== "---" && node["node-last-comm"] !== 0)
            lastSuccTime = moment(node["node-last-comm"]).format(AppMain.localization("DATETIME_FORMAT"));

        successRate = (node["tx-ack-packets"] > 0) ? Math.ceil((parseInt(node["tx-ack-packets"]) / (parseInt(node["tx-ack-packets"]) + parseInt(node["tx-no-ack-packets"]))) * 100) : 0;
        if (isNaN(successRate)) {
            successRate = 0;
        }
        list.htmlNodes += "<tr>";

        list.htmlNodes += "<td class='checkbox-col cursor-default'><input type='checkbox' name='selectNode' class='selectNode cursor-pointer' data-node-mac='" + node["mac-address"] +
            "' data-node-ip-address='" + node["ip-address"] + "' " +
            "data-node-device-joined='" + (deviceJoined !== "---" ? moment(deviceJoined).toISOString(): deviceJoined) +
            "' data-node-number='" + i + "' " +
            "data-node-rx-packets='" + node["rx-packets"] + "' data-node-tx-packets='" + node["tx-ack-packets"] +
            "'" + " data-device-last-tx-ack-timestamp='" + deviceLastTxAckTimestamp +
            "'" + " data-node-rx-link-quality='" + node["rx-link-quality"] +
            "'" + " data-node-short='" + shortAddress +
            "'" + " data-node-commissioned='" + (commissioningTime !== "---" ? moment(commissioningTime).toISOString() : commissioningTime) +
            "'" + " data-node-succ-comm='" + (lastSuccTime!== "---" ? moment(lastSuccTime).toISOString() : lastSuccTime) +
            "'" + " data-node-tx-ack-packets='" + node["tx-ack-packets"] +
            "'" + " data-node-tx-no-ack-packets='" + node["tx-no-ack-packets"] +
            "'" + " data-device-last-rx-timestamp='" + deviceLastRxTimestamp +
            "'" + " data-node-title='" + (node["node-title"] !== undefined ? node["node-title"] : "---") +
            "'" + " data-node-dc-state='" + (node["node-title"] !== undefined ? CtrlActionNodes.getNodeStateString(node["dc-state"]) : "---") +
            "'" + " data-node-state='" + CtrlActionNodes.getNodeStateString(node["node-state"]) +
            "'" + " data-node-successful-communications='" + (node["node-title"] !== undefined ? node["successful-communications"] : "---") +
            "'" + " data-node-last-successful-communication='" + (node["node-title"] !== undefined ? moment(node["last-successful-communication"].toString()).toISOString() : "---") +
            "'" + " data-node-unsuccessful-communications='" + (node["node-title"] !== undefined ? node["unsuccessful-communications"] : "---") +
            "'" + " data-node-last-unsuccessful-communication='" + (node["node-title"] !== undefined ? moment(node["last-unsuccessful-communication"].toString()).toISOString() : "---") +
            "'" + " data-node-security-counter='" + (node["node-title"] !== undefined ? node["security-counter"] : "---") +
            "'" + " data-node-success-rate='" + (node["success-rate"] !== undefined ? node["success-rate"] + "%" : "---") +
            "'" + " data-device-last-tx-no-ack-timestamp='" + deviceLastTxNoAckTimestamp + "' /></td>";

        list.htmlNodes += "<td class='short-address' class='cursor-default'>" + shortAddress + "</td>";
        list.htmlNodes += "<td class='mac-address' data-bind-event='click' data-bind-method='CtrlActionNodes.getNodeInfo' " +
            " data-node-mac='" + node["mac-address"] + "'>" + node["mac-address"] + "</td>";
        list.htmlNodes += "<td class='node-title' data-bind-event='click' " +
            "data-bind-method='CtrlActionNodes.getNodeInfoTitle' data-node-mac='" + node["mac-address"] + "'>" +
            (node["node-title"] !== undefined ? node["node-title"] : "---") + "</td>";

        list.htmlNodes += "<td class='cursor-default'>" + ((node["node-title"] !== undefined && node["node-title"]!=="---") ?
            "<span class='mdl-chip " + node["dc-state"] + "'><span class='mdl-chip__text dc-state'>" + CtrlActionNodes.getNodeStateString(node["dc-state"]) + "</span></span>" :
            "<span class='mdl-chip METER-JOINED'><span class='mdl-chip__text dc-state'>" + CtrlActionNodes.getNodeStateString("METER-JOINED") + "</span></span>")
            + "</td>";

        list.htmlNodes += "<td class='cursor-default'><span class='mdl-chip " + node["node-state"] + "'><span class='mdl-chip__text node-state'>" +
            CtrlActionNodes.getNodeStateString(node["node-state"]) + "<span></span></td>";

        list.htmlNodes += "<td class='success-rate cursor-default' data-sort-value='" + (node["success-rate"] !== undefined ? node["success-rate"] : "0") +"'>" + (node["success-rate"] !== undefined ? node["success-rate"] + "%" : "---") + "</td>";

        list.htmlNodes += "<td class='device-joined cursor-default'>" + commissioningTime + "</td>";

        list.htmlNodes += "<td class='ack-timestamp cursor-default'>" + lastSuccTime + "</td>";

        list.htmlNodes += "<td  class='cursor-default'>";
        list.htmlNodes += "<i id='ping_" + i + "'  data-rbac=\"nodes.ping\" class=\"material-icons cursor-pointer\" data-bind-event=\"click\" data-bind-method=\"CtrlActionNodes.ping\" data-node-mac='" + node["mac-address"] + "'>import_export</i>";

        list.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"ping_" + i + "\">" + AppMain.t("PING", "NODES") + "</div>";

        list.htmlNodes += "<i id='kickOff_" + i + "' data-rbac=\"nodes.kickoff\" class=\"material-icons cursor-pointer\" data-bind-event=\"click\" data-bind-method=\"CtrlActionNodes.kickOffNode\" data-node-mac='" + node["mac-address"] + "'>clear</i>";

        list.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"kickOff_" + i + "\">" + AppMain.t("KICK_OFF", "NODES") + "</div>";

        list.htmlNodes += "</td>";
        list.htmlNodes += "</tr>";
        i++;
        list.totalNodes++;
        switch (node["dc-state"]) {
            case "METER-JOINED":
            case "":
                list.joinedNodes++;
                break;
            case "METER-COMMISSIONED":
                list.commissionedNodes++;
                break;
            case "METER-NO-KEYS":
                list.notActiveNodes++;
                break;
            case "METER-WRONG-KEYS":
                list.notActiveNodes++;
                break;
            case "METER-LOST":
                list.lostNodes++;
                break;
            case "METER-ACTIVE":
                list.activeNodes++;
                break;
            case "METER-NOT-AVAILABLE":
                list.notActiveNodes++;
                break;
        }
    });

    return list;
};

CtrlActionNodes.getNodeInfo = function (e) {
    let $this = $(e.target);
    const randomId = "MAC_R_EXT";

    if ($this.attr("data-opened") === "1") {
        $this.attr("data-opened", 0);
        $("table tr.nodeListShowDetails.id_" + $this.attr("data-rid")).remove();
        return;
    }

    $("table tr td[data-opened]").attr("data-opened", "0");
    $("table tr.nodeListShowDetails.id_MAC_R_EXT").remove();
    $("table tr.nodeListShowDetails.id_TITLE_R_EXT").remove();

    let nodeMac = $this.attr("data-node-mac");
    let nodeInfo = AppMain.ws().exec("GetNodeList", {
        "mac-address": nodeMac,
        "with-data": true
    }).getResponse(false);

    if (defined(nodeInfo.GetNodeListResponse.node)) {
        const node = nodeInfo.GetNodeListResponse.node;
        //update node last joined time
        let lastComm = "---";
        if (node["device-last-tx-ack-timestamp"] && node["device-last-tx-ack-timestamp"] !== "0" && node["device-last-tx-ack-timestamp"] !== 0)
            lastComm = moment(node["device-last-tx-ack-timestamp"]).format(AppMain.localization("DATETIME_FORMAT"));

        let deviceJoined = "---";
        if (node["device-joined"] && node["device-joined"]!== "0" && node["device-joined"] !== 0)
            deviceJoined = moment(node["device-joined"]).format(AppMain.localization("DATETIME_FORMAT"));

        // $this.parent().find(".ack-timestamp").html(lastComm);
        $this.attr("data-opened", 1);
        $this.attr("data-rid", randomId);

        let html = "<tr class='nodeListShowDetails id_" + randomId + "'>";


        html += "<td colspan='3'>" + AppMain.t("IP_ADDRESS", "NODES") + "</td>";
        html += "<td colspan='2'>" + node["ip-address"] + "</td><td></td>";

        html += "<td colspan='2'>" + AppMain.t("TX_NO_ACK_PACKETS", "NODES") + "</td>";
        html += "<td>" + node["tx-no-ack-packets"] + "</td><td></td>";
        html += "</tr>";

        html += "<tr class='nodeListShowDetails id_" + randomId + "'>";

        html += "<td colspan='3'>" + AppMain.t("RX_PACKETS", "NODES") + "</td>";
        html += "<td colspan='2'>" + node["rx-packets"] + "</td><td></td>";


        html += "<td colspan='2'>" + AppMain.t("DEV_LAST_RX_TIMESTAMP", "NODES") + "</td>";
        if (node["device-last-rx-timestamp"] && node["device-last-rx-timestamp"]!== "0" && node["device-last-rx-timestamp"]!== 0)
            html += "<td>" + moment(node["device-last-rx-timestamp"]).format(AppMain.localization("DATETIME_FORMAT")) + "</td><td></td>";
        else
            html += "<td>---</td><td></td>";

        html += "</tr>";
        html += "<tr class='nodeListShowDetails id_" + randomId + "'>";

        html += "<td colspan='3'>" + AppMain.t("RX_LINK_QUALITY", "NODES") + "</td>";
        html += "<td colspan='2'>" + node["rx-link-quality"] + "</td><td></td>";

        html += "<td colspan='2'>" + AppMain.t("DEV_LAST_TX_TIMESTAMP", "NODES") + "</td>";
        if (node["device-last-tx-ack-timestamp"] && node["device-last-tx-ack-timestamp"] !== "0" && node["device-last-tx-ack-timestamp"]!== 0)
            html += "<td>" + moment(node["device-last-tx-ack-timestamp"]).format(AppMain.localization("DATETIME_FORMAT")) + "</td><td></td>";
        else {
            html += "<td>---</td><td></td>";
        }

        html += "</tr>";
        html += "<tr class='nodeListShowDetails id_" + randomId + "'>";

        html += "<td colspan='3'>" + AppMain.t("TX_ACK_PACKETS", "NODES") + "</td>";
        html += "<td colspan='2'>" + node["tx-ack-packets"] + "</td><td></td>";

        html += "<td colspan='2'>" + AppMain.t("DEV_LAST_TX_NO_TIMESTAMP", "NODES") + "</td>";
        if (node["device-last-tx-no-ack-timestamp"] && node["device-last-tx-no-ack-timestamp"] !== "0" && node["device-last-tx-no-ack-timestamp"] !== 0)
            html += "<td>" + moment(node["device-last-tx-no-ack-timestamp"]).format(AppMain.localization("DATETIME_FORMAT")) + "</td><td></td>";
        else
            html += "<td>---</td><td></td>";

        html += "</tr>";

        html += "<tr class='nodeListShowDetails id_" + randomId + "'>";

        html += "<td colspan='3'>" + AppMain.t("JOIN_TIME", "NODES") + "</td>";
        html += "<td colspan='2'>" + deviceJoined + "</td><td></td>";

        html += "<td colspan='2'>" + "</td>";
        html += "<td>"  + "</td><td></td>";
        // html += "<td colspan='2'>" + AppMain.t("LAST_SUCC_COMM_TIME_SHORT", "NODES") + "</td>";
        // html += "<td>" + lastComm + "</td><td></td>";

        html += "</tr>";

        $this.parent().after(html);
    }
};

CtrlActionNodes.getNodeInfoTitle = function (e) {
    let $this = $(e.target);
    const randomId = "TITLE_R_EXT";

    if ($this.attr("data-opened") === "1") {
        $this.attr("data-opened", 0);
        $("table tr.nodeListShowDetails.id_" + $this.attr("data-rid")).remove();
        return;
    }
    $("table tr td[data-opened]").attr("data-opened", "0");
    $("table tr.nodeListShowDetails.id_MAC_R_EXT").remove();
    $("table tr.nodeListShowDetails.id_TITLE_R_EXT").remove();

    const nodeMac = $this.attr("data-node-mac");
    if (this.nodesCosemStat[nodeMac]) {
        $this.attr("data-opened", 1);
        $this.attr("data-rid", randomId);

        let html = "<tr class='nodeListShowDetails id_" + randomId + "'>";

        html += "<td colspan='3'>" + AppMain.t("SUCCESSFUL_COMMUNICATIONS", "NODES") + "</td>";
        html += "<td colspan='2'>" + this.nodesCosemStat[nodeMac]["successful-communications"] + "</td><td></td>";

        html += "<td colspan='2'>" + AppMain.t("LAST_SUCC_COMM_TIME", "NODES") + "</td>";
        if (this.nodesCosemStat[nodeMac]["last-successful-communication"] && this.nodesCosemStat[nodeMac]["last-successful-communication"].toString() !== "0")
            html += "<td>" + moment(this.nodesCosemStat[nodeMac]["last-successful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT")) + "</td><td></td>";
        else
            html += "<td>---</td><td></td>";

        html += "</tr>";
        html += "<tr class='nodeListShowDetails id_" + randomId + "'>";

        html += "<td colspan='3'>" + AppMain.t("UNSUCCESSFUL_COMMUNICATIONS", "NODES") + "</td>";
        html += "<td colspan='2'>" + this.nodesCosemStat[nodeMac]["unsuccessful-communications"] + "</td><td></td>";

        html += "<td colspan='2'>" + AppMain.t("LAST_UNSUCC_COMM_TIME", "NODES") + "</td>";
        if (this.nodesCosemStat[nodeMac]["last-unsuccessful-communication"] && this.nodesCosemStat[nodeMac]["last-unsuccessful-communication"].toString() !== "0")
            html += "<td>" + moment(this.nodesCosemStat[nodeMac]["last-unsuccessful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT")) + "</td><td></td>";
        else
            html += "<td>---</td><td></td>";

        html += "</tr>";

        $this.parent().after(html);
    }
};


CtrlActionNodes.__exportNodeList = function () {
    let csv = "";
    let isNotSelected = true;
    let inputC = $("input:checked");

    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        csv += '"' + AppMain.t("#", undefined) + '",';
        csv += '"' + AppMain.t("SHORT_ADDRESS", "NODES") + '",';
        csv += '"' + AppMain.t("MAC_ADDRESS", "NODES") + '",';
        csv += '"' + AppMain.t("DEVICE_TITLE", "NODES") + '",';
        csv += '"' + AppMain.t("DC_STATUS", "NODES") + '",';
        csv += '"' + AppMain.t("PLC_STATUS", "NODES") + '",';
        csv += '"' + AppMain.t("SUCCESS_RATING", "NODES") + '",';
        csv += '"' + AppMain.t("COMMISSIONING_TIME", "NODES") + '",';
        csv += '"' + AppMain.t("LAST_SUCC_COMM_TIME_SHORT_2", "NODES") + '",';
        csv += '"' + AppMain.t("IP_ADDRESS", "NODES") + '",';
        csv += '"' + AppMain.t("RX_PACKETS", "NODES") + '",';
        csv += '"' + AppMain.t("RX_LINK_QUALITY", "NODES") + '",';
        csv += '"' + AppMain.t("TX_ACK_PACKETS", "NODES") + '",';
        csv += '"' + AppMain.t("TX_NO_ACK_PACKETS", "NODES") + '",';
        csv += '"' + AppMain.t("JOIN_TIME", "NODES") + '",';
        csv += '"' + AppMain.t("DEV_LAST_RX_TIMESTAMP", "NODES") + '",';
        csv += '"' + AppMain.t("DEV_LAST_TX_TIMESTAMP", "NODES") + '",';
        csv += '"' + AppMain.t("DEV_LAST_TX_NO_TIMESTAMP", "NODES") + '",';
        csv += '"' + AppMain.t("LAST_SUCC_COMM_TIME_SHORT", "NODES") + '",';
        csv += '"' + AppMain.t("SUCCESSFUL_COMMUNICATIONS", "NODES") + '",';
        csv += '"' + AppMain.t("LAST_SUCC_COMM_TIME", "NODES") + '",';
        csv += '"' + AppMain.t("UNSUCCESSFUL_COMMUNICATIONS", "NODES") + '",';
        csv += '"' + AppMain.t("LAST_UNSUCC_COMM_TIME", "NODES") + '"';
        csv += '\r\n';

        inputC.each(function (i, elm) {
            const element = $(elm);
            if (element.hasClass("selectNode")) {
                isNotSelected = false;
                csv += element.attr("data-node-number") + ',';
                csv += '"' + element.attr("data-node-short") + '",';
                csv += '"' + element.attr("data-node-mac") + '",';
                csv += '"' + element.attr("data-node-title") + '",';
                csv += '"' + element.attr("data-node-dc-state") + '",';
                csv += '"' + element.attr("data-node-state") + '",';
                csv += '"' + element.attr("data-node-success-rate") + '",';
                csv += '"' + element.attr("data-node-commissioned") + '",';
                csv += '"' + element.attr("data-node-succ-comm") + '",';
                csv += '"' + element.attr("data-node-ip-address") + '",';
                csv += '"' + element.attr("data-node-rx-packets") + '",';
                csv += '"' + element.attr("data-node-rx-link-quality") + '",';
                csv += '"' + element.attr("data-node-tx-ack-packets") + '",';
                csv += '"' + element.attr("data-node-tx-no-ack-packets") + '",';
                csv += '"' + element.attr("data-node-device-joined") + '",';
                csv += '"' + element.attr("data-device-last-rx-timestamp") + '",';
                csv += '"' + element.attr("data-device-last-tx-ack-timestamp") + '",';
                csv += '"' + element.attr("data-device-last-tx-no-ack-timestamp") + '",';
                csv += '"' + element.attr("data-device-last-tx-ack-timestamp") + '",';
                csv += '"' + element.attr("data-node-successful-communications") + '",';
                csv += '"' + element.attr("data-node-last-successful-communication") + '",';
                csv += '"' + element.attr("data-node-unsuccessful-communications") + '",';
                csv += '"' + element.attr("data-node-last-unsuccessful-communication") + '"';
                csv += '\r\n';
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("NODES_TO_WHITELIST", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_NODES", "success");

    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_AttachedDevices_" + moment().format('YYYY-MM-DD-HH-mm-ss') + ".csv", "text/csv");
};

CtrlActionNodes.ping = function (e) {
    const $this = $(e.target);
    const nodeMac = $this.attr("data-node-mac");

    const cnfrm =  $.confirm({
        title: AppMain.t("PING", "NODES"),
        content: AppMain.t("PING_DESC", "NODES", [nodeMac]),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    this.buttons.confirm.disable();
                    $(".jconfirm-buttons").html("<div class = \"mdl-spinner mdl-js-spinner is-active\"></div>");
                    AppMain.html.updateAllElements();
                    setTimeout(function () {
                        CtrlActionNodes.pingMAC(nodeMac);
                        cnfrm.close();
                    },100);
                    return false;
                }
            },
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {
                        return true;
                    }
            }
        }
    });
};

CtrlActionNodes.pingMAC = function (nodeMac) {
    const resp = AppMain.ws().exec("Ping", {
        "meter-id": nodeMac,
        "result": "2",
        "data": "WEB_test",
        "response-timeout": "20000"
    }).getResponse(false);
    let responseTXT = AppMain.t("PING_RESULT_NOT_OK", "NODES");
    if (resp && resp.PingResponse && resp.PingResponse["meter-id"]) {
        responseTXT = AppMain.t("PING_RESULT_OK", "NODES");
    }
    $.confirm({
        title: AppMain.t("PING_RESULT", "NODES"),
        content: responseTXT,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    CtrlActionNodes.exec();
                    return true;
                }
            }
        }
    });
    return true;
};

CtrlActionNodes.kickOffNode = function (e) {
    const $this = $(e.target);
    const nodeMac = $this.attr("data-node-mac");

    $.confirm({
        title: AppMain.t("KICK_OFF", "NODES"),
        content: AppMain.t("KICK_OFF_DESC", "NODES", [nodeMac]),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    return CtrlActionNodes.kickOffNodeMAC(nodeMac);
                }
            },
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {
                        return true;
                    }
            }
        }
    });
};

CtrlActionNodes.kickOffNodeMAC = function (nodeMac) {
    const resp = AppMain.ws().exec("PlcMeterKickOff", {"meter-id": nodeMac}).getResponse(false);
    if (resp && resp.PlcMeterKickOffResponse && resp.PlcMeterKickOffResponse.__text === "OK") {
        CtrlActionNodes.exec();
        AppMain.dialog("KICL_OFF_SUCC", "success");
    } else {
        AppMain.dialog("KICL_OFF_ERROR", "error");
    }
    return true;
};


CtrlActionNodes.arrangeNodes = function (nodes, nodesCosemStat) {
    let nodesObj = {};
    if (nodesCosemStat.length === undefined) {
        nodesCosemStat = [nodesCosemStat];
    }
    $.each(nodesCosemStat, function (index, nodeStat) {
        nodesObj[nodeStat["mac-address"].toString()] = nodeStat;
    });

    this.nodesCosemStat = nodesObj;
    $.each(nodes, function (index, node) {
        if (nodesObj[node["mac-address"]]) {
            node["node-title"] = (nodesObj[node["mac-address"]]["meter-id"] && nodesObj[node["mac-address"]]["meter-id"].toString() !== "[object Object]") ?
                nodesObj[node["mac-address"]]["meter-id"].toString() : "---";
            node["node-commissioned"] = nodesObj[node["mac-address"]]["commissioned"] ? nodesObj[node["mac-address"]]["commissioned"].toString(): "";
            node["node-last-comm"] = nodesObj[node["mac-address"]]["last-successful-communication"] ? nodesObj[node["mac-address"]]["last-successful-communication"].toString(): "";
            node["dc-state"] = defined(nodesObj[node["mac-address"]]["meter-state"]) ? nodesObj[node["mac-address"]]["meter-state"].toString() : "METER-JOINED";
            const succ = parseInt(nodesObj[node["mac-address"]]["successful-communications"]);
            const unsucc = parseInt(nodesObj[node["mac-address"]]["unsuccessful-communications"]);
            node["success-rate"] = (!isNaN(succ) && !isNaN(unsucc) && succ + unsucc !== 0) ? parseInt((succ / (succ + unsucc)) * 100) : 100;
            node["successful-communications"] = nodesObj[node["mac-address"]]["successful-communications"];
            if (nodesObj[node["mac-address"]]["last-successful-communication"] && nodesObj[node["mac-address"]]["last-successful-communication"].toString() !== "0")
                node["last-successful-communication"] = moment(nodesObj[node["mac-address"]]["last-successful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT"));
            else
                node["last-successful-communication"] = "";
            node["unsuccessful-communications"] = nodesObj[node["mac-address"]]["unsuccessful-communications"];
            if (nodesObj[node["mac-address"]]["last-unsuccessful-communication"] && nodesObj[node["mac-address"]]["last-unsuccessful-communication"].toString() !== "0")
                node["last-unsuccessful-communication"] = moment(nodesObj[node["mac-address"]]["last-unsuccessful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT"));
            else
                node["last-unsuccessful-communication"] = "";
            node["security-counter"] = defined(nodesObj[node["mac-address"]]["security-counter"]) ? nodesObj[node["mac-address"]]["security-counter"] : "---";
        }else {
            node["dc-state"] = "METER-JOINED";
        }
    });
    return nodes;
};

/**
 * Translate node state into readable string.
 * @param {String} stateName name
 * @return {String}
 */
CtrlActionNodes.getNodeStateString = function (stateName) {
    const nodeStates = {
        "G3PLC-NODE-JOINED": AppMain.t("ACTIVE", "NODES"),
        "G3PLC-NODE-ROUTE-DISCOVERED": AppMain.t("ACTIVE", "NODES"),
        "G3PLC-NODE-ACTIVE": AppMain.t("ACTIVE", "NODES"),
        "G3PLC-NODE-NOT-AVAILABLE": AppMain.t("METER_NOT_ACTIVE", "NODES"),
        "G3PLC-NODE-LOST": AppMain.t("LOST", "NODES"),
        "METER-JOINED": AppMain.t("METER_JOINED", "NODES"),
        "METER-COMMISSIONED": AppMain.t("METER_COMMISIONED", "NODES"),
        "METER-NO-KEYS": AppMain.t("METER_NOT_ACTIVE", "NODES"), //AppMain.t("METER_NO_KEYS", "NODES"),
        "METER-WRONG-KEYS": AppMain.t("METER_NOT_ACTIVE", "NODES"),//AppMain.t("METER_WRONG_KEYS", "NODES"),
        "METER-NOT-AVAILABLE": AppMain.t("METER_NOT_ACTIVE", "NODES"),//AppMain.t("METER_NOT_AVAILABLE", "NODES"),
        "METER-LOST": AppMain.t("METER_LOST", "NODES"),
        "METER-ACTIVE": AppMain.t("METER_ACTIVE", "NODES")
    };
    return defined(nodeStates[stateName]) ? nodeStates[stateName] : "";
};

CtrlActionNodes.init = function () {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionNodes.onBeforeExecute = function () {
    $(".main-canvas").removeClass("main-canvas-attached-devices");
};


module.exports.CtrlActionNodes = CtrlActionNodes;
