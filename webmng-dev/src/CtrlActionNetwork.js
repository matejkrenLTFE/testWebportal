/**
 * @class CtrlActionNetwork Controller action using IControllerAction interface.
 */
/* global AppMain, $, dmp */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

let modulecontrolleraction = require("./IControllerAction");
let CtrlActionNetwork = Object.create(new modulecontrolleraction.IControllerAction());
let cytoscape = require("cytoscape");
let popper = require("cytoscape-popper");
const download = require("./vendor/download.js");
const cvStyle = require("./includes/CytoscapeStyle");
const Tippy = require("tippy.js");
const moment = require("moment");
let euler = require("cytoscape-euler");

cytoscape.use(euler); // register extension

cytoscape.use(popper); // register extension

CtrlActionNetwork.exec = function () {
    "use strict";
    this.view.setTitle("NETWORK_TOPOLOGY");

    let routing = [];
    try {
        routing = AppMain.ws().exec("PlcRoutingTableGet", undefined).getResponse(false);
    } catch (e) {
        dmp("err: PlcRoutingTableGet" + e.toString());
    }
    this.nodesData = this.getNodeCosemStatistics();
    let nodes = this.getNodesObject(this.nodesData);
    let htmlNodes = this.buildNodeListHTML(nodes);

    this.view.render("Network#ViewNetwork", {
        htmlNodes: htmlNodes,
        statisticsTime: moment().format(AppMain.localization("DATETIME_FORMAT")),
        labels: {
            title: AppMain.t("TITLE", "NETWORK_TOPOLOGY"),
            btnRefresh: AppMain.t("REFRESH", "NETWORK_TOPOLOGY"),
            btnExport: AppMain.t("EXPORT", "NETWORK_TOPOLOGY"),
            btnDiscover: AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"),
            shortAddress: AppMain.t("SHORT_ADDRESS_SPLIT", "NODES"),
            deviceTitleSplit: AppMain.t("DEVICE_TITLE_SPLIT", "NODES"),
            fullscreen: AppMain.t("FULL_SCREEN", "global"),
            statisticsTime: AppMain.t("STATISTICS_TIME", "NODES"),
            filter: AppMain.t("FILTER", "global")
        }
    }, true);

    CtrlActionNetwork.pldDiscoveryRunning = false;
    if (CtrlActionNetwork.isExpanded === true) {
        $("main.mdl-layout__content").addClass("is-full-screen");
        $("#expand_icon").html("fullscreen_exit");
        $("#tooltipFullScreen").html(AppMain.t("EXIT_FULL_SCREEN", "global"));
    } else {
        CtrlActionNetwork.isExpanded = false;
    }

    CtrlActionNetwork.nodeTooltips = {};
    CtrlActionNetwork.nodesInfo = {};
    CtrlActionNetwork.nodesTmp = ["00"];
    CtrlActionNetwork.nodes = [
        {
            group: "nodes",
            data: {
                id: 0,
                nameDec: 0,
                name: "00",
                hopCount: 0
            }
        }
    ];
    CtrlActionNetwork.edgesTmp = [];
    CtrlActionNetwork.edges = [];

    CtrlActionNetwork.layoutOptions2 = {
        name: "euler",
        animate: "end",
        animationDuration: 3000,
        randomize: true,
        gravity: -1.5,
        pull: 0.001,
        mass: function () {
            return 10;
        },
        springCoeff: function (e) {
            switch (e.data("edgeDistanceType")) {
            case 1:
                return 0.001;
            case 2:
                return 0.005;
            case 3:
                return 0.001;
            default:
                return 0.005;
            }
        },
        springLength: function (e) {
            switch (e.data("edgeDistanceType")) {
            case 1:
                return 150;
            case 2:
                return 500;
            case 3:
                return 50;
            default:
                return 600;
            }
        },
        ungrabifyWhileSimulating: false,
        padding: 30,
        ready: function () {
            $("#cv-spinner").show();
        },
        stop: function () {
            CtrlActionNetwork.cv.centre(CtrlActionNetwork.cv.$("#0"));
            $("#cv-spinner").hide();
        }
    };

    //Fix attached devices table width
    $(".main-canvas").css("height", "97%");

    let _this = this;
    setTimeout(function () {
        _this.buildNetwork(routing);
        setTimeout(function () {
            _this.checkForExistingData(nodes);
            const trRows = $("#nodesList tr");
            trRows.bind("contextmenu", function (e) {
                e.preventDefault();
                CtrlActionNetwork.getNodeInfo(e);
            });

            trRows.bind("mouseenter", function (e) {
                e.preventDefault();
                const nodeInd = this.getNodeInfoNodeInd(e);
                CtrlActionNetwork.showHoverTooltip(CtrlActionNetwork.cv.$("#" + nodeInd));
            });
            trRows.bind("mouseout", function (e) {
                e.preventDefault();
                const nodeInd = this.getNodeInfoNodeInd(e);
                CtrlActionNetwork.hideHoverTooltip(CtrlActionNetwork.cv.$("#" + nodeInd));
            });
        }, 200);
    }, 200);

    const tableOptions = {
        valueNames: ["short-address", "node-title"]
    };
    this.initTable("nodesList", "nodesList", tableOptions);

    AppMain.html.updateAllElements();
};

