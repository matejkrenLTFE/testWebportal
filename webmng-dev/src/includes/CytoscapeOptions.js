/* global CtrlActionNetwork */
/*jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const cyOptions = {
    container: $("#network-graph"),
    boxSelectionEnabled: false,
    autounselectify: true,
    layout: {
        name: "cose",
        animate: true,
        nodeDimensionsIncludeLabels: false,
        idealEdgeLength: function (e) {
            "use strict";
            switch (e.type) {
            case 1:
                return 200;
            case 2:
                return 350;
            case 3:
                return 400;
            default:
                return 500;
            }
        },
        edgeElasticity: function (e) {
            "use strict";
            switch (e.type) {
            case 1:
                return 20;
            case 2:
                return 3;
            case 3:
                return 4;
            default:
                return 50;
            }
        },
        nodeOverlap: 30,
        refresh: 20,
        fit: false,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 1000000,
        // edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        stop: function () {
            "use strict";
            CtrlActionNetwork.cv.centre(CtrlActionNetwork.cv.$("#0"));
        }
    }
};
module.exports = cyOptions;