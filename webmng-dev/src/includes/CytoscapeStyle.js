/* global defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const backgroundColorMap = {
    "G3PLC-NODE-JOINED": "#009E00",
    "G3PLC-NODE-ROUTE-DISCOVERED": "#009E00",
    "G3PLC-NODE-ACTIVE": "#009E00",
    "G3PLC-NODE-NOT-AVAILABLE": "rgb(249, 168, 7)",
    "G3PLC-NODE-LOST": "rgb(255, 0, 0)"
};

const borderColorMap = {
    "G3PLC-NODE-JOINED": "#003300",
    "G3PLC-NODE-ROUTE-DISCOVERED": "#003300",
    "G3PLC-NODE-ACTIVE": "#003300",
    "G3PLC-NODE-NOT-AVAILABLE": "#634303",
    "G3PLC-NODE-LOST": "rgb(100, 0, 0)"
};

const getBorderWidth = function (busyness) {
    "use strict";
    if (busyness <= 5) {
        return 2;
    }
    if (busyness <= 10) {
        return 4;
    }
    return 7;
};

const cyStyle = [
    {
        selector: "node",
        style: {
            "height": 35,
            "width": 35,
            "background-color": function (node) {
                "use strict";
                if (defined(backgroundColorMap[node.data("nodeState")])) {
                    return backgroundColorMap[node.data("nodeState")];
                }
                return "#999";
            },
            "content": "data(name)",
            "font-size": "12px",
            "text-valign": "center",
            "text-halign": "center",
            "color": "#fff",
            "opacity": 0.7,
            "border-width": function (node) {
                "use strict";
                let busyness = parseInt(node.data("busyness"), 10);
                if (Number.isNaN(busyness) || busyness === 0) {
                    return 0;
                }
                return getBorderWidth(busyness);
            },
            "border-color": function (node) {
                "use strict";
                if (defined(borderColorMap[node.data("nodeState")])) {
                    return borderColorMap[node.data("nodeState")];
                }
                return "#999";
            },
            "overlay-padding": "6px",
            "z-index": "10"
        }
    },
    {
        selector: "node.highlight-route",
        style: {
            "z-index": "12",
            "overlay-opacity": 0.2
        }
    },
    {
        selector: "node[id=\"0\"]",
        style: {
            "background-color": "#a0b3dc",
            "shape": "octagon",
            "opacity": 1,
            "border-width": 0
        }
    },
    {
        selector: "node[id=\"0\"].highlight-route",
        style: {
            "overlay-opacity": 0.2
        }
    },
    {
        selector: "node:parent",
        css: {
            "background-opacity": 0.01
        }
    },
    {
        selector: "edge",
        style: {
            "curve-style": "bezier",
            "haystack-radius": 0,
            "width": 2,
            "opacity": function (e) {
                "use strict";
                switch (e.data("type")) {
                case 1:
                    return 0.4;
                case 2:
                case 3:
                    return 0.3;
                default:
                    return 0.3;
                }
            },
            "line-color": function (e) {
                "use strict";
                const linkCost = parseInt(e.data("linkCount"), 10);
                if (Number.isNaN(linkCost) || linkCost <= 12) {
                    return "#009E00";
                }
                if (linkCost <= 254) {
                    return "rgb(249, 168, 7)";
                }
                return "rgb(255, 0, 0)";
            },
            "target-arrow-color": function (e) {
                "use strict";
                const linkCost = parseInt(e.data("linkCount"), 10);
                if (Number.isNaN(linkCost) || linkCost <= 12) {
                    return "#009E00";
                }
                if (linkCost <= 254) {
                    return "rgb(249, 168, 7)";
                }
                return "rgb(255, 0, 0)";
            },
            "target-arrow-shape": "triangle",
            "line-style": function (e) {
                "use strict";
                switch (e.data("type")) {
                case 1:
                    return "solid";
                case 2:
                case 3:
                    return "dashed";
                default:
                    return "dashed";
                }
            }
        }
    },
    {
        selector: "edge.highlight-route",
        style: {
            "width": 4,
            "overlay-opacity": 0.2,
            "overlay-padding": 3,
            "opacity": 0.8,
            "z-index": "11"
        }
    }
];
module.exports = cyStyle;