/**
 * Build HTML nodes table.
 * @return {String} htmlNodes
 */
CtrlActionNetwork.buildNodeListHTML = function (nodes) {
    "use strict";
    let htmlNodes = "";

    $.each(nodes, function (ignore, node) {
        const shortAddObj = this.calculateNodeShortAddress(node);

        htmlNodes += "<tr class='node-" + shortAddObj.shortAddress + "' data-bind-event='click' " +
                "data-bind-method='CtrlActionNetwork.getNodeInfo' data-node='" + shortAddObj.shortAddress + "'>";
        htmlNodes += "<td class='short-address' class='cursor-default' data-sort-value='" + shortAddObj.shortAddressPom + "'>" + shortAddObj.shortAddress + "</td>";
        htmlNodes += "<td class='node-title' class='cursor-default'>" + (node["node-title"] !== undefined
            ? node["node-title"]
            : "---") + "</td>";
        htmlNodes += "</tr>";

    });

    return htmlNodes;
};

const getDestAddress = function (route, address) {
    "use strict";
    let destAdd = parseInt(route[`${address}`], 10).toString(16).toUpperCase();
    if (destAdd.length % 2 !== 0) {
        destAdd = "0" + destAdd;
    }
    return destAdd;
};

CtrlActionNetwork.processDestAddInd = function (destAddInd, destAdd, route) {
    "use strict";
    if (destAddInd === -1) {
        destAddInd = CtrlActionNetwork.nodes.length;
        CtrlActionNetwork.nodesTmp.push(destAdd);
        CtrlActionNetwork.nodes.push({
            group: "nodes",
            data: {
                id: destAddInd,
                nameDec: route["destination-address"],
                name: destAdd,
                hopCount: route["hop-count"],
                routeCost: route["route-cost"],
                busyness: 0
            }
        });
    } else {
        CtrlActionNetwork.nodes[`${destAddInd}`].data.hopCount = route["hop-count"];
        CtrlActionNetwork.nodes[`${destAddInd}`].data.routeCost = route["route-cost"];
    }
};
CtrlActionNetwork.processNextHopAddInd = function (destAddInd, nextHopAddInd, route, nextHopAdd) {
    "use strict";
    if (nextHopAddInd === -1) {
        nextHopAddInd = CtrlActionNetwork.nodes.length;
        CtrlActionNetwork.nodesTmp.push(nextHopAdd);
        CtrlActionNetwork.nodes.push({
            group: "nodes",
            data: {
                id: nextHopAddInd,
                nameDec: route["next-hop-address"],
                name: nextHopAdd,
                busyness: 1
            }
        });
    } else {
        if (destAddInd !== nextHopAddInd) {
            CtrlActionNetwork.nodes[`${nextHopAddInd}`].data.busyness += 1;
        }
    }
};
CtrlActionNetwork.addPathRoute = function (destAddInd, nextHopAddInd, route) {
    "use strict";
    if (parseInt(route["hop-count"], 10) === 1) {
        CtrlActionNetwork.nodes[`${destAddInd}`].data.pathRouting = [0, destAddInd];
    } else {
        CtrlActionNetwork.nodes[`${destAddInd}`].data.pathRouting = [0, nextHopAddInd, destAddInd];
    }
};
CtrlActionNetwork.updatesEdgesDataPom = function (destAddInd, nextHopAddInd, route) {
    "use strict";
    CtrlActionNetwork.addEdge(0, nextHopAddInd, 1, 4);
    if (parseInt(route["hop-count"], 10) === 2) { // in this case add regular link from nextHopAdd to destAdd
        CtrlActionNetwork.addEdge(nextHopAddInd, destAddInd, 1, 3);
    } else {
        CtrlActionNetwork.addEdge(nextHopAddInd, destAddInd, 2, 3);
    }
};
CtrlActionNetwork.updatesEdgesData = function (destAddInd, nextHopAddInd, route) {
    "use strict";
    if (parseInt(route["hop-count"], 10) === 1) { //link from DC to destAdd
        CtrlActionNetwork.addEdge(0, destAddInd, 1, 2);
    } else if (parseInt(route["hop-count"], 10) >= 2 || parseInt(route["hop-count"], 10) === 0) {
        CtrlActionNetwork.updatesEdgesDataPom(destAddInd, nextHopAddInd, route);
    }
};

