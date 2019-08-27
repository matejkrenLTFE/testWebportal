/**
 * @class CtrlActionWhiteList Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
const CtrlActionWhiteList = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");

CtrlActionWhiteList.exec = function () {
    "use strict";

    this.view.setTitle("WHITE_LIST");

    if (this.view.cached("WhiteList#WhiteList")) {
        this.view.renderFromCache("WhiteList#WhiteList");
    } else {
        this.view.renderEmpty("WhiteList#WhiteList", {
            labels: {
                title: AppMain.t("WHITE_LIST_MNG", "WHITE_LIST"),
                description: ""
            },
            htmlNodes: "---",
            totalNodes: 0,
            activeNodes: 0
        }, true);
    }

    this.nodes = AppMain.ws().exec("GetNodeList", {
        "with-data": true
    }).getResponse(false);

    this.params = AppMain.ws().exec("GetParameters", {"plc": ""}).getResponse(false);
    this.params = defined(this.params.GetParametersResponse.plc) ? this.params.GetParametersResponse.plc : {};
    let list = {};
    let tooltipHtml = "";

    this.nodes = (this.nodes.GetNodeListResponse.node instanceof Array) ? this.nodes.GetNodeListResponse.node : this.nodes.GetNodeListResponse;
    if (this.nodes.__prefix !== undefined)
        delete this.nodes.__prefix;

    //fix for white list length of 1
    if (this.params["white-list"] !== undefined && typeof this.params["white-list"]["mac-address"] === "string") {
        this.params["white-list"]["mac-address"] = [this.params["white-list"]["mac-address"]];
    }
    this.whiteListArr = [];
    if (this.params && this.params["white-list"] && this.params["white-list"]["mac-address"]) {
        $.each(this.params["white-list"]["mac-address"], function (index, node) {
            CtrlActionWhiteList.whiteListArr.push(node);
        });
        list = this._buildNodeListHTML(this, this.nodes, this.params["white-list"]["mac-address"]);
        tooltipHtml = this.htmlTooltips(this, this.nodes, this.params["white-list"]["mac-address"]);
    } else {
        list = this._buildNodeListHTML(this, this.nodes, []);
    }

    this.view.render("WhiteList#WhiteList", {
        labels: {
            title: AppMain.t("WHITE_LIST_MNG", "WHITE_LIST"),
            description: "",
            btnRefresh: AppMain.t("REFRESH_LIST", "WHITE_LIST"),
            btnExport: AppMain.t("EXPORT", "WHITE_LIST"),
            btnDelete: AppMain.t("DELETE", "WHITE_LIST"),
            useWhiteListText: AppMain.t("USE_WHITE_LIST", "WHITE_LIST"),
            macAddress: AppMain.t("MAC_ADDRESS", "WHITE_LIST"),
            ipAddress: AppMain.t("IP_ADDRESS", "WHITE_LIST"),
            totalWhiteListDevices: AppMain.t("TOTAL_WHITE_LIST", "WHITE_LIST"),
            macAddressLabel: AppMain.t("MAC_ADDRESS", "WHITE_LIST"),
            addWhiteListTxt: AppMain.t("ADD_WHITE_LIST_TXT", "WHITE_LIST"),
            addMac: AppMain.t("ADD", "global"),
            filter: AppMain.t("FILTER", "global")
        },
        elements: {
            useWhiteList: AppMain.html.formElementSwitch("use-white-list", "true", {
                checked: this._getWhiteListStatus(this.params),
                labelClass: "useWhiteListClass",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionWANEthernet.useWhiteListConfirm"
                }
            })
        },
        htmlNodes: list.htmlNodes,
        totalNodes: list.totalNodes,
        activeNodes: list.totalNodes,
        htmlTooltips: tooltipHtml
    }, true);

    const tableOptions = {
        valueNames: ["mac-address", "ip-address"]
    };
    this.initTable("whiteNodesList", "whiteNodesList", tableOptions);
    this.initSelectAll("selectAllNodes");

    $("[name='use-white-list']").val(CtrlActionWhiteList._getWhiteListStatus(this.params));
    AppMain.html.updateElements([".mdl-textfield", ".mdl-js-switch"]);
};

CtrlActionWhiteList._getWhiteListStatus = function (params) {
    return (params["use-white-list"] === "true" && params["acl-auto-add-mode"] === "false");
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionWhiteList._buildNodeListHTML = function (_this, nodes, whiteList) {
    let list = {totalNodes: 0, htmlNodes: ""};

    let i = 1;
    $.each(nodes, function (index, node) {
        const ind = whiteList.indexOf(node["mac-address"]);
        if (ind !== -1) { // node is in white list
            whiteList.splice(ind, 1);
            list.htmlNodes += "<tr>";
            list.htmlNodes += "<td class='mdl-data-table__cell--non-numeric checkbox-col'>" +
                "<input type='checkbox' name='selectNode' class='selectNode' " +
                "data-node-id='" + i + "'" +
                " data-node-mac='" + node["mac-address"] + "'" +
                " data-node-ip='" + node["ip-address"] + "'" +
                "/></td>";
            list.htmlNodes += "<td class='mdl-data-table__cell--non-numeric mac-address'>" + node["mac-address"] + "</td>";
            list.htmlNodes += "<td class='mdl-data-table__cell--non-numeric ip-address'>" + node["ip-address"] + "</td>";
            list.htmlNodes += "</tr>";
            i++;
        }
    });

    //display the rest of white list, those have unknown IP
    $.each(whiteList, function (index, node) {
        list.htmlNodes += "<tr>";
        list.htmlNodes += "<td class='mdl-data-table__cell--non-numeric checkbox-col'>" +
            "<input type='checkbox' name='selectNode' class='selectNode' " +
            "data-node-id='" + i + "'" +
            " data-node-mac='" + node + "'" +
            " data-node-ip='---'" +
            "/></td>";
        // list.htmlNodes += "<td style=\"text-align: left!important;\" >"+i+"."+"</td>";
        list.htmlNodes += "<td class='mdl-data-table__cell--non-numeric '>" + node + "</td>";
        list.htmlNodes += "<td class='mdl-data-table__cell--non-numeric '> --- </td>";
        list.htmlNodes += "</tr>";
        i++;
    });

    list.totalNodes = i - 1;
    if (list.totalNodes === 0) {
        list.htmlNodes = "<tr><td colspan='3'><p style='text-align:center'>" + AppMain.t("WHITE_LIST_EMPTY", "WHITE_LIST") + "</p></td></tr>";
    }
    return list;
};

CtrlActionWhiteList.setWhiteList = function (arr) {
    const client = AppMain.ws();
    client.xmlSetElement("plc");
    client.xmlSetElement("white-list");
    $(arr).each(function (index, mac) {
        client.xmlSetParam("mac-address", mac);
    });
    const p = client.xmlGetStructure();
    const response = client.exec("SetParameters", p).getResponse(false);

    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
        this.exec();
    } else
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");

    AppMain.html.updateElements(["#macinput", ".mdl-js-switch"]);
};

CtrlActionWhiteList.__exportNodeList = function (newMac) {

    let whitelistArr = this.whiteListArr.slice();
    whitelistArr.push(newMac);
    CtrlActionWhiteList.setWhiteList(whitelistArr);
};


CtrlActionWhiteList.__exportNodeListArr = function () {
    CtrlActionWhiteList.setWhiteList(this.export);
};

CtrlActionWhiteList.removeMac = function (e) {
    const $this = $(e.target);
    const mac = $this.attr("data-node-mac");
    const ind = this.whiteListArr.indexOf(mac);
    if (ind !== -1) {
        this.whiteListArr.splice(ind, 1);
    }
    let whitelistArr = this.whiteListArr.slice();
    CtrlActionWhiteList.setWhiteList(whitelistArr);
};

CtrlActionWhiteList.useWhiteListConfirm = function () {
    const switchButton = document.querySelector(".mdl-js-switch").MaterialSwitch;
    const enabled = $("[name='enable']").val() === "true";

    $.confirm({
        title: AppMain.t("WHITE_LIST_USE_WHITE_LIST", "WHITE_LIST"),
        content: AppMain.t("CONFIRM_USE_WHITELIST_PROMPT", "global"),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    CtrlActionWhiteList.__useWhiteList();
                    return true;
                }
            },
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {
                        if (enabled)
                            switchButton.on();
                        else
                            switchButton.off();
                        return true;
                    }
            }
        }
    });
};

CtrlActionWhiteList.__useWhiteList = function () {
    const sw = $("[name='use-white-list']");
    const switchButton = document.querySelector(".mdl-js-switch").MaterialSwitch;
    const enabled = sw.val() === "true";
    if (enabled) {
        switchButton.off();
        sw.val(false);
    } else {
        switchButton.on();
        sw.val(true);
    }

    const client = AppMain.ws();
    client.xmlSetElement("plc");
    client.xmlSetParam("use-white-list", true); //this is now always true
    if (enabled) {
        client.xmlSetParam("acl-auto-add-mode", enabled);
    } else {
        client.xmlSetParam("acl-auto-add-mode", enabled);
    }
    const p = client.xmlGetStructure();
    const response = client.exec("SetParameters", p).getResponse(false);

    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK")
        AppMain.dialog("SUCC_UPDATED", "success");
    else
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");

    AppMain.html.updateElements(["#macinput", ".mdl-js-switch"]);
};

CtrlActionWhiteList.addWhiteList = function () {
    let selObj = {};
    $.each(this.nodes, function (index, node) {
        selObj["'" + node["mac-address"] + "'"] = node["mac-address"];
    });
    const selectHTML = AppMain.html.formElementSelect("add-from-attached", selObj, {
        label: "",
        elementSelected: ""
    });
    let selectRow = "";
    if (this.nodes.length > 0) {
        selectRow = "<tr>\n    " +
            "<td class=\"mdl-data-table__cell--non-numeric\">\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='input-attached' id=\"input-attached\" name=\"input-type\" class=\"mdl-radio__button\" checked>\n        " +
            "</label>\n    " +
            "</td>\n    " +
            "<td>\n        " +
            AppMain.t("SELECT_FROM_ATTACHED", "WHITE_LIST") + selectHTML +
            "</td>\n" +
            "</tr>";
    }
    const macRow = "<tr>\n    " +
        "<td class=\"mdl-data-table__cell--non-numeric\">\n        " +
        "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
        "<input type=\"radio\" value='input-mac' id=\"input-mac\" name=\"input-type\" class=\"mdl-radio__button\">\n        " +
        "</label>\n    " +
        "</td>\n    " +
        "<td>\n    " +
        AppMain.t("SELECT_FROM_MAC", "WHITE_LIST") +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac1\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac2\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac3\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac4\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac5\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac6\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac7\" maxlength=\"2\"/></div> : " +
        "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mac-input\"><input  class=\"mdl-textfield__input\" type=\"text\" name=\"mac8\" maxlength=\"2\"/></div>" +
        "</td>" +
        "</tr>";

    const importHtml = "\n    <tr>\n        " +
        "        <td class=\"mdl-data-table__cell--non-numeric\">\n            " +
        "          <label class = \"mdl-radio mdl-js-radio\" for = \"option2\">\n                " +
        "          <input type = \"radio\" value='input-import' id = \"input-import\" name = \"input-type\" class=\"mdl-radio__button\">\n            " +
        "         </label>\n        " +
        "        </td>\n        " +
        "       <td>\n            " +
        "<span>" + AppMain.t("SELECT_FROM_IMPORT", "WHITE_LIST") + "</span>" +
        "           <span class=\"select-file\">\n                " +
        "               <input id=\"file\" type=\"file\" name=\"upload\" />\n            " +
        "           </span>\n            " +
        "           <div id=\'file-selected\' style=\"display: none;float: right;\" class=\"file-selected\">\n                " +
        "               <i class=\'material-icons cursor-pointer\' id=\'remove-\' onclick=\'$(\"#file\").val(\"\");$(\".select-file\").show();$(\"#file-name\").html(\"\");$(\".file-selected\").hide();\'>clear</i>\n" +
        "           </div>\n            " +
        "           <div style=\"display: none;float:right; margin-right: 15px;margin-top: 3px;\" class=\"file-selected\" id=\"file-name\"></div>\n" +
        "        </td>\n    " +
        "</tr>";


    let allHtml = "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
        selectRow +
        macRow +
        importHtml +
        "</table>";

    $.confirm({
        title: AppMain.t("ADD_WHITE_LIST_TXT", "WHITE_LIST"),
        content: allHtml,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("ADD", "global"),
                action: function () {
                    const radio = $("input[type='radio']:checked").val();
                    if (radio === "input-attached") {  // add from attached
                        const mac = $("select[name='add-from-attached']").val();
                        CtrlActionWhiteList.__exportNodeList(mac.replace("'", "").replace("'", ""));
                        return true;
                    }
                    if (radio === "input-mac") {  // add from attached
                        const mac1 = $("input[name='mac1']").val();
                        const mac2 = $("input[name='mac2']").val();
                        const mac3 = $("input[name='mac3']").val();
                        const mac4 = $("input[name='mac4']").val();
                        const mac5 = $("input[name='mac5']").val();
                        const mac6 = $("input[name='mac6']").val();
                        const mac7 = $("input[name='mac7']").val();
                        const mac8 = $("input[name='mac8']").val();
                        if (mac1.length === 2 && mac2.length === 2 && mac3.length === 2 && mac4.length === 2
                            && mac5.length === 2 && mac6.length === 2 && mac7.length === 2 && mac8.length === 2) {
                            CtrlActionWhiteList.__exportNodeList(mac1 + ":" + mac2 + ":" + mac3 + ":" + mac4 + ":" + mac5 + ":" + mac6 + ":" + mac7 + ":" + mac8);
                            return true;
                        } else {
                            $.alert({
                                title: AppMain.t("ERROR", "global"),
                                content: AppMain.t("WHITE_LIST_ADD_ERR", "WHITE_LIST"),
                                useBootstrap: false,
                                theme: "material",
                                buttons: {
                                    confirm: {
                                        text: AppMain.t("OK", "global")
                                    }
                                }
                            });
                            return false;
                        }
                    }
                    if (radio === "input-import") {  // add from attached
                        if ($("#file-selected").is(":visible")) {
                            CtrlActionWhiteList.__exportNodeListArr();
                            return true;
                        } else {
                            $.alert({
                                useBootstrap: false,
                                theme: "material",
                                title: AppMain.t("IMPORT_WHITE_LIST_TXT", "WHITE_LIST"),
                                content: AppMain.t("IMPORT_WHITE_LIST_SELECT_FILE", "WHITE_LIST"),
                                buttons: {
                                    confirm: {
                                        text: AppMain.t("OK", "global")
                                    }
                                }
                            });
                            return false;
                        }
                    }


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
        const inputElement = document.getElementById("file");
        inputElement.addEventListener("change", function () {
            const uploadElement = this;

            const reader = new FileReader();

            reader.onload = function (e) {
                CtrlActionWhiteList.export = []; // array of macs

                const csv = e.target.result;
                if (!csv.includes("\r\n") && !csv.includes("\n")) {
                    CtrlActionWhiteList.importAlert(AppMain.t("IMPORT_WHITE_LIST_CSV_ERROR", "WHITE_LIST"));
                    return;
                }
                const allTextLines = csv.split(/\r\n|\n/);

                let header = allTextLines[0];
                let startInd = 1;
                if (allTextLines[0] === "SEP=,") { //second line is header line
                    header = allTextLines[1];
                    startInd = 2;
                }
                if (!header.includes(",")) {
                    CtrlActionWhiteList.importAlert(AppMain.t("IMPORT_WHITE_LIST_CSV_ERROR", "WHITE_LIST"));
                    return;
                }
                header = header.split(",");
                //get index of "MAC column"
                const ind = header.indexOf("\"" + AppMain.t("MAC_ADDRESS", "NODES") + "\"");
                if (ind === -1) {
                    CtrlActionWhiteList.importAlert(AppMain.t("IMPORT_WHITE_LIST_ERROR", "WHITE_LIST"));
                }
                for (let index in allTextLines) {
                    if (allTextLines.hasOwnProperty(index)) {
                        if (parseInt(index) < startInd)
                            continue;
                        const line = allTextLines[index];
                        if (line !== "")
                            CtrlActionWhiteList.export.push(line.split(",")[ind].replace("\"", "").replace("\"", ""));
                    }
                }
            };
            reader.readAsText(uploadElement.files[0]);
            $(".select-file").hide();
            $("#file-name").html(uploadElement.files[0].name);
            $(".file-selected").show();
        }, false);
    }, 200);
};


CtrlActionWhiteList.__exportWhiteList = function () {
    let csv = "";
    let isNotSelected = true;
    let inputC = $("input:checked");


    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        // csv += '"' + AppMain.t("#") + '",';
        csv += "\"" + AppMain.t("MAC_ADDRESS", "WHITE_LIST") + "\",";
        csv += "\"" + AppMain.t("IP_ADDRESS", "WHITE_LIST") + "\",";
        csv += "\r\n";

        inputC.each(function (i, elm) {
            const element = $(elm);
            if (element.hasClass("selectNode")) {
                isNotSelected = false;
                csv += "\"" + element.attr("data-node-mac") + "\",";
                csv += "\"" + element.attr("data-node-ip") + "\"";
                csv += "\r\n";
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("WHITE_LIST_EMPTY_EXPORT", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_WHITE", "success");

    const download = require("./vendor/download.js");
    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_WhiteList_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
};


CtrlActionWhiteList.importWhiteList = function () {
    let html = "<table class=\"mdl-data-table mdl-js-data-table\" style=\"width: 100%\">\n    " +
        "<tr>" +
        "  \n        <td class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("UPLOAD_FILE", "WHITE_LIST") + "</td>" +
        "  \n        <td>" +
        "                            \n            <div class=\"select-file\">\n" +
        "                <input id=\"file\" type=\"file\" name=\"upload\" />\n" +
        "            </div>\n" +
        " " +
        "           <div id='file-selected' style=\"display: none;float: right;\" class=\"file-selected\">\n                " +
        "<i class=\'material-icons cursor-pointer\' id=\'remove-\' onclick=\'$(\"#file\").val(\"\");$(\".select-file\").show();$(\"#file-name\").html(\"\");$(\".file-selected\").hide();\'>clear</i>\n" +
        "            </div>\n            " +
        "<div style=\"display: none;float:right; margin-right: 15px;margin-top: 3px;\" class=\"file-selected\" id=\"file-name\"></div>\n        " +
        "</td>\n    </tr>\n</table>\n";

    $.confirm({
        title: AppMain.t("IMPORT_WHITE_LIST_TXT", "WHITE_LIST"),
        content: html,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("IMPORT", "global"),
                action: function () {
                    if ($("#file-selected").is(":visible")) {
                        CtrlActionWhiteList.__exportNodeListArr();
                        return true;
                    } else {
                        $.alert({
                            useBootstrap: false,
                            theme: "material",
                            title: AppMain.t("IMPORT_WHITE_LIST_TXT", "WHITE_LIST"),
                            content: AppMain.t("IMPORT_WHITE_LIST_SELECT_FILE", "WHITE_LIST"),
                            buttons: {
                                confirm: {
                                    text: AppMain.t("OK", "global")
                                }
                            }
                        });
                        return false;
                    }
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


CtrlActionWhiteList.importAlert = function (content) {
    $.alert({
        useBootstrap: false,
        theme: "material",
        title: AppMain.t("IMPORT_WHITE_LIST_TXT", "WHITE_LIST"),
        content: content,
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global")
            }
        }
    });
    $("#file").val("");
    $(".select-file").show();
    $("#file-name").html("");
    $(".file-selected").hide();
};


CtrlActionWhiteList.htmlTooltips = function (_this, nodes, whiteList) {
    let html = "";

    let i = 1;
    $.each(nodes, function () {
        html += "<div class='mdl-tooltip' data-mdl-for='remove-" + i + "'>" + AppMain.t("REMOVE", "global") + " </div>";
        i++;
    });
    $.each(whiteList, function () {
        html += "<div class='mdl-tooltip' data-mdl-for='remove-" + i + "'>" + AppMain.t("REMOVE", "global") + "</div>";
        i++;
    });

    return html;
};

CtrlActionWhiteList.deleteWhiteList = function () {
    const inputChecked = $("input:checked");
    let isEmpty = true;
    if (inputChecked.length > 0) {
        inputChecked.each(function (i, elm) {
            const element = $(elm);
            if (element.hasClass("selectNode")) {
                isEmpty = false;
                const mac = element.attr("data-node-mac");
                const ind = CtrlActionWhiteList.whiteListArr.indexOf(mac);
                if (ind !== -1) {
                    CtrlActionWhiteList.whiteListArr.splice(ind, 1);
                }
            }
        });
    }

    if (isEmpty) {
        AppMain.dialog("DELETE_WHITELIST", "default");
    } else {
        let whitelistArr = this.whiteListArr.slice();
        CtrlActionWhiteList.setWhiteList(whitelistArr);
    }
};

CtrlActionWhiteList.init = function () {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};
CtrlActionWhiteList.onBeforeExecute = function () {
    // $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionWhiteList = CtrlActionWhiteList;
