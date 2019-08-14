/**
 * @class CtrlActionNetwork Controller action using IControllerAction interface.
 */
let modulecontrolleraction = require("./IControllerAction");
let CtrlActionNetwork = Object.create(new modulecontrolleraction.IControllerAction);
let cytoscape = require('cytoscape');
let popper = require('cytoscape-popper');
const download = require("./vendor/download.js");
const cvStyle = require("./includes/CytoscapeStyle");
const Tippy = require('tippy.js');
const moment = require("moment");
let euler = require('cytoscape-euler');

cytoscape.use(euler); // register extension

cytoscape.use(popper); // register extension

CtrlActionNetwork.exec = function () {
    this.view.setTitle("NETWORK_TOPOLOGY");

    let routing = [];
    try {
        routing = AppMain.ws().exec("PlcRoutingTableGet", undefined).getResponse(false);
    } catch (e) {
        console.log("err: PlcRoutingTableGet")
    }

    let nodes = AppMain.ws().exec("GetNodeList", {"with-data": true}).getResponse(false);
    nodes = (nodes && nodes.GetNodeListResponse && nodes.GetNodeListResponse.node instanceof Array) ?
        nodes.GetNodeListResponse.node : nodes.GetNodeListResponse;
    if (typeof nodes["__prefix"] !== "undefined")
        delete nodes["__prefix"];

    const nodesCosemStat = AppMain.wsMes().exec("CosemDeviceStatisticRequest", undefined).getResponse(false);
    if (nodesCosemStat && nodesCosemStat.GetCosemDeviceStatisticResponse &&
        nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"])
        nodes = this.arrangeNodes(nodes, nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"]);

    let htmlNodes = this._buildNodeListHTML(nodes);

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
    if(CtrlActionNetwork.isExpanded === true){
        $("main.mdl-layout__content").addClass("is-full-screen");
        $("#expand_icon").html("fullscreen_exit");
        $("#tooltipFullScreen").html(AppMain.t("EXIT_FULL_SCREEN", "global"));
    }else{
        CtrlActionNetwork.isExpanded = false;
    }

    CtrlActionNetwork.nodeTooltips = {};
    CtrlActionNetwork.nodesInfo = {};
    CtrlActionNetwork.nodesTmp = ["00"];
    CtrlActionNetwork.nodes = [
        {
            group: 'nodes',
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
        name: 'euler',
        animate: 'end',
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
            // return 300;
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
            CtrlActionNetwork.cv.centre(CtrlActionNetwork.cv.$('#0'));
            $("#cv-spinner").hide();
        }
    };

    //Fix attached devices table width
    $(".main-canvas").css("height", "97%");

    let _this = this;
    setTimeout(function () {
        _this._buildNetwork(this, routing);
        setTimeout(function () {
            _this._checkForExistingData(nodes);
            const trRows = $('#nodesList tr');
            trRows.bind('contextmenu', function (e) {
                e.preventDefault();
                CtrlActionNetwork.getNodeInfo(e);
            });

            trRows.bind('mouseenter', function (e) {
                e.preventDefault();
                let $this = $(e.target);
                let node = $this.attr("data-node");
                let nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
                if (nodeInd === -1) {
                    node = $this.parent().attr("data-node");
                    nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
                }
                CtrlActionNetwork.showHoverTooltip(CtrlActionNetwork.cv.$('#' + nodeInd));
            });
            trRows.bind('mouseout', function (e) {
                e.preventDefault();
                let $this = $(e.target);
                let node = $this.attr("data-node");
                let nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
                if (nodeInd === -1) {
                    node = $this.parent().attr("data-node");
                    nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
                }
                CtrlActionNetwork.hideHoverTooltip(CtrlActionNetwork.cv.$('#' + nodeInd));
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
CtrlActionNetwork._buildNodeListHTML = function (nodes) {
    let htmlNodes = "";

    $.each(nodes, function (index, node) {
        let shortAddress = "";
        let shortAddressPom = "";
        if (node["ip-address"]) {
            const arr = node["ip-address"].split(":");
            shortAddress = arr[arr.length - 1].toUpperCase();
            shortAddressPom = parseInt( arr[arr.length - 1].toUpperCase(), 16);
            if (shortAddress.length % 2 === 1) {
                shortAddress = "0" + shortAddress;
            }
        }

        htmlNodes += "<tr class='node-" + shortAddress + "' data-bind-event='click' data-bind-method='CtrlActionNetwork.getNodeInfo' data-node='" + shortAddress + "'>";
        htmlNodes += "<td class='short-address' class='cursor-default' data-sort-value='" + shortAddressPom + "'>" + shortAddress + "</td>";
        htmlNodes += "<td class='node-title' class='cursor-default'>" + (node["node-title"] !== undefined ? node["node-title"] : "---") + "</td>";
        htmlNodes += "</tr>";

    });

    return htmlNodes;
};

/**
 * inital nodes and links created out of routing table
 * @param routing
 * @private
 */

CtrlActionNetwork._buildNodesAndLinks = function (routing) {
    $.each(routing, function (index, route) {
        let destAdd = parseInt(route["destination-address"], 10).toString(16).toUpperCase();
        if (destAdd.length % 2) {
            destAdd = '0' + destAdd;
        }
        let nextHopAdd = parseInt(route["next-hop-address"], 10).toString(16).toUpperCase();
        if (nextHopAdd.length % 2) {
            nextHopAdd = '0' + nextHopAdd;
        }
        let destAddInd = CtrlActionNetwork.nodesTmp.indexOf(destAdd);
        if (destAddInd === -1) {
            destAddInd = CtrlActionNetwork.nodes.length;
            CtrlActionNetwork.nodesTmp.push(destAdd);
            CtrlActionNetwork.nodes.push({
                group: 'nodes',
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
            CtrlActionNetwork.nodes[destAddInd].data.hopCount = route["hop-count"];
            CtrlActionNetwork.nodes[destAddInd].data.routeCost = route["route-cost"];
        }
        let nextHopAddInd = CtrlActionNetwork.nodesTmp.indexOf(nextHopAdd);
        if (nextHopAddInd === -1) {
            nextHopAddInd = CtrlActionNetwork.nodes.length;
            CtrlActionNetwork.nodesTmp.push(nextHopAdd);
            CtrlActionNetwork.nodes.push({
                group: 'nodes',
                data: {
                    id: nextHopAddInd,
                    nameDec: route["next-hop-address"],
                    name: nextHopAdd,
                    busyness: 1
                }
            })
        }else{
            if(destAddInd!== nextHopAddInd)
                CtrlActionNetwork.nodes[nextHopAddInd].data.busyness++;
        }
        // add pathRouting
        if (parseInt(route["hop-count"], 10) === 1) {
            CtrlActionNetwork.nodes[destAddInd].data.pathRouting = [0, destAddInd];
        } else {
            CtrlActionNetwork.nodes[destAddInd].data.pathRouting = [0, nextHopAddInd, destAddInd];
        }

        if (parseInt(route["hop-count"], 10) === 1) { //link from DC to destAdd
            CtrlActionNetwork.addEdge(0, destAddInd, 1, 2);
        } else if (parseInt(route["hop-count"], 10) >= 2 || parseInt(route["hop-count"], 10) === 0) {
            CtrlActionNetwork.addEdge(0, nextHopAddInd, 1, 4);
            if (parseInt(route["hop-count"], 10) === 2) { // in this case add regular link from nextHopAdd to destAdd
                CtrlActionNetwork.addEdge(nextHopAddInd, destAddInd, 1, 3);
            } else {
                CtrlActionNetwork.addEdge(nextHopAddInd, destAddInd, 2, 3);
            }
        }
    });
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionNetwork._buildNetwork = function (_this, routing) {
    routing = (routing.PlcRoutingTableGetResponse["routing-table"] instanceof Array) ? routing.PlcRoutingTableGetResponse["routing-table"] :
        [routing.PlcRoutingTableGetResponse["routing-table"]];
    if (!routing.length || routing.length === 0) {
        return;
    }

    CtrlActionNetwork._buildNodesAndLinks(routing);
};

CtrlActionNetwork.showHoverTooltip = function (node) {
    if (node.data("name") === "00")
        return;
    let html = "<table style='text-align: left'>";
    let path = "---";
    let pathRouting = node.data("pathRouting");
    if(pathRouting && pathRouting.length){
        path = "";
        for(let i = 0; i < pathRouting.length; i++){
            path += CtrlActionNetwork.nodesTmp[pathRouting[i]];
            if(i !== pathRouting.length-1){
                path += ", "
            }
        }
    }
    if (CtrlActionNetwork.nodesInfo[node.data("name")]) {
        html += "<tbody>";
        if(CtrlActionNetwork.nodesInfo[node.data("name")].title && CtrlActionNetwork.nodesInfo[node.data("name")].title.toString() !== "[object Object]"){
            html += "<tr><td>" + AppMain.t("DEVICE_TITLE", "NODES") + "</td><td>" + CtrlActionNetwork.nodesInfo[node.data("name")].title + "</td></tr>";
        }
        html += "<tr><td>" + AppMain.t("HOP_COUNT", "NETWORK_TOPOLOGY") + "</td><td>" + (node.data("hopCount") ? node.data("hopCount") : "---") + "</td></tr>" +
            "<tr><td>" + AppMain.t("ROUTE_COST", "NETWORK_TOPOLOGY") + "</td><td>" + (node.data("routeCost") ? node.data("routeCost") : "---") + "</td></tr>" +
            "<tr><td>" + AppMain.t("BUSINESS", "NETWORK_TOPOLOGY") + "</td><td>" + (node.data("busyness")!== "" ? node.data("busyness") : "---") + "</td></tr>" +
            "<tr><td>" + AppMain.t("PATH", "NETWORK_TOPOLOGY") + "</td><td>" + path + "</td></tr>" +
            "<tr><td>" + AppMain.t("STATUS", "NETWORK_TOPOLOGY") + "</td><td>" +
            AppMain.t(CtrlActionNetwork.nodesInfo[node.data("name")].nodeState, "NETWORK_TOPOLOGY") + "</td></tr>" +
            "</tbody>";
    } else {
        html += "<tbody>" +
            "<tr><td>" + AppMain.t("HOP_COUNT", "NETWORK_TOPOLOGY") + "</td><td>" + (node.data("hopCount") ? node.data("hopCount") : "---") + "</td></tr>" +
            "<tr><td>" + AppMain.t("ROUTE_COST", "NETWORK_TOPOLOGY") + "</td><td>" + (node.data("routeCost") ? node.data("routeCost") : "---") + "</td></tr>" +
            "<tr><td>" + AppMain.t("BUSINESS", "NETWORK_TOPOLOGY") + "</td><td>" + (node.data("busyness")!== "" ? node.data("busyness") : "---") + "</td></tr>" +
            "<tr><td>" + AppMain.t("PATH", "NETWORK_TOPOLOGY") + "</td><td>" + path + "</td></tr>" +
            "</tbody>";
    }

    html += "</table>";
    html += AppMain.t("CLICK_TO_GET_PLC", "NETWORK_TOPOLOGY");
    CtrlActionNetwork.nodeTooltips[node.data("name")].setContent(html);
    CtrlActionNetwork.nodeTooltips[node.data("name")].show();
    CtrlActionNetwork.cv.$('#' + node.data("id")).addClass("highlight-route");
};

CtrlActionNetwork.hideHoverTooltip = function (node) {
    CtrlActionNetwork.nodeTooltips[node.data("name")].hide();
    if (!CtrlActionNetwork.highlightedNode || CtrlActionNetwork.highlightedNode.data("name") !== node.data("name"))
        CtrlActionNetwork.cv.$('#' + node.data("id")).removeClass("highlight-route");
};

CtrlActionNetwork.getNodeInfo = function (e) {
    let $this = $(e.target);
    let node = $this.attr("data-node");
    let nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
    if (nodeInd === -1) {
        node = $this.parent().attr("data-node");
        nodeInd = CtrlActionNetwork.nodesTmp.indexOf(node);
    }
    let clickType = e.button;
    if (clickType === undefined) {
        clickType = e.event.which;
    }
    if (nodeInd !== -1) {
        switch (clickType) {
            case 1:
                CtrlActionNetwork.cv.center(CtrlActionNetwork.cv.$('#' + nodeInd));
                CtrlActionNetwork.showHoverTooltip(CtrlActionNetwork.cv.$("#" + nodeInd));
                CtrlActionNetwork.highlightNode(CtrlActionNetwork.cv.$("#" + nodeInd));
                break;
            case 2:
            case 3:
                CtrlActionNetwork.runPLCforNode(CtrlActionNetwork.cv.$("#" + nodeInd));
                break;
        }
    }
};

/**
 * build tooltips for nodes
 * maybe latter we will add tooltips for links also
 */
CtrlActionNetwork.buildTooltips = function () {
    $.each(CtrlActionNetwork.cv.nodes(), function (index, node) {

        let ref = node.popperRef();

        if (CtrlActionNetwork.nodesInfo[node.data("name")]) {
            node.data("nodeState", CtrlActionNetwork.nodesInfo[node.data("name")].nodeState)
        }

        CtrlActionNetwork.nodeTooltips[node.data("name")] = Tippy.default(ref, { // tippy options:
            content: function () {
                let content = document.createElement('div');
                content.innerHTML = "";
                return content;
            },
            arrow: true,
            animation: 'scale',
            theme: 'dark',
            sticky: true,
            trigger: 'manual' // probably want manual mode
        });

        node.on('mouseover', function () {
            CtrlActionNetwork.showHoverTooltip(node);
        });
        node.on('mouseout', function () {
            CtrlActionNetwork.hideHoverTooltip(node);
        });
    });
};

/**
 * build tooltips for nodes
 * maybe latter we will add tooltips for links also
 */
CtrlActionNetwork.buildClickEvents = function () {
    $.each(CtrlActionNetwork.cv.nodes(), function (index, node) {

        node.on('click', function () {
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

CtrlActionNetwork.highlightNode = function (node) {
    CtrlActionNetwork.isNodeClick = true;
    if (node.data("name") === "00")
        return;
    if (CtrlActionNetwork.highlightedNode) {
        CtrlActionNetwork.unhighlightNode(CtrlActionNetwork.highlightedNode);
    }
    CtrlActionNetwork.highlightedNode = node;
    node.addClass("highlight-route");
    $("#nodesList tr.node-" + node.data("name")).addClass("highlight-route");
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length > 0) {
        let source = pathRouting[0];
        CtrlActionNetwork.cv.$('#' + source).addClass("highlight-route");
        for (let i = 1; i < pathRouting.length; i++) {
            let target = pathRouting[i];
            CtrlActionNetwork.cv.$('#' + source + "_" + +target).addClass("highlight-route");
            CtrlActionNetwork.cv.$('#' + target).addClass("highlight-route");
            source = target;
        }
    }
};
CtrlActionNetwork.unhighlightNode = function (node) {
    if (node.data("name") === "00")
        return;
    node.removeClass("highlight-route");
    $("#nodesList tr.node-" + node.data("name")).removeClass("highlight-route");
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length > 0) {
        let source = pathRouting[0];
        CtrlActionNetwork.cv.$('#' + source).removeClass("highlight-route");
        for (let i = 1; i < pathRouting.length; i++) {
            let target = pathRouting[i];
            CtrlActionNetwork.cv.$('#' + source + "_" + +target).removeClass("highlight-route");
            CtrlActionNetwork.cv.$('#' + target).removeClass("highlight-route");
            source = target;
        }
    }
};

/**
 * build click events for nodes
 */
CtrlActionNetwork.buildRightClickEvents = function () {
    $.each(CtrlActionNetwork.cv.nodes(), function (index, node) {

        node.on('cxttap', function () {
            CtrlActionNetwork.runPLCforNode(node);
        });
    });
};

CtrlActionNetwork.runPLCforNode = function (node) {
    if (node.data("name") === "00")
        return;

    AppMain.ws().execAsync("PlcDiscoverInfoGet", {
        address: node.data("nameDec")
    }).done(function (routingDiscover) {
        if (routingDiscover.PlcDiscoverInfoGetResponse && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]
            && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"]) {

            CtrlActionNetwork.nodeUpdatePath(node, routingDiscover);
        }
    })
        .fail(function (message) {
            console.log("Error in PlcDiscoverInfoGet: " + message);
            AppMain.dialog(message, "error-discovery");
        });

};

CtrlActionNetwork.addEdge = function (source, target, type, edgeDistanceType) {
    let edgeInd = CtrlActionNetwork.edgesTmp.indexOf(source + "_" + target);
    if (edgeInd === -1) {
        CtrlActionNetwork.edges.push({
            group: 'edges',
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
        CtrlActionNetwork.edges[edgeInd].data.linkCount += 1;
        if (type < CtrlActionNetwork.edges[edgeInd].data.type) {
            CtrlActionNetwork.edges[edgeInd].data.type = type;
        }
        if (CtrlActionNetwork.edges[edgeInd].data.edgeDistanceType === 2 || CtrlActionNetwork.edges[edgeInd].data.edgeDistanceType === 4) {
            CtrlActionNetwork.edges[edgeInd].data.edgeDistanceType = edgeDistanceType;
        }
    }
};

CtrlActionNetwork._checkForExistingData = function (nodes) {

    $.each(nodes, function (index, node) {
        if (node["ip-address"]) {
            let ip = node["ip-address"].split(":");
            let shortAddress = ip[ip.length - 1].toUpperCase();
            if (shortAddress.length % 2) {
                shortAddress = '0' + shortAddress;
            }
            let nodeTitle = "";
            if(CtrlActionNetwork.nodesData[node["mac-address"]] && CtrlActionNetwork.nodesData[node["mac-address"]]["meter-id"]){
                nodeTitle = CtrlActionNetwork.nodesData[node["mac-address"]]["meter-id"].toString();
            }
            CtrlActionNetwork.nodesInfo[shortAddress] = {
                ipAddress: node["ip-address"],
                macAddress: node["mac-address"],
                nodeState: node["node-state"],
                title: nodeTitle
            };

            if (node["path-discover-data"]) {

                const nodeInd = CtrlActionNetwork.nodesTmp.indexOf(shortAddress);

                if (nodeInd !== -1) {
                    const cvNode = CtrlActionNetwork.nodes[nodeInd];

                    //first remove existing path
                    let pathRouting = cvNode.data["pathRouting"];
                    if (pathRouting && pathRouting.length > 1) {
                        let source = pathRouting[1];
                        for (let i = 2; i < pathRouting.length; i++) {
                            let target = pathRouting[i];
                            const edgeInd = CtrlActionNetwork.edgesTmp.indexOf(source + "_" + +target);
                            CtrlActionNetwork.edgesTmp.splice(edgeInd, 1);
                            CtrlActionNetwork.edges.splice(edgeInd, 1);
                            source = target;
                        }
                    }
                    let pathArr = [0];
                    let startInd = 0;
                    let nodeData = node["path-discover-data"]["node-data"];
                    $.each(nodeData, function (index, n) {
                        let toAddress = parseInt(n.address, 10).toString(16).toUpperCase();
                        if (toAddress.length % 2) {
                            toAddress = '0' + toAddress;
                        }
                        let toInd = CtrlActionNetwork.nodesTmp.indexOf(toAddress);
                        if (toInd !== -1) {
                            //dodaj povezavo
                            const edgeInd = CtrlActionNetwork.edgesTmp.indexOf(startInd + "_" + toInd);
                            if (edgeInd === -1) { //nova povezava
                                CtrlActionNetwork.addEdge(startInd, toInd, 1, 1);
                            } else { // samo spremenimo tip povezave
                                CtrlActionNetwork.edges[edgeInd].data.type = 1;
                                CtrlActionNetwork.edges[edgeInd].data.edgeDistanceType = 1;
                            }
                            pathArr.push(toInd);
                            startInd = toInd;
                        }
                    });

                    cvNode.data["pathRouting"] = pathArr;
                    cvNode.data["pathDiscovered"] = true;
                }
            }
        }
    });
    if (CtrlActionNetwork.cv) {
        CtrlActionNetwork.cv.destroy();
    }

    CtrlActionNetwork.cv = cytoscape(
        {
            container: $('#network-graph'),
            boxSelectionEnabled: false,
            autounselectify: true,
            wheelSensitivity: 0.4,
            layout: CtrlActionNetwork.layoutOptions2,
            style: cvStyle,
            elements: CtrlActionNetwork.nodes.concat(CtrlActionNetwork.edges)
        });

    //add tooltips for nodes
    CtrlActionNetwork.buildTooltips();

    //add click event to nodes
    CtrlActionNetwork.buildClickEvents();

    //add right click event to nodes
    CtrlActionNetwork.buildRightClickEvents();
};

CtrlActionNetwork.export = function () {
    const blob = CtrlActionNetwork.cv.png();
    download(blob, "network.png");
};

CtrlActionNetwork.discoverPLC = function () {

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
                        let val = parseInt($("#timeout").val(), 10);
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
                    action:
                        function () {
                            return true;
                        }
                }
            }
        });

        setTimeout(function () {
            $("#timeout").on("input", function () {
                const nonNumReg = /[^0-9]/g;
                $(this).val($(this).val().replace(nonNumReg, ''));
                let val = parseInt($(this).val(), 10);
                if(val > 1440){
                    $(this).val(1440);
                }
                if(val <= 0){
                    $(this).val(1);
                }
            });
        },300);

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
                        if(CtrlActionNetwork.timeoutForPLCDiscovey)
                            clearTimeout(CtrlActionNetwork.timeoutForPLCDiscovey);
                        $("#discover_icon").removeClass("discovery-is-running");
                        const tt = $("#discover_tooltip");
                        tt.html(AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"));
                        return true;
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
    }
};

CtrlActionNetwork.nodeUpdatePath = function (node, routingDiscover) {
    //first remove existing path
    let pathRouting = node.data("pathRouting");
    if (pathRouting && pathRouting.length > 0) {
        let source = pathRouting[0];
        for (let i = 1; i < pathRouting.length; i++) {
            let target = pathRouting[i];
            CtrlActionNetwork.edgesTmp = CtrlActionNetwork.edgesTmp.filter(function (item) {
                return item !== source + "_" + +target
            });
            CtrlActionNetwork.cv.remove('#' + source + "_" + +target);
            source = target;
        }
    }

    let pathArr = [0];
    let startInd = 0;
    let nodeData = routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"];
    $.each(nodeData, function (index, node) {
        let toAddress = parseInt(node.address, 10).toString(16).toUpperCase();
        if (toAddress.length % 2) {
            toAddress = '0' + toAddress;
        }
        let toInd = CtrlActionNetwork.nodesTmp.indexOf(toAddress);
        if (toInd !== -1) {
            //dodaj povezavo
            const edgeInd = CtrlActionNetwork.edgesTmp.indexOf(startInd + "_" + toInd);
            if (edgeInd === -1) { //nova povezava
                CtrlActionNetwork.addEdge(startInd, toInd, 1, 1);
                CtrlActionNetwork.cv.add(CtrlActionNetwork.edges[CtrlActionNetwork.edges.length - 1]);
            } else { // samo spremenimo tip povezave
                CtrlActionNetwork.cv.$('#' + startInd + "_" + +toInd).data("type", 1);
            }
            pathArr.push(toInd);
            startInd = toInd;
        }
    });

    CtrlActionNetwork.cv.$('#' + node.data("id")).data("pathRouting", pathArr);
    CtrlActionNetwork.cv.$('#' + node.data("id")).data("pathDiscovered", true);
};

CtrlActionNetwork.plcNodeDiscover = function (nodeIndex) {
    if (nodeIndex >= CtrlActionNetwork.nodesTmp.length) {
        CtrlActionNetwork.pldDiscoveryRunning = false;
        $("#discover_icon").removeClass("discovery-is-running");
        const tt = $("#discover_tooltip");
        tt.html(AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY"));
        return false;
    }

    CtrlActionNetwork.updatePLCtooltip(nodeIndex);
    let node = CtrlActionNetwork.cv.$("#" + nodeIndex);

    console.log("PlcDiscoverInfoGet for node:" + node.data("nameDec"));

    if (node.data("name") === "00")
        return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);

    if (node.data("pathDiscovered") === true)
        return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);

    AppMain.ws().execAsync("PlcDiscoverInfoGet", {
        address: node.data("nameDec")
    })
        .done(function (routingDiscover) {
            if (routingDiscover.PlcDiscoverInfoGetResponse && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]
                && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"]) {
                CtrlActionNetwork.nodeUpdatePath(node, routingDiscover);
            }
            if (CtrlActionNetwork.pldDiscoveryRunning)
                return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);
        })
        .fail(function () {
            console.log("Error in PlcDiscoverInfoGet for node:" + node.data("nameDec"));
            if (CtrlActionNetwork.pldDiscoveryRunning) // move to next node
                return CtrlActionNetwork.plcNodeDiscover(nodeIndex + 1);
        });
};

CtrlActionNetwork.updatePLCtooltip = function (nodeIndex) {
    CtrlActionNetwork.currentNodeInDiscovery = nodeIndex;
    let sliderHtml = "" +
        "<span>" + AppMain.t("COMPLETED", "NETWORK_TOPOLOGY") + ": " +
        (nodeIndex + 1) + "/" + CtrlActionNetwork.nodesTmp.length + "</span><br/>" +
        AppMain.t("CLICK_TO_CANCEL", "NETWORK_TOPOLOGY") +
        "</p>";
    const tt = $("#discover_tooltip");
    tt.html(sliderHtml);
};

CtrlActionNetwork.arrangeNodes = function (nodes, nodesCosemStat) {
    let nodesObj = {};
    if (nodesCosemStat.length === undefined) {
        nodesCosemStat = [nodesCosemStat];
    }
    $.each(nodesCosemStat, function (index, nodeStat) {
        nodesObj[nodeStat["mac-address"].toString()] = nodeStat;
    });
    CtrlActionNetwork.nodesData = nodesObj;

    $.each(nodes, function (index, node) {
        if (nodesObj[node["mac-address"]]) {
            node["node-title"] = (nodesObj[node["mac-address"]]["meter-id"] && nodesObj[node["mac-address"]]["meter-id"].toString() !== "[object Object]") ?
                nodesObj[node["mac-address"]]["meter-id"].toString() : "---";
            node["node-commissioned"] = nodesObj[node["mac-address"]]["commissioned"] ? nodesObj[node["mac-address"]]["commissioned"].toString() : "";
            node["node-last-comm"] = nodesObj[node["mac-address"]]["last-successful-communication"] ? nodesObj[node["mac-address"]]["last-successful-communication"].toString() : "";
            node["dc-state"] = defined(nodesObj[node["mac-address"]]["meter-state"]) ? nodesObj[node["mac-address"]]["meter-state"].toString() : "";
            const succ = parseInt(nodesObj[node["mac-address"]]["successful-communications"], 10);
            const unsucc = parseInt(nodesObj[node["mac-address"]]["unsuccessful-communications"], 10);
            node["success-rate"] = (!isNaN(succ) && !isNaN(unsucc) && succ + unsucc !== 0) ? parseInt((succ / (succ + unsucc)) * 100 + "", 10) : 100;
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
        }
    });
    return nodes;
};

CtrlActionNetwork.expand = function(){
    const main = $("main.mdl-layout__content");
    const expIcon = $("#expand_icon");
    const expTooltip = $("#tooltipFullScreen");
    if(!this.isExpanded){ //go full screen
        main.addClass("is-full-screen");
        expIcon.html("fullscreen_exit");
        expTooltip.html(AppMain.t("EXIT_FULL_SCREEN", "global"))
    }else{ //exit full screen
        main.removeClass("is-full-screen");
        expIcon.html("fullscreen");
        expTooltip.html(AppMain.t("FULL_SCREEN", "global"))
    }
    CtrlActionNetwork.cv.resize();
    AppMain.html.updateAllElements();
    this.isExpanded = !this.isExpanded;
};


CtrlActionNetwork.init = function () {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionNetwork.onBeforeExecute = function () {
    CtrlActionNetwork.pldDiscoveryRunning = false;
    $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionNetwork = CtrlActionNetwork;