/**
 * inital nodes and links created out of routing table
 * @param routing
 * @private
 */
CtrlActionNetwork.buildNodesAndLinks = function (routing) {
    "use strict";
    if (!routing || Object.prototype.toString.call(routing) !== "[object Array]") {
        return;
    }

    routing.forEach(function (route) {
        let destAdd = getDestAddress(route, "destination-address");
        let nextHopAdd = getDestAddress(route, "next-hop-address");
        let destAddInd = CtrlActionNetwork.nodesTmp.indexOf(destAdd);
        CtrlActionNetwork.processDestAddInd(destAddInd, destAdd, route);
        let nextHopAddInd = CtrlActionNetwork.nodesTmp.indexOf(nextHopAdd);
        CtrlActionNetwork.processNextHopAddInd(destAddInd, nextHopAddInd, route, nextHopAdd);
        // add pathRouting
        CtrlActionNetwork.addPathRoute(destAddInd, nextHopAddInd, route);
        CtrlActionNetwork.updatesEdgesData(destAddInd, nextHopAddInd, route);
    });
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionNetwork.buildNetwork = function (routing) {
    "use strict";
    routing = (Object.prototype.toString.call(routing.PlcRoutingTableGetResponse["routing-table"]) === "[object Array]")
        ? routing.PlcRoutingTableGetResponse["routing-table"]
        : [routing.PlcRoutingTableGetResponse["routing-table"]];
    if (!routing.length || routing.length === 0) {
        return;
    }

    CtrlActionNetwork.buildNodesAndLinks(routing);
};

const getHopCountTxt = function (node) {
    "use strict";
    return (node.data("hopCount")
        ? node.data("hopCount")
        : "---");
};
const getRouteCostTxt = function (node) {
    "use strict";
    return (node.data("routeCost")
        ? node.data("routeCost")
        : "---");
};
const getBusynessTxt = function (node) {
    "use strict";
    return (node.data("busyness") !== ""
        ? node.data("busyness")
        : "---");
};

CtrlActionNetwork.isNodeInfoOk = function (node) {
    "use strict";
    return (CtrlActionNetwork.nodesInfo[node.data("name")].title && CtrlActionNetwork.nodesInfo[node.data("name")].title.toString() !== "[object Object]");
};

CtrlActionNetwork.hooverTooltipHtml = function (node, path) {
    "use strict";
    let html = "";
    if (CtrlActionNetwork.nodesInfo[node.data("name")]) {
        html += "<tbody>";
        if (CtrlActionNetwork.isNodeInfoOk(node)) {
            html += "<tr><td>" + AppMain.t("DEVICE_TITLE", "NODES") + "</td><td>" + CtrlActionNetwork.nodesInfo[node.data("name")].title + "</td></tr>";
        }
        html += "<tr><td>" + AppMain.t("HOP_COUNT", "NETWORK_TOPOLOGY") + "</td><td>" + getHopCountTxt(node) + "</td></tr>" +
                "<tr><td>" + AppMain.t("ROUTE_COST", "NETWORK_TOPOLOGY") + "</td><td>" + getRouteCostTxt(node) + "</td></tr>" +
                "<tr><td>" + AppMain.t("BUSINESS", "NETWORK_TOPOLOGY") + "</td><td>" + getBusynessTxt(node) + "</td></tr>" +
                "<tr><td>" + AppMain.t("PATH", "NETWORK_TOPOLOGY") + "</td><td>" + path + "</td></tr>" +
                "<tr><td>" + AppMain.t("STATUS", "NETWORK_TOPOLOGY") + "</td><td>" +
                AppMain.t(CtrlActionNetwork.nodesInfo[node.data("name")].nodeState, "NETWORK_TOPOLOGY") + "</td></tr>" +
                "</tbody>";
    } else {
        html += "<tbody>" +
                "<tr><td>" + AppMain.t("HOP_COUNT", "NETWORK_TOPOLOGY") + "</td><td>" + getHopCountTxt(node) + "</td></tr>" +
                "<tr><td>" + AppMain.t("ROUTE_COST", "NETWORK_TOPOLOGY") + "</td><td>" + getRouteCostTxt(node) + "</td></tr>" +
                "<tr><td>" + AppMain.t("BUSINESS", "NETWORK_TOPOLOGY") + "</td><td>" + getBusynessTxt(node) + "</td></tr>" +
                "<tr><td>" + AppMain.t("PATH", "NETWORK_TOPOLOGY") + "</td><td>" + path + "</td></tr>" +
                "</tbody>";
    }
    return html;
};

CtrlActionNetwork.showHoverTooltip = function (node) {
    "use strict";
    if (node.data("name") === "00") {
        return;
    }
    let html = "<table style='text-align: left'>";
    let path = "---";
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length) {
        path = "";
        pathRouting.forEach(function (value, i) {
            path += CtrlActionNetwork.nodesTmp[`${value}`];
            if (i !== pathRouting.length - 1) {
                path += ", ";
            }
        });
    }
    html += this.hooverTooltipHtml(node, path);
    html += "</table>";
    html += AppMain.t("CLICK_TO_GET_PLC", "NETWORK_TOPOLOGY");
    CtrlActionNetwork.nodeTooltips[node.data("name")].setContent(html);
    CtrlActionNetwork.nodeTooltips[node.data("name")].show();
    CtrlActionNetwork.cv.$("#" + node.data("id")).addClass("highlight-route");
};

