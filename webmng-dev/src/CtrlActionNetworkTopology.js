/**
 * @class CtrlActionNetworkTopology Controller action using IControllerAction interface.
 */
let modulecontrolleraction = require("./IControllerAction");
let CtrlActionNetworkTopology = Object.create(new modulecontrolleraction.IControllerAction);
let d3 = require("d3");
const download = require("./vendor/download.js");

CtrlActionNetworkTopology.exec = function () {
    this.view.setTitle("PLC_ROUTING");

    let routing = [];
    try {
        routing = AppMain.ws().exec("PlcRoutingTableGet", undefined).getResponse(false);
    } catch (e) {
        console.log("err: PlcRoutingTableGet")
    }

    this.view.render("NetworkTopology#ViewNetwork", {
        labels: {
            title: AppMain.t("TITLE", "NETWORK_TOPOLOGY"),
            btnRefresh: AppMain.t("REFRESH", "NETWORK_TOPOLOGY"),
            btnExport: AppMain.t("EXPORT", "NETWORK_TOPOLOGY"),
            btnDiscover: AppMain.t("DISCOVER_PLC", "NETWORK_TOPOLOGY")
        }
    }, true);

    CtrlActionNetworkTopology.nodesInfo = {};
    CtrlActionNetworkTopology.nodesTmp = ["00"];
    CtrlActionNetworkTopology.nodes = [
        {
            id: 0,
            nameDec: 0,
            name: "00"
        }
    ];
    CtrlActionNetworkTopology.edgesTmp = [];
    CtrlActionNetworkTopology.edges = [];

    //Fix attached devices table width
    $(".main-canvas").addClass("main-canvas-attached-devices");
    let _this = this;
    setTimeout(function () {
        _this._buildNetwork(this, routing);
        setTimeout(function () {
            _this._checkForExistingData(this, routing);
        },300);
    },300);
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionNetworkTopology._buildNetwork = function (_this, routing) {
    routing = (routing.PlcRoutingTableGetResponse["routing-table"] instanceof Array) ? routing.PlcRoutingTableGetResponse["routing-table"] :
                                                                                        routing.PlcRoutingTableGetResponse;
    if(!routing.length || routing.length === 0){
        return;
    }

    $.each(routing, function (index, route) {
        let destAdd = parseInt(route["destination-address"], 10).toString(16).toUpperCase();
        if (destAdd.length % 2) {
            destAdd = '0' + destAdd;
        }
        let nextHopAdd = parseInt(route["next-hop-address"], 10).toString(16).toUpperCase();
        if (nextHopAdd.length % 2) {
            nextHopAdd = '0' + nextHopAdd;
        }
        let destAddInd = CtrlActionNetworkTopology.nodesTmp.indexOf(destAdd);
        if(destAddInd === -1){
            destAddInd = CtrlActionNetworkTopology.nodes.length;
            CtrlActionNetworkTopology.nodesTmp.push(destAdd);
            CtrlActionNetworkTopology.nodes.push({
                id: destAddInd,
                nameDec: route["destination-address"],
                name: destAdd,
                hopCount: route["hop-count"],
                routeCost: route["route-cost"]
            });
        }else{
            CtrlActionNetworkTopology.nodes[destAddInd].hopCount = route["hop-count"];
            CtrlActionNetworkTopology.nodes[destAddInd].routeCost = route["route-cost"];
        }
        let nextHopAddInd = CtrlActionNetworkTopology.nodesTmp.indexOf(nextHopAdd);
        if(nextHopAddInd === -1){
            nextHopAddInd = CtrlActionNetworkTopology.nodes.length;
            CtrlActionNetworkTopology.nodesTmp.push(nextHopAdd);
            CtrlActionNetworkTopology.nodes.push({
                id: nextHopAddInd,
                nameDec: route["next-hop-address"],
                name: nextHopAdd
            })
        }
        if(parseInt(route["hop-count"], 10) === 1){ //link from DC to destAdd
            CtrlActionNetworkTopology.addEdge(0, destAddInd,1, undefined);
        }else if(parseInt(route["hop-count"], 10) >= 2){
            CtrlActionNetworkTopology.addEdge(0, nextHopAddInd,3, undefined);
            if(parseInt(route["hop-count"]) === 2, 10){ // in this case add regular link from nextHopAdd to destAdd
                CtrlActionNetworkTopology.addEdge(nextHopAddInd, destAddInd,1, undefined);
            }else{
                CtrlActionNetworkTopology.addEdge(nextHopAddInd, destAddInd,2, parseInt(route["hop-count"], 10));
            }
        }else{ //special case hop-count = 0
            // TODO
        }
    });
    let mainWindow = $("main.mdl-layout__content");
    let width = mainWindow.width() - 24;
    let height = mainWindow.height() - 24 - 7 - 41;
    let radius = 20;

    // Define the div for the tooltip
    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let svg = d3.select("#network-graph").select("svg")
        .attr("width", width)
        .attr("height", height)
            .call(d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform)
            })).on("dblclick.zoom", null)
        .append("g");

    CtrlActionNetworkTopology.simulation = d3.forceSimulation(CtrlActionNetworkTopology.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
            .id(function(d) { return d.id; })                     // This provide  the id of a node
            .links(CtrlActionNetworkTopology.edges)                                   // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-500))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("collide", d3.forceCollide(30))
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        .on("end", ticked);

    // CtrlActionNetworkTopology.simulation.on("tick", function () {
    //     CtrlActionNetworkTopology.link
    //         .attr("x1", function(d) { return d.source.x; })
    //         .attr("y1", function(d) { return d.source.y; })
    //         .attr("x2", function(d) { return d.target.x; })
    //         .attr("y2", function(d) { return d.target.y; });
    //
    //     node.select("text")
    //         .attr("x", function(d) { return d.x; })
    //         .attr("y", function(d) { return d.y; });
    //
    //     node.select("circle")
    //         .attr("cx", function(d) { return d.x; })
    //         .attr("cy", function(d) { return d.y; });
    // });

    let drag = function (){
        function dragstarted(d) {}
        function dragged(d) {
            d3.select(this).select("text")
                .attr("x", d.x = d3.event.x)
                .attr("y", d.y = d3.event.y);
            d3.select(this).select("circle")
                .attr("cx", d.x = d3.event.x)
                .attr("cy", d.y = d3.event.y);
            CtrlActionNetworkTopology.link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        }
        function dragended(d) {}
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    };

    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .style("fill", "#a8eae5")
        .style("opacity", 0.8);

    CtrlActionNetworkTopology.link = svg
        .selectAll("line")
        .data(CtrlActionNetworkTopology.edges)
        .enter()
        .append("line")
        .style("stroke", "#a8eae5")
        .style("stroke-width", "3")
        .style("opacity", function(d) {
            switch (d.type) {
                case 1:
                    return 0.8;
                case 2:
                    return 0.5;
                case 3:
                    return 0.2;
                default:
                    return 0.1;
            }
        })
        .style("stroke-dasharray", function (edge) {
            if(edge.type >= 2)
                return ("3, 3");
            else
                return ("3, 0");
        })
        .attr("marker-end", "url(#arrow)");

    let node = svg
        .selectAll("circle")
        .data(CtrlActionNetworkTopology.nodes)
        .enter().append("g")
        .attr("class", function (d) {
            if(d.name !== "00")
                return "node";
            return "default-node";
        })
        .call(drag(CtrlActionNetworkTopology.simulation))
        .on("mouseover", function(d) {
            if(d.name === "00")
                return;

            let html = "";
            html+= "Short address: " + d.name + "<br/>";
            if(CtrlActionNetworkTopology.nodesInfo[d.name]){
                html+= "IP address: " + CtrlActionNetworkTopology.nodesInfo[d.name].ipAddress + "<br/>";
                html+= "MAC address: " + CtrlActionNetworkTopology.nodesInfo[d.name].macAddress + "<br/>";
                html+= "Status: " + AppMain.t(CtrlActionNetworkTopology.nodesInfo[d.name].nodeState, "NETWORK_TOPOLOGY") + "<br/>";
            }
            html += "Hop count: " + d.hopCount + "<br/>";
            html += "(*) Click to get PLC discovery";
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(html)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("dblclick", function (d) {
            if(d.nameDec !== 0){
                try {
                    AppMain.ws().execAsync("PlcDiscoverInfoGet", {
                        address : d.nameDec
                    }).done(function (routingDiscover) {
                        if(routingDiscover.PlcDiscoverInfoGetResponse && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]
                            && routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"]){
                            let startInd = 0;
                            let nodeData = routingDiscover.PlcDiscoverInfoGetResponse["path-discover-data"]["node-data"];
                            $.each(nodeData, function (index, node) {
                                let toAddress = parseInt(node.address, 10).toString(16).toUpperCase();
                                if (toAddress.length % 2) {
                                    toAddress = '0' + toAddress;
                                }
                                let toInd = CtrlActionNetworkTopology.nodesTmp.indexOf(toAddress);
                                if(toInd !== -1){
                                    CtrlActionNetworkTopology.edges.push({
                                        source: startInd,
                                        target: toInd
                                    });
                                    startInd = toInd;
                                }
                            });
                            // Apply the general update pattern to the links.
                            CtrlActionNetworkTopology.link = CtrlActionNetworkTopology.link.data(CtrlActionNetworkTopology.edges, function(d) { return d.source.id + "-" + d.target.id; });
                            CtrlActionNetworkTopology.link.exit().remove();
                            CtrlActionNetworkTopology.link = CtrlActionNetworkTopology.link.enter().append("line")
                                .style("stroke", "#aaa")
                                .attr("marker-end", "url(#arrow)").merge(CtrlActionNetworkTopology.link);
                            CtrlActionNetworkTopology.simulation.nodes(CtrlActionNetworkTopology.nodes);
                            CtrlActionNetworkTopology.simulation.force("link").links(CtrlActionNetworkTopology.edges);
                            CtrlActionNetworkTopology.simulation.alpha(1).restart();
                        }
                    })
                    .fail(function() { console.log("Error in PlcDiscoverInfoGet"); });

                } catch (e) {
                    console.log("err: PlcDiscoverInfoGet")
                }
            }
        });

    node
        .append("circle")
        .attr("r", radius)
        .style("fill", function (d) {
            if(d.name === "00")
                return "#a0b3dc";
            return "#30c9bc"
        });

    node.
        append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .text(function (d) {
            return d.name;
        });

    function ticked() {
        CtrlActionNetworkTopology.link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.select("text")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });

        node.select("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }
};

CtrlActionNetworkTopology.addEdge = function(source, target, type, hopCount){
    let edgeInd = CtrlActionNetworkTopology.edgesTmp.indexOf(source + "_" + target);
    if(edgeInd === -1){
        CtrlActionNetworkTopology.edges.push({
            source: source,
            target: target,
            type: type,
            linkCount: 1,
            hopCount: hopCount
        });
        CtrlActionNetworkTopology.edgesTmp.push(source + "_" + target);
    }else { //do not add link, just increase linkCount to indicate more connections going through
        CtrlActionNetworkTopology.edges[edgeInd].linkCount += 1;
        if(type < CtrlActionNetworkTopology.edges[edgeInd].type){
            CtrlActionNetworkTopology.edges[edgeInd].type = type;
        }
    }
};

CtrlActionNetworkTopology._checkForExistingData = function () {

    let nodes = AppMain.ws().exec("GetNodeList", {"with-data": true}).getResponse(false);

    nodes = (nodes && nodes.GetNodeListResponse && nodes.GetNodeListResponse.node instanceof Array) ?
        nodes.GetNodeListResponse.node : nodes.GetNodeListResponse;
    if (typeof nodes["__prefix"] !== "undefined")
        delete nodes["__prefix"];

    $.each(nodes, function (index, node) {
        if(node["ip-address"]){
            let ip = node["ip-address"].split(":");
            let shortAddress = ip[ip.length-1].toUpperCase();
            if (shortAddress.length % 2) {
                shortAddress = '0' + shortAddress;
            }
            CtrlActionNetworkTopology.nodesInfo[shortAddress] = {
                ipAddress: node["ip-address"],
                macAddress: node["mac-address"],
                nodeState: node["node-state"]
            };
        }

        if(node["path-discover-data"]){
            let pDd = node["path-discover-data"];
            let startInd = 0;
            let nodeData = pDd["node-data"];
            $.each(nodeData, function (index, node) {
                let toAddress = parseInt(node.address, 10).toString(16).toUpperCase();
                if (toAddress.length % 2) {
                    toAddress = '0' + toAddress;
                }
                let toInd = CtrlActionNetworkTopology.nodesTmp.indexOf(toAddress);
                if(toInd !== -1){
                    CtrlActionNetworkTopology.edges.push({
                        source: startInd,
                        target: toInd
                    });
                    startInd = toInd;
                }
            });
            CtrlActionNetworkTopology.link = CtrlActionNetworkTopology.link.data(CtrlActionNetworkTopology.edges,
                function(d) { return d.source.id + "-" + d.target.id; });
            CtrlActionNetworkTopology.link.exit().remove();
            CtrlActionNetworkTopology.link = CtrlActionNetworkTopology.link.enter().append("line")
                .style("stroke", "#aaa")
                .attr("marker-end", "url(#arrow)").merge(CtrlActionNetworkTopology.link);

            CtrlActionNetworkTopology.simulation.nodes(CtrlActionNetworkTopology.nodes);
            CtrlActionNetworkTopology.simulation.force("link").links(CtrlActionNetworkTopology.edges);
            CtrlActionNetworkTopology.simulation.alpha(1).restart();
        }
    });
};

CtrlActionNetworkTopology.export = function(){

    let svg_data = document.getElementById("network-svg").innerHTML ;//put id of your svg element here

    let head = '<svg title="graph" version="1.1" xmlns="http://www.w3.org/2000/svg">';

    let style = '';

    let full_svg = head +  style + svg_data + "</svg>"
    let blob = new Blob([full_svg], {type: "image/svg+xml"});
    download(blob, "network.svg", "image/svg+xml");
};

CtrlActionNetworkTopology.discoverPLC = function(){
    alert("TODO");
};

CtrlActionNetworkTopology.init = function () {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionNetworkTopology.onBeforeExecute = function () {
    $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionNetworkTopology = CtrlActionNetworkTopology;
