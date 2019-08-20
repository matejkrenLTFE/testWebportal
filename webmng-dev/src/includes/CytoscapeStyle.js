const cyStyle = [
    {
        selector: 'node',
        style: {
            'height': 35,
            'width': 35,
            'background-color': function (node) {
                switch (node.data("nodeState")) {
                    case "G3PLC-NODE-JOINED":
                    case "G3PLC-NODE-ROUTE-DISCOVERED":
                    case "G3PLC-NODE-ACTIVE":
                        return "#009E00";
                    case "G3PLC-NODE-NOT-AVAILABLE":
                        return "rgb(249, 168, 7)";
                    case "G3PLC-NODE-LOST":
                        return "rgb(255, 0, 0)";
                    default:
                        return "#999";
                }
            },
            "content": "data(name)",
            "font-size": "12px",
            "text-valign": "center",
            "text-halign": "center",
            "color": "#fff",
            "opacity": 0.7,
            'border-width': function (node) {
                let busyness = parseInt(node.data("busyness"));
                if(isNaN(busyness) || busyness === 0)
                    return 0;
                if (busyness <= 5)
                    return 2;
                if(busyness <= 10)
                    return 4;
                return 7;
            },
            'border-color': function (node) {
                switch (node.data("nodeState")) {
                    case "G3PLC-NODE-JOINED":
                    case "G3PLC-NODE-ROUTE-DISCOVERED":
                    case "G3PLC-NODE-ACTIVE":
                        return "#003300";
                    case "G3PLC-NODE-NOT-AVAILABLE":
                        return "#634303";
                    case "G3PLC-NODE-LOST":
                        return "rgb(100, 0, 0)";
                    default:
                        return "#999";
                }
            },
            "overlay-padding": "6px",
            "z-index": "10"
        }
    },
    {
        selector: 'node.highlight-route',
        style: {
            "z-index": "12",
            "overlay-opacity": 0.2
        }
    },
    {
        selector: 'node[id=\"0\"]',
        style: {
            'background-color': '#a0b3dc',
            "shape": "octagon",
            "opacity": 1,
            "border-width": 0
        }
    },
    {
        selector: 'node[id=\"0\"].highlight-route',
        style: {
            "overlay-opacity": 0.2,
        }
    },
    {
        selector: 'node:parent',
        css: {
            'background-opacity': 0.01
        }
    },
    {
        selector: 'edge',
        style: {
            'curve-style': 'bezier',
            'haystack-radius': 0,
            'width': 2,
            'opacity': function (e) {
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
            'line-color': function (e) {
                const linkCost = parseInt(e.data("linkCount"));
                if(isNaN(linkCost) || linkCost<=12)
                    return "#009E00";
                if(linkCost<=254)
                    return "rgb(249, 168, 7)";
                return "rgb(255, 0, 0)";
                },
            'target-arrow-color': function (e) {
                const linkCost = parseInt(e.data("linkCount"));
                if(isNaN(linkCost) || linkCost<=12)
                    return "#009E00";
                if(linkCost<=254)
                    return "rgb(249, 168, 7)";
                return "rgb(255, 0, 0)";
            },
            'target-arrow-shape': 'triangle',
            "line-style": function (e) {
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
        selector: 'edge.highlight-route',
        style: {
            'width': 4,
            "overlay-opacity": 0.2,
            "overlay-padding": 3,
            'opacity': 0.8,
            "z-index": "11"
        }
    }
];
module.exports = cyStyle;