CtrlActionNetwork.hideHoverTooltip = function (node) {
    "use strict";
    CtrlActionNetwork.nodeTooltips[node.data("name")].hide();
    if (!CtrlActionNetwork.highlightedNode || CtrlActionNetwork.highlightedNode.data("name") !== node.data("name")) {
        CtrlActionNetwork.cv.$("#" + node.data("id")).removeClass("highlight-route");
    }
};
CtrlActionNetwork.getNodeInfoNodeInd = function (e) {
    "use strict";
    let $this = $(e.target);
    let node = $this.attr("data-node");
    let nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
    if (nodeInd === -1) {
        node = $this.parent().attr("data-node");
        nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
    }
    return nodeInd;
};

CtrlActionNetwork.getNodeInfoProcessClick = function (clickType, nodeInd) {
    "use strict";
    if (clickType === 1) {
        CtrlActionNetwork.cv.center(CtrlActionNetwork.cv.$("#" + nodeInd));
        CtrlActionNetwork.showHoverTooltip(CtrlActionNetwork.cv.$("#" + nodeInd));
        CtrlActionNetwork.highlightNode(CtrlActionNetwork.cv.$("#" + nodeInd));
    } else {
        CtrlActionNetwork.runPLCforNode(CtrlActionNetwork.cv.$("#" + nodeInd));
    }
};

CtrlActionNetwork.getNodeInfo = function (e) {
    "use strict";
    const nodeInd = this.getNodeInfoNodeInd(e);
    let clickType = e.button;
    if (clickType === undefined) {
        clickType = e.event.which;
    }
    if (nodeInd !== -1) {
        CtrlActionNetwork.getNodeInfoProcessClick(clickType, nodeInd);
    }
};

/**
 * build tooltips for nodes
 * maybe latter we will add tooltips for links also
 */
