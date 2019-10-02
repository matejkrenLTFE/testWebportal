/**
 * @class CtrlActionNodes Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined, Chart */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionNodes = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionNodes.exec = function () {
    "use strict";
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

    this.nodesCosemStat = this.getNodeCosemStatistics();
    let nodes = this.getNodesObject(this.nodesCosemStat);
    let list = this.buildNodeListHTML(nodes);
    const totalDC = list.joinedNodes + list.commissionedNodes + list.activeNodes + list.notActiveNodes + list.lostNodes;

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
        totalDevicesText: (totalDC === 1
            ? AppMain.t("DEVICE", "NODES")
            : AppMain.t("DEVICES", "NODES")),
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

    const ctx2 = document.getElementById("chart_attached").getContext("2d");
    /* eslint-disable no-new */
    new Chart(ctx2, {
        type: "doughnut",
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: false,
                text: "Attached devices"
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
                    text: totalDC > 0
                        ? parseInt((list.activeNodes / totalDC) * 100, 10) + "%"
                        : "",
                    color: centerColor,
                    fontStyle: "Arial",
                    sidePadding: 20
                }
            }
        }
    });
    /* eslint-enable no-new */
    $(".main-canvas").addClass("main-canvas-attached-devices");
    AppMain.html.updateAllElements();
};

