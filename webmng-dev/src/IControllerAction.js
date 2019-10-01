const List = require("list.js");
const moment = require("moment");
/* global AppMain, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

/**
 * @class IControllerAction Action component interface
 */
module.exports.IControllerAction = function () {
    "use strict";

    this.view = AppMain.getAppComponent("view");

    this.controller = AppMain.getAppComponent("controller");

    /**
     * @method Main method to execute controller action. All classes
     * extending IControllerAction must implement this method.
     */
    this.exec = null;
    this.isSearchOpened = false;
    this.tableOptions = {};

    /**
     * filter function
     */
    this.filter = function () {
        const TS = $("#table-search");
        const search = $("input.search");
        if (!this.isSearchOpened) {
            let w = this.calculateRemainingWidth();
            if (w > 0) {
                w = w + "px";
                TS.show().animate({width: w}, {duration: 500});
            } else {
                TS.addClass("table-search-absolute");
                TS.show().animate({width: "150px"}, {duration: 500});
            }
            search.focus();
            this.isSearchOpened = true;
        } else {
            this.closeFilter();
        }
    };

    /**
     * close filter function
     */
    this.closeFilter = function () {
        const TS = $("#table-search");
        const search = $("input.search");
        TS.animate({width: "0px"}, {duration: 500});
        setTimeout(function () {
            TS.removeClass("table-search-absolute");
        }, 490);
        this.isSearchOpened = false;
        search.val("");
        this.documentTable.search();
        $("#filter_icon").removeClass("clear");
    };

    /**
     * helper function for calculating remaining filter space
     */
    this.calculateRemainingWidth = function () {
        let avWidth = $("#title-row").width() - $("#title-row .mdl-card__title-text").width() - 16
                - $("#title-row .mdl-cell-icons").width();
        if (!$("#table-search.table-search-absolute").length) {
            avWidth += $("#table-search").width();
        }
        if (avWidth > 160) {
            return 150;
        }
        if (avWidth > 70) {
            return (avWidth - 10);
        }
        return 0;
    };

    this.initTable = function (tableID, tableWrapper, tableOptions) {
        this.tableOptions = tableOptions;
        // Table sorting
        $("table#" + tableID).stupidtable();
        // When sorting close all opened event details
        $("th[data-sort]").on("click", function () {
            $("tr[data-opened]").each(function (ignore, elm) {
                const $element = $(elm);
                $element.removeAttr("data-opened");
                $element.next().remove();
            });
            //node list special
            $("table tr td[data-opened]").removeAttr("data-opened");
            $("table tr.nodeListShowDetails.id_MAC_R_EXT").remove();
            $("table tr.nodeListShowDetails.id_TITLE_R_EXT").remove();
            $("table tr.row-details").remove();
        });

        let $this = this;
        setTimeout(function () {
            $this.documentTable = new List(tableWrapper, $this.tableOptions);

            const inputSearch = $("input.search");
            inputSearch.on("keyup", function (e) {
                if (e.keyCode === 27) {
                    $(e.currentTarget).val("");
                    $this.documentTable.search("");
                }
                if ($(e.currentTarget).val() === "") {
                    $(e.currentTarget).removeClass("is-active");
                    $("#filter_icon").removeClass("clear");
                } else {
                    $(e.currentTarget).addClass("is-active");
                    $("#filter_icon").addClass("clear");
                }
                $this.documentTable.search($(e.currentTarget).val());
                $("#total-count").html($this.documentTable.matchingItems.length);
            });

            inputSearch.on("focusout", function (e) {
                if ($this.isSearchOpened) {
                    setTimeout(function () {
                        if ($(e.currentTarget).val() === "") {
                            $this.closeFilter();
                        }
                    }, 100);
                }
            });

            $(window).on("load resize ", function () {
                if ($this.isSearchOpened) {
                    const TS = $("#table-search");
                    let w = $this.calculateRemainingWidth();
                    if (w > 0) {
                        w = w + "px";
                        TS.animate({width: w}, {duration: 0});
                        TS.removeClass("table-search-absolute");
                    } else {
                        TS.addClass("table-search-absolute");
                        TS.animate({width: "150px"}, {duration: 0});
                    }
                }
            }).resize();
        }, 500);
    };

    this.initSelectForMac = function () {
        setTimeout(function () {
            // mdl-textfield-less-padding-chrome
            const isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i);
            if (isMacLike) {
                $(".mdl-textfield-less-padding-chrome .mdl-js-select").css("padding-top", "25px");
            }
        }, 100);
    };

    this.initSelectAll = function (classID) {
        $("." + classID).on("click", function (e) {
            e.stopPropagation();
            const selectNode = $(".selectNode");
            if (e.target.checked === true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            } else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });
    };
    this.initSelectAllForGroup = function (classID) {
        $("." + classID).on("click", function (e) {
            e.stopPropagation();
            const selectNode = $(".selectGroup");
            if (e.target.checked === true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            } else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });
    };
    this.initSelectAllForJob = function (classID) {
        $("." + classID).on("click", function (e) {
            e.stopPropagation();
            const selectNode = $(".selectJob");
            if (e.target.checked === true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            } else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });
    };

    this.prepareGeneralInfoParams = function (generalInfo, info) {
        // Prepare params
        $.each(info.GetInfosResponse.info, function (ignore, obj) {
            if (generalInfo[obj.category] !== undefined) {
                generalInfo[obj.category][obj.name] = (!obj.value)
                    ? "---"
                    : obj.value;
            }
        });
        if (defined(generalInfo.system)) {
            generalInfo.system.DateTime = moment(generalInfo.system.DateTime).format(AppMain.localization("DATETIME_FORMAT"));
        }
        return generalInfo;
    };

    this.processDisabledInterface = function () {
        $("tr#FormActions > td").hide();
        $("input[type='text'], input[type='password']").attr("disabled", "disabled");
        $("input[type='checkbox']").each(function (ignore, elm) {
            if (elm.id !== "enable") {
                $(elm).attr("disabled", "disabled");
            }
        });
        $("label.mdl-switch").addClass("is-disabled");
    };

    this.justNumberInputCheck = function () {
        setTimeout(function () {
            $(".just-number").on("input", function () {
                const nonNumReg = /[^0-9]/g;
                $(this).val($(this).val().replace(nonNumReg, ""));
                const v = parseInt($(this).val(), 10);
                if (v > 128) {
                    $(this).val("128");
                }
            });
        }, 100);
    };


    /**
     * helper for alert pop-up
     * @param title
     * @param content
     */
    this.importAlert = function (title, content) {
        $.alert({
            useBootstrap: false,
            theme: "material",
            title: title,
            content: content,
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global")
                }
            }
        });
    };

    const isNodesResponseListOk = function (nodes) {
        return (nodes && nodes.GetNodeListResponse && Object.prototype.toString.call(nodes.GetNodeListResponse.node) === "[object Array]");
    };
    this.getNodesObject = function (nodesCosemStat) {
        let nodes = AppMain.ws().exec("GetNodeList", {"with-data": true}).getResponse(false);

        nodes = isNodesResponseListOk(nodes)
            ? nodes.GetNodeListResponse.node
            : nodes.GetNodeListResponse;
        if (nodes.__prefix !== undefined) {
            delete nodes.__prefix;
        }
        return this.arrangeNodes(nodes, nodesCosemStat);
    };

    const isNodesCosemStatDefined = function (nodesCosemStat) {
        return nodesCosemStat && nodesCosemStat.GetCosemDeviceStatisticResponse && nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"];
    };
    this.getNodesCosemStatByRest = function () {
        let nodesCosemStat = AppMain.wsMes().exec("CosemDeviceStatisticRequest", undefined).getResponse(false);
        if (isNodesCosemStatDefined(nodesCosemStat)) {
            nodesCosemStat = nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"];
            if (nodesCosemStat.length === undefined) {
                nodesCosemStat = [nodesCosemStat];
            }
        } else {
            nodesCosemStat = [];
        }
        return nodesCosemStat;
    };

    this.getNodeCosemStatistics = function () {
        let nodesCosemStat = this.getNodesCosemStatByRest();
        let nodesObj = {};
        $.each(nodesCosemStat, function (ignore, nodeStat) {
            nodesObj[nodeStat["mac-address"].toString()] = nodeStat;
        });
        return nodesObj;
    };

    const getNodeTitle = function (nodesObj, node) {
        return (nodesObj[node["mac-address"]]["meter-id"] && nodesObj[node["mac-address"]]["meter-id"].toString() !== "[object Object]")
            ? nodesObj[node["mac-address"]]["meter-id"].toString()
            : "---";
    };
    const getNodeCommissioned = function (nodesObj, node) {
        return nodesObj[node["mac-address"]].commissioned
            ? nodesObj[node["mac-address"]].commissioned.toString()
            : "";
    };
    const getNodeLastCommTxt = function (nodesObj, node) {
        return nodesObj[node["mac-address"]]["last-successful-communication"]
            ? nodesObj[node["mac-address"]]["last-successful-communication"].toString()
            : "";
    };
    const getNodeDcStateTxt = function (nodesObj, node) {
        return defined(nodesObj[node["mac-address"]]["meter-state"])
            ? nodesObj[node["mac-address"]]["meter-state"].toString()
            : "METER-JOINED";
    };
    const getNodeSuccessRate = function (nodesObj, node) {
        const succ = parseInt(nodesObj[node["mac-address"]]["successful-communications"], 10);
        const unsucc = parseInt(nodesObj[node["mac-address"]]["unsuccessful-communications"], 10);
        return (!Number.isNaN(succ) && !Number.isNaN(unsucc) && succ + unsucc !== 0)
            ? parseInt((succ / (succ + unsucc)) * 100, 10)
            : undefined;
    };
    const getNodeLastSuccessfulCommTxt = function (nodesObj, node) {
        if (nodesObj[node["mac-address"]]["last-successful-communication"] && nodesObj[node["mac-address"]]["last-successful-communication"].toString() !== "0") {
            return moment(nodesObj[node["mac-address"]]["last-successful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT"));
        }
        return "";
    };
    const getNodeLastUnsuccessfulCommTxt = function (nodesObj, node) {
        if (nodesObj[node["mac-address"]]["last-unsuccessful-communication"] && nodesObj[node["mac-address"]]["last-unsuccessful-communication"].toString() !== "0") {
            return moment(nodesObj[node["mac-address"]]["last-unsuccessful-communication"].toString()).format(AppMain.localization("DATETIME_FORMAT"));
        }
        return "";
    };
    const getNodeSecurityCounter = function (nodesObj, node) {
        return defined(nodesObj[node["mac-address"]]["security-counter"])
            ? nodesObj[node["mac-address"]]["security-counter"]
            : "---";
    };

    this.arrangeNodes = function (nodes, nodesObj) {

        $.each(nodes, function (ignore, node) {
            if (nodesObj[node["mac-address"]]) {
                node["node-title"] = getNodeTitle(nodesObj, node);
                node["node-commissioned"] = getNodeCommissioned(nodesObj, node);
                node["node-last-comm"] = getNodeLastCommTxt(nodesObj, node);
                node["dc-state"] = getNodeDcStateTxt(nodesObj, node);
                node["success-rate"] = getNodeSuccessRate(nodesObj, node);
                node["successful-communications"] = nodesObj[node["mac-address"]]["successful-communications"];
                node["last-successful-communication"] = getNodeLastSuccessfulCommTxt(nodesObj, node);
                node["unsuccessful-communications"] = nodesObj[node["mac-address"]]["unsuccessful-communications"];
                node["last-unsuccessful-communication"] = getNodeLastUnsuccessfulCommTxt(nodesObj, node);
                node["security-counter"] = getNodeSecurityCounter(nodesObj, node);
            } else {
                node["dc-state"] = "---";
            }
        });
        return nodes;
    };
    this.calculateNodeShortAddress = function (node) {
        let obj = {
            shortAddress: "",
            shortAddressPom: ""
        };
        if (node["ip-address"]) {
            const arr = node["ip-address"].split(":");
            obj.shortAddress = arr[arr.length - 1].toUpperCase();
            obj.shortAddressPom = parseInt(arr[arr.length - 1].toUpperCase(), 16);
            if (obj.shortAddress.length % 2 === 1) {
                obj.shortAddress = "0" + obj.shortAddress;
            }
        }
        return obj;
    };

    const getGroupsFromRestResponse = function (response) {
        let groups = response.ResponseMessage.Payload.DeviceGroup.DeviceGroup;
        if (groups.length === undefined) {
            groups = [groups];
        }
        return groups;
    };
    const isGroupRestResponseOk = function (response) {
        return (response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result && response.ResponseMessage.Reply.Result.toString() === "OK");
    };

    this.getGroups = function () {
        let response = AppMain.wsMes().exec("RequestMessage", {
            "mes:Header": {
                "mes:Verb": "get",
                "mes:Noun": "DeviceGroup",
                "mes:Timestamp": moment().toISOString(),
                "mes:MessageID": "78465521",
                "mes:CorrelationID": "78465521"
            }
        }).getResponse(false);

        if (response && response.ResponseMessage && isGroupRestResponseOk(response)) {
            let groups = getGroupsFromRestResponse(response);
            let rez = [];
            $.each(groups, function (ignore, group) {
                rez.push({
                    id: group._GroupID
                });
            });
            return rez;
        }
        return [];
    };
    this.setHeader = function (allTextLines) {
        let header = allTextLines[0];
        if (allTextLines[0] === "SEP=,") { //second line is header line
            header = allTextLines[1];
        }
        return header;
    };
    this.setStartIndex = function (allTextLines) {
        let startInd = 1;
        if (allTextLines[0] === "SEP=,") { //second line is header line
            startInd = 2;
        }
        return startInd;
    };
};