CtrlActionNetwork.buildTooltips = function () {
    "use strict";
    $.each(CtrlActionNetwork.cv.nodes(), function (ignore, node) {

        let ref = node.popperRef();

        if (CtrlActionNetwork.nodesInfo[node.data("name")]) {
            node.data("nodeState", CtrlActionNetwork.nodesInfo[node.data("name")].nodeState);
        }

        CtrlActionNetwork.nodeTooltips[node.data("name")] = Tippy.default(ref, { // tippy options:
            content: function () {
                let content = document.createElement("div");
                content.innerHTML = "";
                return content;
            },
            arrow: true,
            animation: "scale",
            theme: "dark",
            sticky: true,
            trigger: "manual" // probably want manual mode
        });

        node.on("mouseover", function () {
            CtrlActionNetwork.showHoverTooltip(node);
        });
        node.on("mouseout", function () {
            CtrlActionNetwork.hideHoverTooltip(node);
        });
    });
};

/**
 * build tooltips for nodes
 * maybe latter we will add tooltips for links also
 */
CtrlActionNetwork.buildClickEvents = function () {
    "use strict";
    $.each(CtrlActionNetwork.cv.nodes(), function (ignore, node) {

        node.on("click", function () {
            CtrlActionNetwork.highlightNode(node);
        });
    });

    CtrlActionNetwork.cv.on("click", function () {
        if (!CtrlActionNetwork.isNodeClick && CtrlActionNetwork.highlightedNode) {
            CtrlActionNetwork.unhighlightNode(CtrlActionNetwork.highlightedNode);
        }
        CtrlActionNetwork.isNodeClick = false;
    });
};

CtrlActionNetwork.highlightedNodePom = function (node) {
    "use strict";
    CtrlActionNetwork.highlightedNode = node;
    node.addClass("highlight-route");
    $("#nodesList tr.node-" + node.data("name")).addClass("highlight-route");
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length > 0) {
        let source = pathRouting[0];
        CtrlActionNetwork.cv.$("#" + source).addClass("highlight-route");
        pathRouting.forEach(function (value) {
            let target = value;
            CtrlActionNetwork.cv.$("#" + source + "_" + target).addClass("highlight-route");
            CtrlActionNetwork.cv.$("#" + target).addClass("highlight-route");
            source = target;
        });
    }
}

CtrlActionNetwork.highlightNode = function (node) {
    "use strict";
    CtrlActionNetwork.isNodeClick = true;
    if (node.data("name") === "00") {
        return;
    }
    if (CtrlActionNetwork.highlightedNode) {
        CtrlActionNetwork.unhighlightNode(CtrlActionNetwork.highlightedNode);
    }
    CtrlActionNetwork.highlightedNodePom(node);
};
CtrlActionNetwork.unhighlightNode = function (node) {
    "use strict";
    if (node.data("name") === "00") {
        return;
    }
    node.removeClass("highlight-route");
    $("#nodesList tr.node-" + node.data("name")).removeClass("highlight-route");
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length > 0) {
        let source = pathRouting[0];
        CtrlActionNetwork.cv.$("#" + source).removeClass("highlight-route");
        pathRouting.forEach(function (value) {
            let target = value;
            CtrlActionNetwork.cv.$("#" + source + "_" + target).removeClass("highlight-route");
            CtrlActionNetwork.cv.$("#" + target).removeClass("highlight-route");
            source = target;
        });
    }
};

/**
 * build click events for nodes
 */
CtrlActionNetwork.buildRightClickEvents = function () {
    "use strict";
    $.each(CtrlActionNetwork.cv.nodes(), function (ignore, node) {

        node.on("cxttap", function () {
            CtrlActionNetwork.runPLCforNode(node);
        });
    });
};

CtrlActionNetwork.runPLCforNode = function (node) {
    "use strict";
    if (node.data("name") === "00") {
        return;
    }

    AppMain.ws().execAsync("PlcDiscoverInfoGet", {
        address: node.data("nameDec")
    }).done(function (routingDiscover) {
        if (routingDiscover.PlcDiscoverInfoGetResponse && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]
                && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"]) {

            CtrlActionNetwork.nodeUpdatePath(node, routingDiscover);
        }
    })
        .fail(function (message) {
            dmp("Error in PlcDiscoverInfoGet: " + message);
            AppMain.dialog(message, "error-discovery");
        });

};