const defineLastRxTimestamp = function (node) {
    "use strict";
    return defined(node["device-last-rx-timestamp"])
        ? node["device-last-rx-timestamp"]
        : "---";
};
const defineLastRxTimestampMoment = function (node) {
    "use strict";
    return (node["device-last-rx-timestamp"] && node["device-last-rx-timestamp"] !== "0" && node["device-last-rx-timestamp"] !== 0)
        ? moment(node["device-last-rx-timestamp"]).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineLastTxAckTimestamp = function (node) {
    "use strict";
    return (node["device-last-tx-ack-timestamp"] && node["device-last-tx-ack-timestamp"] !== "0" && node["device-last-tx-ack-timestamp"] !== 0)
        ? node["device-last-tx-ack-timestamp"]
        : "---";
};
const defineLastTxAckTimestampMoment = function (node) {
    "use strict";
    return (node["device-last-tx-ack-timestamp"] && node["device-last-tx-ack-timestamp"] !== "0" && node["device-last-tx-ack-timestamp"] !== 0)
        ? moment(node["device-last-tx-ack-timestamp"]).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineTxNoAckTimestamp = function (node) {
    "use strict";
    return (node["device-last-tx-no-ack-timestamp"] && node["device-last-tx-no-ack-timestamp"] !== "0" && node["device-last-tx-no-ack-timestamp"] !== 0)
        ? node["device-last-tx-no-ack-timestamp"]
        : "---";
};
const defineTxNoAckTimestampMoment = function (node) {
    "use strict";
    return (node["device-last-tx-no-ack-timestamp"] && node["device-last-tx-no-ack-timestamp"] !== "0" && node["device-last-tx-no-ack-timestamp"] !== 0)
        ? moment(node["device-last-tx-no-ack-timestamp"]).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineDeviceJoined = function (node) {
    "use strict";
    return (node["device-joined"] && node["device-joined"] !== "0" && node["device-joined"] !== 0)
        ? moment(node["device-joined"]).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineDeviceJoinedExport = function (deviceJoined) {
    "use strict";
    return (deviceJoined !== "---"
        ? moment(deviceJoined).toISOString()
        : deviceJoined);
};
const defineDeviceCommissioningTime = function (node) {
    "use strict";
    return (node["node-commissioned"] && node["node-commissioned"] !== "0" && node["node-commissioned"] !== 0)
        ? moment(node["node-commissioned"]).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineDeviceCommissioningTimeExport = function (commissioningTime) {
    "use strict";
    return (commissioningTime !== "---"
        ? moment(commissioningTime).toISOString()
        : commissioningTime);
};
const isNodeLastCommOk = function (node) {
    "use strict";
    return (node["node-last-comm"] && node["node-last-comm"] !== "0" && node["node-last-comm"] !== "---" && node["node-last-comm"] !== 0);
};
const defineDeviceLastSuccTime = function (node) {
    "use strict";
    return isNodeLastCommOk(node)
        ? moment(node["node-last-comm"]).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineDeviceLastSuccTimeExport = function (lastSuccTime) {
    "use strict";
    return (lastSuccTime !== "---"
        ? moment(lastSuccTime).toISOString()
        : lastSuccTime);
};
const defineDeviceTitleTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? node["node-title"]
        : "---");
};
const defineDeviceDcStateTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? CtrlActionNodes.getNodeStateString(node["dc-state"])
        : "---");
};
const defineDeviceSuccCommTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? node["successful-communications"]
        : "---");
};
const defineDeviceUnSuccCommTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? node["unsuccessful-communications"]
        : "---");
};
const defineDeviceUnSuccCommTimeTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? moment(node["last-unsuccessful-communication"].toString()).toISOString()
        : "---");
};
const defineDeviceSuccCommTimeTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? moment(node["last-successful-communication"].toString()).toISOString()
        : "---");
};
const defineDeviceLastSuccCommTimeTxt = function (nodesCosemStat, nodeMac) {
    "use strict";
    return (nodesCosemStat[nodeMac]["last-successful-communication"] && nodesCosemStat[nodeMac]["last-successful-communication"].toString() !== "0")
        ? moment(nodesCosemStat[nodeMac]["last-successful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineDeviceLastUnSuccCommTimeTxt = function (nodesCosemStat, nodeMac) {
    "use strict";
    return (nodesCosemStat[nodeMac]["last-unsuccessful-communication"] && nodesCosemStat[nodeMac]["last-unsuccessful-communication"].toString() !== "0")
        ? moment(nodesCosemStat[nodeMac]["last-unsuccessful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT"))
        : "---";
};
const defineDeviceSecurityCounterTxt = function (node) {
    "use strict";
    return (node["node-title"] !== undefined
        ? node["security-counter"]
        : "---");
};
const defineDeviceSuccessRateTxt = function (node) {
    "use strict";
    return (node["success-rate"] !== undefined
        ? node["success-rate"] + "%"
        : "---");
};
const defineStatusChipHtml = function (node) {
    "use strict";
    return ((node["node-title"] !== undefined && node["node-title"] !== "---")
        ? "<span class='mdl-chip " + node["dc-state"] + "'><span class='mdl-chip__text dc-state'>" + CtrlActionNodes.getNodeStateString(node["dc-state"]) + "</span></span>"
        : "---");
};
const defineSuccessRateHtml = function (node) {
    "use strict";
    return (node["success-rate"] !== undefined
        ? node["success-rate"]
        : "0") + "'>" + (node["success-rate"] !== undefined
        ? node["success-rate"] + "%"
        : "---");
};
// const defineDeviceSuccessRate = function (node) {
//     "use strict";
//     let successRate = (node["tx-ack-packets"] > 0)
//         ? Math.ceil((parseInt(node["tx-ack-packets"], 10) / (parseInt(node["tx-ack-packets"], 10) + parseInt(node["tx-no-ack-packets"], 10))) * 100)
//         : 0;
//     if (isNaN(successRate)) {
//         return 0;
//     }
//     return successRate;
// };
CtrlActionNodes.updateStatusCountersSecond = function (dcState, list) {
    "use strict";
    if (dcState === "METER-NO-KEYS") {
        list.notActiveNodes += 1;
    }
    if (dcState === "METER-WRONG-KEYS") {
        list.notActiveNodes += 1;
    }
    if (dcState === "METER-LOST") {
        list.lostNodes += 1;
    }
};
CtrlActionNodes.updateStatusCountersThird = function (dcState, list) {
    "use strict";
    if (dcState === "METER-ACTIVE") {
        list.activeNodes += 1;
    }
    if (dcState === "METER-NOT-AVAILABLE") {
        list.notActiveNodes += 1;
    }
};

CtrlActionNodes.updateStatusCounters = function (dcState, list) {
    "use strict";
    if (dcState === "METER-JOINED" || dcState === "") {
        list.joinedNodes += 1;
    }
    if (dcState === "METER-COMMISSIONED") {
        list.commissionedNodes += 1;
    }
    CtrlActionNodes.updateStatusCountersSecond(dcState, list);
    CtrlActionNodes.updateStatusCountersThird(dcState, list);
};
/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionNodes.buildNodeListHTML = function (nodes) {
    "use strict";

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

    let i = 1;
    const self = this;
    $.each(nodes, function (ignore, node) {
        const shortAddObj = self.calculateNodeShortAddress(node);
        let deviceLastRxTimestamp = defineLastRxTimestamp(node);
        let deviceLastTxAckTimestamp = defineLastTxAckTimestamp(node);
        let deviceLastTxNoAckTimestamp = defineTxNoAckTimestamp(node);
        let deviceJoined = defineDeviceJoined(node);
        let commissioningTime = defineDeviceCommissioningTime(node);
        let lastSuccTime = defineDeviceLastSuccTime(node);
        let nodeTitle = defineDeviceTitleTxt(node);

        list.htmlNodes += "<tr>";
        list.htmlNodes += "<td class='checkbox-col cursor-default'><input type='checkbox' name='selectNode' class='selectNode cursor-pointer' data-node-mac='" + node["mac-address"] +
                "' data-node-ip-address='" + node["ip-address"] + "' " +
                "data-node-device-joined='" + defineDeviceJoinedExport(deviceJoined) +
                "' data-node-number='" + i + "' data-node-rx-packets='" + node["rx-packets"] + "' data-node-tx-packets='" +
                node["tx-ack-packets"] + "'" + " data-device-last-tx-ack-timestamp='" + deviceLastTxAckTimestamp +
                "'" + " data-node-rx-link-quality='" + node["rx-link-quality"] + "'" + " data-node-short='" + shortAddObj.shortAddress +
                "'" + " data-node-commissioned='" + defineDeviceCommissioningTimeExport(commissioningTime) + "'" + " data-node-succ-comm='" +
                defineDeviceLastSuccTimeExport(node) + "'" + " data-node-tx-ack-packets='" + node["tx-ack-packets"] + "'" + " data-node-tx-no-ack-packets='" +
                node["tx-no-ack-packets"] + "'" + " data-device-last-rx-timestamp='" + deviceLastRxTimestamp + "'" + " data-node-title='" +
                nodeTitle + "'" + " data-node-dc-state='" + defineDeviceDcStateTxt(node) + "'" + " data-node-state='" + CtrlActionNodes.getNodeStateString(node["node-state"]) +
                "'" + " data-node-successful-communications='" + defineDeviceSuccCommTxt(node) + "'" + " data-node-last-successful-communication='" + defineDeviceSuccCommTimeTxt(node) +
                "'" + " data-node-unsuccessful-communications='" + defineDeviceUnSuccCommTxt(node) + "'" +
                " data-node-last-unsuccessful-communication='" + defineDeviceUnSuccCommTimeTxt(node) + "'" + " data-node-security-counter='" +
                defineDeviceSecurityCounterTxt(node) + "'" + " data-node-success-rate='" + defineDeviceSuccessRateTxt(node) +
                "'" + " data-device-last-tx-no-ack-timestamp='" + deviceLastTxNoAckTimestamp + "' /></td>";

        list.htmlNodes += "<td class='short-address' class='cursor-default'>" + shortAddObj.shortAddress + "</td>";
        list.htmlNodes += "<td class='mac-address' data-bind-event='click' data-bind-method='CtrlActionNodes.getNodeInfo' " +
                " data-node-mac='" + node["mac-address"] + "'>" + node["mac-address"] + "</td>";
        list.htmlNodes += "<td class='node-title' data-bind-event='click' " +
                "data-bind-method='CtrlActionNodes.getNodeInfoTitle' data-node-mac='" + node["mac-address"] + "'>" + defineDeviceTitleTxt(node) + "</td>";
        list.htmlNodes += "<td class='cursor-default'>" + defineStatusChipHtml(node) + "</td>";
        list.htmlNodes += "<td class='cursor-default'><span class='mdl-chip " + node["node-state"] + "'><span class='mdl-chip__text node-state'>" +
                CtrlActionNodes.getNodeStateString(node["node-state"]) + "<span></span></td>";
        list.htmlNodes += "<td class='success-rate cursor-default' data-sort-value='" + defineSuccessRateHtml(node) + "</td>";
        list.htmlNodes += "<td class='device-joined cursor-default'>" + commissioningTime + "</td>";
        list.htmlNodes += "<td class='ack-timestamp cursor-default'>" + lastSuccTime + "</td>";
        list.htmlNodes += "<td  class='cursor-default'>";
        list.htmlNodes += "<i id='ping_" + i + "'  data-rbac=\"nodes.ping\" class=\"material-icons cursor-pointer\" data-bind-event=\"click\" " +
                "data-bind-method=\"CtrlActionNodes.ping\" data-node-mac='" + node["mac-address"] + "'>import_export</i>";
        list.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"ping_" + i + "\">" + AppMain.t("PING", "NODES") + "</div>";
        list.htmlNodes += "<i id='kickOff_" + i + "' data-rbac=\"nodes.kickoff\" class=\"material-icons cursor-pointer\" data-bind-event=\"click\" " +
                "data-bind-method=\"CtrlActionNodes.kickOffNode\" data-node-mac='" + node["mac-address"] + "'>clear</i>";
        list.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"kickOff_" + i + "\">" + AppMain.t("KICK_OFF", "NODES") + "</div>";
        list.htmlNodes += "</td>";
        list.htmlNodes += "</tr>";
        i += 1;
        list.totalNodes += 1;
        CtrlActionNodes.updateStatusCounters(node["dc-state"], list);
    });

    return list;
};

CtrlActionNodes.getNodeInfoHtml = function ($this, nodeInfo, randomId) {
    "use strict";
    const node = nodeInfo.GetNodeListResponse.node;
    let deviceJoined = defineDeviceJoined(node);
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
    html += "<td>" + defineLastRxTimestampMoment(node) + "</td><td></td>";
    html += "</tr>";
    html += "<tr class='nodeListShowDetails id_" + randomId + "'>";
    html += "<td colspan='3'>" + AppMain.t("RX_LINK_QUALITY", "NODES") + "</td>";
    html += "<td colspan='2'>" + node["rx-link-quality"] + "</td><td></td>";
    html += "<td colspan='2'>" + AppMain.t("DEV_LAST_TX_TIMESTAMP", "NODES") + "</td>";
    html += "<td>" + defineLastTxAckTimestampMoment(node) + "</td><td></td>";
    html += "</tr>";
    html += "<tr class='nodeListShowDetails id_" + randomId + "'>";
    html += "<td colspan='3'>" + AppMain.t("TX_ACK_PACKETS", "NODES") + "</td>";
    html += "<td colspan='2'>" + node["tx-ack-packets"] + "</td><td></td>";
    html += "<td colspan='2'>" + AppMain.t("DEV_LAST_TX_NO_TIMESTAMP", "NODES") + "</td>";
    html += "<td>" + defineTxNoAckTimestampMoment(node) + "</td><td></td>";
    html += "</tr>";
    html += "<tr class='nodeListShowDetails id_" + randomId + "'>";
    html += "<td colspan='3'>" + AppMain.t("JOIN_TIME", "NODES") + "</td>";
    html += "<td colspan='2'>" + deviceJoined + "</td><td></td>";
    html += "<td colspan='2'>" + "</td>";
    html += "<td>" + "</td><td></td>";
    html += "</tr>";
    return html;
};

const updateDataOpened = function ($this) {
    "use strict";
    if ($this.attr("data-opened") === "1") {
        $this.attr("data-opened", 0);
        $("table tr.nodeListShowDetails.id_" + $this.attr("data-rid")).remove();
        return true;
    }
    $("table tr td[data-opened]").attr("data-opened", "0");
    $("table tr.nodeListShowDetails.id_MAC_R_EXT").remove();
    $("table tr.nodeListShowDetails.id_TITLE_R_EXT").remove();
    return false;
};

CtrlActionNodes.getNodeInfo = function (e) {
    "use strict";

    let $this = $(e.target);
    const randomId = "MAC_R_EXT";
    if (updateDataOpened($this)) {
        return;
    }
    let nodeMac = $this.attr("data-node-mac");
    let nodeInfo = AppMain.ws().exec("GetNodeList", {
        "mac-address": nodeMac,
        "with-data": true
    }).getResponse(false);

    if (defined(nodeInfo.GetNodeListResponse.node)) {
        const html = this.getNodeInfoHtml($this, nodeInfo, randomId);

        $this.parent().after(html);
    }
};

CtrlActionNodes.getNodeInfoTitle = function (e) {
    "use strict";

    let $this = $(e.target);
    const randomId = "TITLE_R_EXT";
    if (updateDataOpened($this)) {
        return;
    }

    const nodeMac = $this.attr("data-node-mac");
    if (this.nodesCosemStat[nodeMac]) {
        $this.attr("data-opened", 1);
        $this.attr("data-rid", randomId);
        let html = "<tr class='nodeListShowDetails id_" + randomId + "'>";
        html += "<td colspan='3'>" + AppMain.t("SUCCESSFUL_COMMUNICATIONS", "NODES") + "</td>";
        html += "<td colspan='2'>" + this.nodesCosemStat[nodeMac]["successful-communications"] + "</td><td></td>";
        html += "<td colspan='2'>" + AppMain.t("LAST_SUCC_COMM_TIME", "NODES") + "</td>";
        html += "<td>" + defineDeviceLastSuccCommTimeTxt(this.nodesCosemStat, nodeMac) + "</td><td></td>";
        html += "</tr>";
        html += "<tr class='nodeListShowDetails id_" + randomId + "'>";
        html += "<td colspan='3'>" + AppMain.t("UNSUCCESSFUL_COMMUNICATIONS", "NODES") + "</td>";
        html += "<td colspan='2'>" + this.nodesCosemStat[nodeMac]["unsuccessful-communications"] + "</td><td></td>";
        html += "<td colspan='2'>" + AppMain.t("LAST_UNSUCC_COMM_TIME", "NODES") + "</td>";
        html += "<td>" + defineDeviceLastUnSuccCommTimeTxt(this.nodesCosemStat, nodeMac) + "</td><td></td>";
        html += "</tr>";
        $this.parent().after(html);
    }
};


CtrlActionNodes.exportNodeList = function () {
    "use strict";

    let csv = "";
    let isNotSelected = true;
    let inputC = $("input:checked");

    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        csv += "\"" + AppMain.t("#", undefined) + "\",";
        csv += "\"" + AppMain.t("SHORT_ADDRESS", "NODES") + "\",";
        csv += "\"" + AppMain.t("MAC_ADDRESS", "NODES") + "\",";
        csv += "\"" + AppMain.t("DEVICE_TITLE", "NODES") + "\",";
        csv += "\"" + AppMain.t("DC_STATUS", "NODES") + "\",";
        csv += "\"" + AppMain.t("PLC_STATUS", "NODES") + "\",";
        csv += "\"" + AppMain.t("SUCCESS_RATING", "NODES") + "\",";
        csv += "\"" + AppMain.t("COMMISSIONING_TIME", "NODES") + "\",";
        csv += "\"" + AppMain.t("LAST_SUCC_COMM_TIME_SHORT_2", "NODES") + "\",";
        csv += "\"" + AppMain.t("IP_ADDRESS", "NODES") + "\",";
        csv += "\"" + AppMain.t("RX_PACKETS", "NODES") + "\",";
        csv += "\"" + AppMain.t("RX_LINK_QUALITY", "NODES") + "\",";
        csv += "\"" + AppMain.t("TX_ACK_PACKETS", "NODES") + "\",";
        csv += "\"" + AppMain.t("TX_NO_ACK_PACKETS", "NODES") + "\",";
        csv += "\"" + AppMain.t("JOIN_TIME", "NODES") + "\",";
        csv += "\"" + AppMain.t("DEV_LAST_RX_TIMESTAMP", "NODES") + "\",";
        csv += "\"" + AppMain.t("DEV_LAST_TX_TIMESTAMP", "NODES") + "\",";
        csv += "\"" + AppMain.t("DEV_LAST_TX_NO_TIMESTAMP", "NODES") + "\",";
        csv += "\"" + AppMain.t("LAST_SUCC_COMM_TIME_SHORT", "NODES") + "\",";
        csv += "\"" + AppMain.t("SUCCESSFUL_COMMUNICATIONS", "NODES") + "\",";
        csv += "\"" + AppMain.t("LAST_SUCC_COMM_TIME", "NODES") + "\",";
        csv += "\"" + AppMain.t("UNSUCCESSFUL_COMMUNICATIONS", "NODES") + "\",";
        csv += "\"" + AppMain.t("LAST_UNSUCC_COMM_TIME", "NODES") + "\"";
        csv += "\r\n";

        inputC.each(function (ignore, elm) {
            const element = $(elm);
            if (element.hasClass("selectNode")) {
                isNotSelected = false;
                csv += element.attr("data-node-number") + ",";
                csv += "\"" + element.attr("data-node-short") + "\",";
                csv += "\"" + element.attr("data-node-mac") + "\",";
                csv += "\"" + element.attr("data-node-title") + "\",";
                csv += "\"" + element.attr("data-node-dc-state") + "\",";
                csv += "\"" + element.attr("data-node-state") + "\",";
                csv += "\"" + element.attr("data-node-success-rate") + "\",";
                csv += "\"" + element.attr("data-node-commissioned") + "\",";
                csv += "\"" + element.attr("data-node-succ-comm") + "\",";
                csv += "\"" + element.attr("data-node-ip-address") + "\",";
                csv += "\"" + element.attr("data-node-rx-packets") + "\",";
                csv += "\"" + element.attr("data-node-rx-link-quality") + "\",";
                csv += "\"" + element.attr("data-node-tx-ack-packets") + "\",";
                csv += "\"" + element.attr("data-node-tx-no-ack-packets") + "\",";
                csv += "\"" + element.attr("data-node-device-joined") + "\",";
                csv += "\"" + element.attr("data-device-last-rx-timestamp") + "\",";
                csv += "\"" + element.attr("data-device-last-tx-ack-timestamp") + "\",";
                csv += "\"" + element.attr("data-device-last-tx-no-ack-timestamp") + "\",";
                csv += "\"" + element.attr("data-device-last-tx-ack-timestamp") + "\",";
                csv += "\"" + element.attr("data-node-successful-communications") + "\",";
                csv += "\"" + element.attr("data-node-last-successful-communication") + "\",";
                csv += "\"" + element.attr("data-node-unsuccessful-communications") + "\",";
                csv += "\"" + element.attr("data-node-last-unsuccessful-communication") + "\"";
                csv += "\r\n";
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("NODES_TO_WHITELIST", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_NODES", "success");

    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_AttachedDevices_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
};

CtrlActionNodes.ping = function (e) {
    "use strict";

    const $this = $(e.target);
    const nodeMac = $this.attr("data-node-mac");
    let cnfrm;
    cnfrm = $.confirm({
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
                    }, 100);
                    return false;
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

CtrlActionNodes.pingMAC = function (nodeMac) {
    "use strict";

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
    "use strict";

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
                action: function () {
                    return true;
                }
            }
        }
    });
};

CtrlActionNodes.kickOffNodeMAC = function (nodeMac) {
    "use strict";

    const resp = AppMain.ws().exec("PlcMeterKickOff", {"meter-id": nodeMac}).getResponse(false);
    if (resp && resp.PlcMeterKickOffResponse && resp.PlcMeterKickOffResponse.__text === "OK") {
        CtrlActionNodes.exec();
        AppMain.dialog("KICL_OFF_SUCC", "success");
    } else {
        AppMain.dialog("KICL_OFF_ERROR", "error");
    }
    return true;
};

/**
 * Translate node state into readable string.
 * @param {String} stateName name
 * @return {String}
 */
CtrlActionNodes.getNodeStateString = function (stateName) {
    "use strict";

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
    return defined(nodeStates[stateName])
        ? nodeStates[stateName]
        : "";
};

CtrlActionNodes.init = function () {
    "use strict";

    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionNodes.onBeforeExecute = function () {
    "use strict";

    $(".main-canvas").removeClass("main-canvas-attached-devices");
};


module.exports.CtrlActionNodes = CtrlActionNodes;