CtrlActionNetwork.addEdgeUpdate = function (edgeInd, type, edgeDistanceType) {
    "use strict";
    CtrlActionNetwork.edges[`${edgeInd}`].data.linkCount += 1;
    if (type < CtrlActionNetwork.edges[`${edgeInd}`].data.type) {
        CtrlActionNetwork.edges[`${edgeInd}`].data.type = type;
    }
    if (CtrlActionNetwork.edges[`${edgeInd}`].data.edgeDistanceType === 2 || CtrlActionNetwork.edges[`${edgeInd}`].data.edgeDistanceType === 4) {
        CtrlActionNetwork.edges[`${edgeInd}`].data.edgeDistanceType = edgeDistanceType;
    }
};

CtrlActionNetwork.addEdge = function (source, target, type, edgeDistanceType) {
    "use strict";
    let edgeInd = CtrlActionNetwork.edgesTmp.indexOf(source + "_" + target);
    if (edgeInd === -1) {
        CtrlActionNetwork.edges.push({
            group: "edges",
            data: {
                id: source + "_" + target,
                source: source,
                target: target,
                type: type,
                linkCount: 1,
                edgeDistanceType: edgeDistanceType
            }
        });
        CtrlActionNetwork.edgesTmp.push(source + "_" + target);
    } else { //do not add link, just increase linkCount to indicate more connections going through
        CtrlActionNetwork.addEdgeUpdate(edgeInd, type, edgeDistanceType);
    }
};

CtrlActionNetwork.checkForExistingPathDiscover = function (shortAddObj, node) {
    "use strict";
    const nodeInd = CtrlActionNetwork.nodesTmp.indexOf(shortAddObj.shortAddress);

    if (nodeInd !== -1) {
        const cvNode = CtrlActionNetwork.nodes[`${nodeInd}`];

        //first remove existing path
        let pathRouting = cvNode.data.pathRouting;
        if (pathRouting && pathRouting.length > 1) {
            let source = pathRouting[1];
            pathRouting.forEach(function (value) {
                let target = value;
                const edgeInd = CtrlActionNetwork.edgesTmp.indexOf(source + "_" + target);
                CtrlActionNetwork.edgesTmp.splice(edgeInd, 1);
                CtrlActionNetwork.edges.splice(edgeInd, 1);
                source = target;
            });
        }
        let pathArr = [0];
        let startInd = 0;
        let nodeData = node["path-discover-data"]["node-data"];
        $.each(nodeData, function (ignore, n) {
            let toAddress = parseInt(n.address).toString(16).toUpperCase();
            if (toAddress.length % 2 !== 0) {
                toAddress = "0" + toAddress;
            }
            let toInd = CtrlActionNetwork.nodesTmp.indexOf(toAddress);
            if (toInd !== -1) {
                //dodaj povezavo
                const edgeInd = CtrlActionNetwork.edgesTmp.indexOf(startInd + "_" + toInd);
                if (edgeInd === -1) { //nova povezava
                    CtrlActionNetwork.addEdge(startInd, toInd, 1, 1);
                } else { // samo spremenimo tip povezave
                    CtrlActionNetwork.edges[`${edgeInd}`].data.type = 1;
                    CtrlActionNetwork.edges[`${edgeInd}`].data.edgeDistanceType = 1;
                }
                pathArr.push(toInd);
                startInd = toInd;
            }
        });

        cvNode.data.pathRouting = pathArr;
        cvNode.data.pathDiscovered = true;
    }
};

CtrlActionNetwork.checkForExistingData = function (nodes) {
    "use strict";
    $.each(nodes, function (ignore, node) {
        if (node["ip-address"]) {
            const shortAddObj = this.calculateNodeShortAddress(node);
            let nodeTitle = "";
            if (CtrlActionNetwork.nodesData[node["mac-address"]] && CtrlActionNetwork.nodesData[node["mac-address"]]["meter-id"]) {
                nodeTitle = CtrlActionNetwork.nodesData[node["mac-address"]]["meter-id"].toString();
            }
            CtrlActionNetwork.nodesInfo[`${shortAddObj.shortAddress}`] = {
                ipAddress: node["ip-address"],
                macAddress: node["mac-address"],
                nodeState: node["node-state"],
                title: nodeTitle
            };

            if (node["path-discover-data"]) {
                CtrlActionNetwork.checkForExistingPathDiscover(shortAddObj, node);
            }
        }
    });
    if (CtrlActionNetwork.cv) {
        CtrlActionNetwork.cv.destroy();
    }

    CtrlActionNetwork.cv = cytoscape(
        {
            container: $("#network-graph"),
            boxSelectionEnabled: false,
            autounselectify: true,
            wheelSensitivity: 0.4,
            layout: CtrlActionNetwork.layoutOptions2,
            style: cvStyle,
            elements: CtrlActionNetwork.nodes.concat(CtrlActionNetwork.edges)
        }
    );

    //add tooltips for nodes
    CtrlActionNetwork.buildTooltips();

    //add click event to nodes
    CtrlActionNetwork.buildClickEvents();

    //add right click event to nodes
    CtrlActionNetwork.buildRightClickEvents();
};

CtrlActionNetwork.export = function () {
    "use strict";
    const blob = CtrlActionNetwork.cv.png();
    download(blob, "network.png");
};

CtrlActionNetwork.discoverPLC = function () {
    "use strict";
    if (!CtrlActionNetwork.pldDiscoveryRunning) { //start PLC discovery
        let html = AppMain.t("DISCOVER_PLC_CONFIRM", "NETWORK_TOPOLOGY") + "<br/>" +
                "<table style='width: 100%'>" +
                "<tr>" +
                "<td>" + AppMain.t("TIMEOUT", "NETWORK_TOPOLOGY") + "</td>" +
                "<td>" +
                "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield\">" +
                "   <input  class=\"mdl-textfield__input\" id='timeout' type=\"text\" name=\"timeout\" value='60' maxlength=\"4\"/>" +
                "</div></td>" +
                "</tr>" +
                "</table>";
        $.confirm({
            title: AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"),
            content: html,
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        let val = parseInt($("#timeout").val());
                        CtrlActionNetwork.timeoutForPLCDiscovey = setTimeout(function () {
                            CtrlActionNetwork.pldDiscoveryRunning = false;
                            clearTimeout(CtrlActionNetwork.timeoutForPLCDiscovey);
                            $("#discover_icon").removeClass("discovery-is-running");
                            const tt = $("#discover_tooltip");
                            tt.html(AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"));
                        }, val * 1000 * 60);
                        CtrlActionNetwork.pldDiscoveryRunning = true;
                        //change icon
                        $("#discover_icon").addClass("discovery-is-running");
                        CtrlActionNetwork.plcNodeDiscover(0);
                        return true;
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

        setTimeout(function () {
            $("#timeout").on("input", function () {
                const nonNumReg = /[^0-9]/g;
                $(this).val($(this).val().replace(nonNumReg, ""));
                let val = parseInt($(this).val());
                if (val > 1440) {
                    $(this).val(1440);
                }
                if (val <= 0) {
                    $(this).val(1);
                }
            });
        }, 300);

    } else { // cancel PLC discovery
        $.confirm({
            title: AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"),
            content: AppMain.t("DISCOVER_PLC_CONFIRM_CANCEL", "NETWORK_TOPOLOGY"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        CtrlActionNetwork.pldDiscoveryRunning = false;
                        if (CtrlActionNetwork.timeoutForPLCDiscovey) {
                            clearTimeout(CtrlActionNetwork.timeoutForPLCDiscovey);
                        }
                        $("#discover_icon").removeClass("discovery-is-running");
                        const tt = $("#discover_tooltip");
                        tt.html(AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"));
                        return true;
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
    }
};

CtrlActionNetwork.nodeUpdatePath = function (node, routingDiscover) {
    "use strict";
    //first remove existing path
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length > 0) {
        let source = pathRouting[0];
        pathRouting.forEach(function (value) {
            let target = value;
            CtrlActionNetwork.edgesTmp = CtrlActionNetwork.edgesTmp.filter(function (item) {
                return item !== source + "_" + target;
            });
            CtrlActionNetwork.cv.remove("#" + source + "_" + target);
            source = target;
        });
    }

    let pathArr = [0];
    let startInd = 0;
    let nodeData = routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"];
    $.each(nodeData, function (ignore, node) {
        let toAddress = parseInt(node.address).toString(16).toUpperCase();
        if (toAddress.length % 2 !== 0) {
            toAddress = "0" + toAddress;
        }
        let toInd = CtrlActionNetwork.nodesTmp.indexOf(toAddress);
        if (toInd !== -1) {
            //dodaj povezavo
            const edgeInd = CtrlActionNetwork.edgesTmp.indexOf(startInd + "_" + toInd);
            if (edgeInd === -1) { //nova povezava
                CtrlActionNetwork.addEdge(startInd, toInd, 1, 1);
                CtrlActionNetwork.cv.add(CtrlActionNetwork.edges[CtrlActionNetwork.edges.length - 1]);
            } else { // samo spremenimo tip povezave
                CtrlActionNetwork.cv.$("#" + startInd + "_" + toInd).data("type", 1);
            }
            pathArr.push(toInd);
            startInd = toInd;
        }
    });

    CtrlActionNetwork.cv.$("#" + node.data("id")).data("pathRouting", pathArr);
    CtrlActionNetwork.cv.$("#" + node.data("id")).data("pathDiscovered", true);
};

const isRoutingDiscoverDataOk = function (routingDiscover) {
    return (routingDiscover.PlcDiscoverInfoGetResponse && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]
            && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"]);
};

CtrlActionNetwork.plcNodeDiscover = function (nodeIndex) {
    "use strict";
    if (nodeIndex >= CtrlActionNetwork.nodesTmp.length) {
        CtrlActionNetwork.pldDiscoveryRunning = false;
        $("#discover_icon").removeClass("discovery-is-running");
        const tt = $("#discover_tooltip");
        tt.html(AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"));
        return false;
    }

    CtrlActionNetwork.updatePLCtooltip(nodeIndex);
    let node = CtrlActionNetwork.cv.$("#" + nodeIndex);

    dmp("PlcDiscoverInfoGet for node:" + node.data("nameDec"));

    if (node.data("name") === "00") {
        return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);
    }

    if (node.data("pathDiscovered") === true) {
        return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);
    }

    AppMain.ws().execAsync("PlcDiscoverInfoGet", {
        address: node.data("nameDec")
    })
        .done(function (routingDiscover) {
            if (isRoutingDiscoverDataOk(routingDiscover)) {
                CtrlActionNetwork.nodeUpdatePath(node, routingDiscover);
            }
            if (CtrlActionNetwork.pldDiscoveryRunning) {
                return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);
            }
        })
        .fail(function () {
            dmp("Error in PlcDiscoverInfoGet for node:" + node.data("nameDec"));
            if (CtrlActionNetwork.pldDiscoveryRunning) { // move to next node
                return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);
            }
        });
};

CtrlActionNetwork.updatePLCtooltip = function (nodeIndex) {
    "use strict";
    CtrlActionNetwork.currentNodeInDiscovery = nodeIndex;
    let sliderHtml = "" +
            "<span>" + AppMain.t("COMPLETED", "NETWORK_TOPOLOGY") + ": " +
            (nodeIndex + 1) + "/" + CtrlActionNetwork.nodesTmp.length + "</span><br/>" +
            AppMain.t("CLICK_TO_CANCEL", "NETWORK_TOPOLOGY") +
            "</p>";
    const tt = $("#discover_tooltip");
    tt.html(sliderHtml);
};

CtrlActionNetwork.expand = function () {
    "use strict";
    const main = $("main.mdl-layout__content");
    const expIcon = $("#expand_icon");
    const expTooltip = $("#tooltipFullScreen");
    if (!this.isExpanded) { //go full screen
        main.addClass("is-full-screen");
        expIcon.html("fullscreen_exit");
        expTooltip.html(AppMain.t("EXIT_FULL_SCREEN", "global"));
    } else { //exit full screen
        main.removeClass("is-full-screen");
        expIcon.html("fullscreen");
        expTooltip.html(AppMain.t("FULL_SCREEN", "global"));
    }
    CtrlActionNetwork.cv.resize();
    AppMain.html.updateAllElements();
    this.isExpanded = !this.isExpanded;
};


CtrlActionNetwork.init = function () {
    "use strict";
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionNetwork.onBeforeExecute = function () {
    "use strict";
    CtrlActionNetwork.pldDiscoveryRunning = false;
    $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionNetwork = CtrlActionNetwork;
