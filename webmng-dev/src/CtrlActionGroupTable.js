/**
 * @class CtrlActionGroupTable Controller action using IControllerAction interface.
 */
/* global AppMain, FileReader, $ */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

let modulecontrolleraction = require("./IControllerAction");
let CtrlActionGroupTable = Object.create(new modulecontrolleraction.IControllerAction());
let moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionGroupTable.exec = function () {
    "use strict";
    this.view.setTitle("GROUP_TABLE");

    this.view.renderEmpty("GroupTable#ViewGroups", {
        labels: {
            title: AppMain.t("TITLE", "GROUP_TABLE")
        },
        htmlGroups: "---"
    }, true);
    this.devicesForDetails = [];

    this.groups = this.getGroups();

    const nodesCosemStat = AppMain.wsMes().exec("CosemDeviceStatisticRequest", "").getResponse(false);
    if (nodesCosemStat && nodesCosemStat.GetCosemDeviceStatisticResponse &&
            nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"]) {
        this.arrangeNodeCosemStat(nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"]);
    }

    const cntrR = AppMain.ws().exec("GetParameters", {"cntr": {}}).getResponse(false);
    let cntr = "";
    if (cntrR.GetParametersResponse && cntrR.GetParametersResponse.cntr && cntrR.GetParametersResponse.cntr["dc-push-destination-url"]) {
        cntr = cntrR.GetParametersResponse.cntr;
    }

    let list = this.buildGroupsListHTML(this.groups);

    this.view.render("GroupTable#ViewGroups", {
        labels: {
            title: AppMain.t("TITLE", "GROUP_TABLE"),
            titleSet: AppMain.t("TITLE_SET", "GROUP_TABLE"),
            apply: AppMain.t("APPLY", "global"),
            pushDest: AppMain.t("PUSH_DEST_URL", "GROUP_TABLE"),
            pushRetries: AppMain.t("PUSH_RETRIES", "GROUP_TABLE"),
            pushTimeout: AppMain.t("PUSH_TIMEOUT", "GROUP_TABLE"),
            btnRefresh: AppMain.t("REFRESH_LIST", "GROUP_TABLE"),
            groupID: AppMain.t("GROUP_ID", "GROUP_TABLE"),
            btnAdd: AppMain.t("ADD_GROUP", "GROUP_TABLE"),
            btnExport: AppMain.t("EXPORT", "global"),
            filter: AppMain.t("FILTER", "global"),
            btnImport: AppMain.t("IMPORT_FROM_FILE", "GROUP_TABLE")
        },
        htmlTooltips: this.htmlTooltips,
        htmlGroups: list.htmlGroups,
        cntr: cntr
    }, true);

    const tableOptions = {
        valueNames: ["group-name"]
    };
    this.initTable("groupsList", "groupsList", tableOptions);
    this.initSelectAllForGroup("selectAll");


    //Fix attached devices table width
    $(".main-canvas").addClass("main-canvas-attached-devices");
    AppMain.html.updateAllElements();
};

/**
 * Build HTML nodes table.
 * @return {Object} {htmlNodes, totalNodes}
 */
CtrlActionGroupTable.buildGroupsListHTML = function (groups) {
    "use strict";
    let list = {groupsCount: 0, htmlGroups: ""};

    let i = 1;
    CtrlActionGroupTable.htmlTooltips = "";
    $.each(groups, function (index, group) {
        list.htmlGroups += "<tr>";
        list.htmlGroups += "<td class='checkbox-col' style='text-align: left!important;'><input type='checkbox' name='selectGroup' " +
                "class='selectGroup' data-group-id='" + group.id + "'> </td>";
        list.htmlGroups += "<td colspan='2' data-bind-event='click' data-bind-method='CtrlActionGroupTable.getGroupDevices' " +
                "data-group-id='" + group.id + "' style='text-align: left!important;' class='group-name cursor-pointer'>" + group.id + "</td>";

        if (group.id !== "DG_ALL_METERS") { // for now just hardcoded if
            list.htmlGroups += "<td colspan='2'>" +
                    "<i id='delete_" + group.id + "' data-rbac=\"groupsTable.delete\" class=\"material-icons cursor-pointer\" " +
                    "data-bind-event=\"click\" data-bind-method=\"CtrlActionGroupTable.deleteGroup\" data-group-id='" + group.id +
                    "'>clear</i>" +
                    "<i id='edit_" + group.id + "' data-rbac=\"groupsTable.edit\" class=\"material-icons cursor-pointer\" " +
                    "data-bind-event=\"click\" data-bind-method=\"CtrlActionGroupTable.editGroup\" data-group-id='" + group.id +
                    "'>edit</i>" +
                    "</td>";
        } else {
            list.htmlGroups += "<td colspan='2'></td>";
        }

        list.htmlGroups += "</tr>";
        if (group.id !== "DG_ALL_METERS") { // for now just hardcoded if
            CtrlActionGroupTable.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"delete_" + group.id + "\">" +
                    AppMain.t("DELETE", "global") + "</div>";
            CtrlActionGroupTable.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"edit_" + group.id + "\">" +
                    AppMain.t("EDIT", "global") + "</div>";
        }
        list.groupsCount += 1;
        i += 1;
    });

    return list;
};

CtrlActionGroupTable.deleteGroup = function (e) {
    "use strict";

    const $this = $(e.target);
    let group = $this.attr("data-group-id");

    $.each(this.groups, function (index, node) {
        if (node.id === group) {
            $.confirm({
                title: AppMain.t("DELETE_GROUP", "GROUP_TABLE"),
                content: AppMain.t("DELETE_GROUP_DESC", "GROUP_TABLE", [group]),
                useBootstrap: false,
                theme: "material",
                buttons: {
                    confirm: {
                        text: AppMain.t("OK", "global"),
                        action: function () {
                            return CtrlActionGroupTable.deleteGroupRest(group);
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
            return false;
        }
    });
};

CtrlActionGroupTable.deleteGroupRest = function (group) {
    "use strict";

    let response = AppMain.wsMes().exec("RequestMessage", {
        "mes:Header": {
            "mes:Verb": "delete",
            "mes:Noun": "DeviceGroup",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Payload": {
            "mes:DeviceGroup": {
                "mes:DeviceGroup": {
                    "_GroupID": group
                }
            }
        }
    }).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        setTimeout(function () {
            CtrlActionGroupTable.exec();
        }, 200);
        AppMain.dialog("GROUP_REMOVED", "success");
        return true;
    }
    AppMain.dialog("GROUP_REMOVED_ERROR", "success");
    return false;
};

CtrlActionGroupTable.getGroups = function () {
    "use strict";
    let response = AppMain.wsMes().exec("RequestMessage", {
        "mes:Header": {
            "mes:Verb": "get",
            "mes:Noun": "DeviceGroup",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        }
    }).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        let groups = response.ResponseMessage.Payload.DeviceGroup.DeviceGroup;
        let rez = [];
        if (groups.length === undefined) {
            groups = [groups];
        }
        $.each(groups, function (index, group) {
            rez.push({
                id: group._GroupID
            });
        });
        return rez;
    }
    return [];
};

CtrlActionGroupTable.getGroupDevices = function (e) {
    "use strict";

    const $this = $(e.target);
    const $thisParent = $(e.target).parent();
    const selectedGroup = $this.attr("data-group-id");
    const gd = $("table tr.row-details");

    if ($thisParent.attr("data-opened") === "1") {
        $thisParent.removeAttr("data-opened");
        gd.remove();
        return true;
    }

    $thisParent.attr("data-opened", "0");
    gd.remove();

    let response = AppMain.wsMes().exec("RequestMessage", {
        "mes:Header": {
            "mes:Verb": "get",
            "mes:Noun": "DeviceGroup",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Payload": {
            "mes:DeviceGroup": {
                "mes:DeviceGroup": {
                    "_GroupID": selectedGroup
                }
            }
        }
    }).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        let groups = response.ResponseMessage.Payload.DeviceGroup.DeviceGroup.DeviceReference;
        let prefix;
        if (response.ResponseMessage.Payload.DeviceGroup.DeviceGroup._Prefix) {
            prefix = response.ResponseMessage.Payload.DeviceGroup.DeviceGroup._Prefix;
        } else {
            prefix = "---";
        }
        if (groups) {
            if (groups.length === undefined) {
                groups = [groups];
            }

            let isMore = false;
            let devicesHtml = "";
            if (groups.length > 0) {
                devicesHtml += groups[0]._DeviceID;
            }
            if (groups.length > 1) {
                isMore = true;
                devicesHtml += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
            }
            CtrlActionGroupTable.devicesForDetails = groups;
            let html = "<tr class='row-details'><td></td><td style='text-align: left'>" + AppMain.t("DEVICES", "GROUP_TABLE") + "</td>";
            if (isMore) {
                html += "<td data-bind-method='CtrlActionGroupTable.showNodes' data-bind-event='click' class='cursor-pointer' " +
                        "style='text-align: left'>" + devicesHtml + "</td>";
            } else {
                html += "<td style='text-align: left'>" + devicesHtml + "</td>";
            }
            html += "<td>" + AppMain.t("GROUP_PREFIX", "GROUP_TABLE") + "</td>";
            html += "<td>" + prefix + "</td>";
            html += "</tr>";
            $thisParent.after(html);
            $thisParent.attr("data-opened", 1);
        }
    }
    CtrlActionGroupTable.view.rebindElementEvents();
    return true;
};

CtrlActionGroupTable.showNodes = function () {
    "use strict";

    let tableHTML = "";
    $.each(this.devicesForDetails, function (index, node) {
        if (index === 0) {
            tableHTML += "<tr>";
        } else {
            if (index % 3 === 0) {
                tableHTML += "</tr><tr>";
            }
        }
        tableHTML += "<td>" + node._DeviceID + "</td>";
    });

    let allHtml = "<table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            "<thead class=\"th-color-grey text-align-left\"><tbody>";
    allHtml += tableHTML;
    allHtml += "</tbody></table>";


    $.confirm({
        title: AppMain.t("DEVICES", "GROUP_TABLE"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        backgroundDismiss: true,
        theme: "material",
        buttons: {
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action: function () {
                    return true;
                }
            }
        }
    });
};


CtrlActionGroupTable.editGroup = function (e) {
    "use strict";

    const $this = $(e.target);
    const selectedGroup = $this.attr("data-group-id");

    let response = AppMain.wsMes().exec("RequestMessage", {
        "mes:Header": {
            "mes:Verb": "get",
            "mes:Noun": "DeviceGroup",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Payload": {
            "mes:DeviceGroup": {
                "mes:DeviceGroup": {
                    "_GroupID": selectedGroup
                }
            }
        }
    }).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        let devices = response.ResponseMessage.Payload.DeviceGroup.DeviceGroup.DeviceReference;
        let selectedGroupPrefix;
        if (response.ResponseMessage.Payload.DeviceGroup.DeviceGroup._Prefix) {
            selectedGroupPrefix = response.ResponseMessage.Payload.DeviceGroup.DeviceGroup._Prefix;
        } else {
            selectedGroupPrefix = "";
        }
        let devArr = [];
        if (devices && devices.length === undefined) {
            devices = [devices];
        }
        $.each(devices, function (index, device) {
            devArr.push(device._DeviceID);
        });
        CtrlActionGroupTable.addGroup(selectedGroup, selectedGroupPrefix, devArr);
    }
};
CtrlActionGroupTable.addGroup = function (group, prefix, devices) {
    "use strict";

    let selGroup = "";
    let selPrefix = "";
    let disabled = "";
    if (group && devices) {
        selGroup = group;
        selPrefix = prefix;
        disabled = "disabled";
    } else {
        group = undefined;
    }
    const addHtml = "<tr class='dynamic-hide'><td>" + AppMain.t("DEVICE_TITLE", "TASK_MANAGER") + "</td><td>" +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id='add-title' name=\"add-title\"/></div>" +
            " <i id='add-icon' class=\"material-icons title_icon\">add</i>" +
            "</td></tr>";

    const importHtml = "<tr class='dynamic-hide'><td>" + AppMain.t("DEVICE_IMPORT", "TASK_MANAGER") + "</td><td>" +
            "<span class=\"select-file\"> <input id=\"file\" type=\"file\" name=\"upload\" /></span>" +
            "<div id='file-selected' style=\"display: none;float: right;\" class=\"file-selected\">" +
            "   <i class='material-icons cursor-pointer' id='remove-' onclick='$(\"#file\").val(\"\");$(\".select-file\")" +
            ".show();$(\"#file-name\").html(\"\");$(\".file-selected\").hide();'>clear</i>" +
            "<div style=\"display: none;float:right; margin-right: 15px;margin-top: 3px;\" class=\"file-selected\" id=\"file-name\"></div>" +
            "</td></tr>";

    const groupID = "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            "<tr> <td>" + AppMain.t("GROUP_ID", "GROUP_TABLE") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" name=\"group-id\" value='" + selGroup + "' " + disabled + "/></div></td>" +
            "</tr>";

    const groupPrefix = "<tr> <td>" + AppMain.t("GROUP_PREFIX", "GROUP_TABLE") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" name=\"group-prefix\" value='" + selPrefix + "' " + disabled + "/></div></td>" +
            "</tr>";

    let allHtml = AppMain.t("SELECT_DEVICES", "GROUP_TABLE") + "</br></br>" +
            groupID +
            groupPrefix +
            addHtml +
            importHtml +
            "</table><table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders dynamic-hide\" style=\"width: 100%\">" +
            "<thead class=\"th-color-grey text-align-left\">" +
            "<tr>" +
            "<th style='width: 30px;padding-left: 18px'><input class=\"selectAllNodes\" name=\"selectAllNodes\" type=\"checkbox\"/></th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("DEVICE_TITLE", "TASK_MANAGER") + "</th>" +
            "</tr>" +
            "</thead><tbody>";

    if (this.nodesTitle && this.nodesTitle.length > 0) {
        $.each(this.nodesTitle, function (index, title) {
            if (title.toString() !== "[object Object]") {
                allHtml += "<tr>";
                if (devices && devices.indexOf(title.toString()) !== -1) {
                    const ind = devices.indexOf(title.toString());
                    devices.splice(ind, 1);
                    allHtml += "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + title + "' checked/></td>";
                } else {
                    allHtml += "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + title + "'/></td>";
                }
                allHtml += "<td>" + title + "</td>" + "</tr>";
            }

        });
    }
    if (devices && devices.length > 0) {
        $.each(devices, function (index, title) {
            allHtml += "<tr>";
            allHtml += "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + title + "' checked/></td>";
            allHtml += "<td>" + title + "</td>" + "</tr>";
        });
    }
    allHtml += "</tbody></table>";

    $.confirm({
        title: group
            ? AppMain.t("EDIT_GROUP", "GROUP_TABLE")
            : AppMain.t("ADD_GROUP", "GROUP_TABLE"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            confirm: {
                text: group
                    ? AppMain.t("OK", "global")
                    : AppMain.t("CREATE", "global"),
                action: function () {
                    let groupObj = {};
                    if (group) {
                        groupObj.isEdit = true;
                    }
                    groupObj.groupID = $("input[name='group-id']").val();
                    groupObj.prefix = $("input[name='group-prefix']").val();
                    if (!groupObj.groupID) {
                        CtrlActionGroupTable.importAlert(AppMain.t("ADD_GROUP_ERROR", "GROUP_TABLE"),
                                AppMain.t("GROUP_ID_ERROR", "GROUP_TABLE"));
                        return false;
                    }
                    groupObj.devices = [];
                    let inputC = $("input[name='selectNode']:checked");
                    inputC.each(function (i, elm) {
                        const element = $(elm);
                        groupObj.devices.push(element.attr("data-node-title"));
                    });
                    if (groupObj.devices.length === 0 && groupObj.prefix === "") {
                        CtrlActionGroupTable.importAlert(AppMain.t("ADD_GROUP_ERROR", "GROUP_TABLE"),
                                AppMain.t("DEVICES_SELECT_ERROR", "GROUP_TABLE"));
                        return false;
                    }
                    CtrlActionGroupTable.addGroupRest(groupObj);
                }
            },
            createXML: {
                text: AppMain.t("CREATE_TO_FILE", "global"),
                isHidden: group,
                action: function () {
                    let groupObj = {};
                    if (group) {
                        groupObj.isEdit = true;
                    }
                    groupObj.groupID = $("input[name='group-id']").val();
                    groupObj.prefix = $("input[name='group-prefix']").val();
                    if (!groupObj.groupID) {
                        CtrlActionGroupTable.importAlert(AppMain.t("ADD_GROUP_ERROR", "GROUP_TABLE"),
                                AppMain.t("GROUP_ID_ERROR", "GROUP_TABLE"));
                        return false;
                    }
                    groupObj.devices = [];
                    if (groupObj.prefix === "") {
                        let inputC = $("input[name='selectNode']:checked");
                        inputC.each(function (i, elm) {
                            const element = $(elm);
                            groupObj.devices.push(element.attr("data-node-title"));
                        });
                    }
                    if (groupObj.devices.length === 0 && groupObj.prefix === "") {
                        CtrlActionGroupTable.importAlert(AppMain.t("ADD_GROUP_ERROR", "GROUP_TABLE"),
                                AppMain.t("DEVICES_SELECT_ERROR", "GROUP_TABLE"));
                        return false;
                    }
                    CtrlActionGroupTable.addGroupXML(groupObj);
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
    let prefixPom;
    setTimeout(function () {
        $(".selectNode").on("click", function (e) {
            e.stopPropagation();
        });
        $(".selectAllNodes").on("click", function (e) {
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
        prefixPom = $("input[name='group-prefix']");
        if (prefixPom.val() !== "") {
            $(".dynamic-hide").hide();
        }

        $("#devices-table tr").on("click", function () {
            let input = $(this).find("input[name='selectNode']");
            if (input.length > 0) {
                input[0].click();
            }
        });

        prefixPom.on("input", function () {
            const val = $(this).val();
            if (val !== "") {
                $(".dynamic-hide").hide();
            } else {
                $(".dynamic-hide").show();
            }
        });

        $("#add-icon").on("click", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            CtrlActionGroupTable.addTitlePress({event: e, target: this});
            AppMain.html.updateElements([".mdl-button"]);
            return false;
        });

        const inputElement = document.getElementById("file");
        inputElement.addEventListener("change", function () {
            const uploadElement = this;

            const reader = new FileReader();

            reader.onload = function (e) {

                const csv = e.target.result;
                if (!csv.includes("\r\n") && !csv.includes("\n")) {
                    CtrlActionGroupTable.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "GROUP_TABLE"),
                            AppMain.t("IMPORT_CSV_ERROR", "GROUP_TABLE"));
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
                    CtrlActionGroupTable.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "GROUP_TABLE"),
                            AppMain.t("IMPORT_CSV_ERROR", "GROUP_TABLE"));
                    return;
                }
                header = header.split(",");

                const ind = header.indexOf("\"" + AppMain.t("DEVICE_TITLE", "NODES") + "\"");
                if (ind === -1) {
                    CtrlActionGroupTable.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "GROUP_TABLE"),
                            AppMain.t("IMPORT_ERROR", "GROUP_TABLE"));
                }
                allTextLines.forEach(function (value, index) {
                    if (index >= startInd) {
                        const line = allTextLines[`${index}`];
                        if (line !== "") {
                            CtrlActionGroupTable.addTitle(line.split(",")[`${ind}`]
                                .replace("\"", "").replace("\"", ""));
                        }
                    }
                });

            };
            reader.readAsText(uploadElement.files[0]);
            $("#file").val("");
            $(".select-file").show();
            $("#file-name").html("");
            $(".file-selected").hide();
        }, false);
    }, 300);
};

CtrlActionGroupTable.getRestJson = function (groupObj) {
    "use strict";

    let devicesArr = [];
    $.each(groupObj.devices, function (i, elm) {
        devicesArr.push({
            "_DeviceID": elm
        });
    });
    let obj = {
        "mes:Header": {
            "mes:Verb": groupObj.isEdit
                ? "change"
                : "create",
            "mes:Noun": "DeviceGroup",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Payload": {
            "mes:DeviceGroup": {
                "mes:DeviceGroup": {
                    "_GroupID": groupObj.groupID
                }
            }
        }
    };
    if (!groupObj.isEdit && groupObj.prefix) {
        obj["mes:Payload"]["mes:DeviceGroup"]["mes:DeviceGroup"]._Prefix = groupObj.prefix;
    }

    if (groupObj.isEdit && groupObj.prefix) {
        obj["mes:Payload"]["mes:DeviceGroup"]["mes:DeviceGroup"]._Type = "PREFIX";
        obj["mes:Payload"]["mes:DeviceGroup"]["mes:DeviceGroup"]._Prefix = groupObj.prefix;
    }
    if (groupObj.devices.length > 0) {
        obj["mes:Payload"]["mes:DeviceGroup"]["mes:DeviceGroup"]["mes:DeviceReference"] = devicesArr;
    }
    return obj;
};


CtrlActionGroupTable.addGroupRest = function (groupObj) {
    "use strict";

    let obj = CtrlActionGroupTable.getRestJson(groupObj);

    let response = AppMain.wsMes().exec("RequestMessage", obj).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        if (groupObj.isEdit) {
            AppMain.dialog("GROUP_UPDATED", "success");
        } else {
            AppMain.dialog("GROUP_CREATED", "success");
        }
        this.exec();
    }
    return true;
};

CtrlActionGroupTable.addGroupXML = function (groupObj) {
    "use strict";

    let obj = CtrlActionGroupTable.getRestJson(groupObj);

    let responseXML = AppMain.wsMes().getXML(obj);

    download("data:text/xml;charset=utf-8;base64," + btoa(responseXML), build.device + "_GROUP_" + groupObj.groupID + "_" +
            moment().format("YYYY-MM-DD-HH-mm-ss") + ".xml", "text/xml");
};

CtrlActionGroupTable.export = function () {
    "use strict";

    let csv = "";
    let isNotSelected = true;
    let inputC = $("input:checked");

    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        // csv += '"#",';
        csv += "\"" + AppMain.t("GROUP_ID", "GROUP_TABLE") + "\",";
        csv += "\r\n";

        inputC.each(function (i, elm) {
            const element = $(elm);
            if (element.hasClass("selectGroup")) {
                isNotSelected = false;
                // csv += i + ',';
                csv += element.attr("data-group-id") + ",";
                csv += "\r\n";
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("GROUP_SELECT_ERR", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_GROUPS", "success");

    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_GroupsTable_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
};

CtrlActionGroupTable.arrangeNodeCosemStat = function (nodesCosemStat) {
    "use strict";

    this.nodesTitleObj = {};
    let nodesTitle = [];
    if (nodesCosemStat.length === undefined) {
        nodesCosemStat = [nodesCosemStat];
    }
    $.each(nodesCosemStat, function (index, nodeStat) {
        nodesTitle.push(nodeStat["meter-id"]);
    });
    if (nodesTitle.length > 0) {
        $.each(nodesTitle, function (index, title) {
            CtrlActionGroupTable.nodesTitleObj[`${title}`] = title;
        });
    }
    this.nodesTitle = nodesTitle;
};

CtrlActionGroupTable.addTitlePress = function () {
    "use strict";

    const devTitle = $("#add-title").val();
    if (devTitle !== "") {
        CtrlActionGroupTable.addTitle(devTitle);
    } else {
        CtrlActionGroupTable.importAlert(AppMain.t("ADD_GROUP_ERROR", "GROUP_TABLE"),
                AppMain.t("DEVICE_INSERT_ERROR", "GROUP_TABLE"));
    }
};

CtrlActionGroupTable.addTitle = function (deviceTitle) {
    "use strict";

    //add to table
    let r = Math.random().toString(36).substring(7);
    let devHtml = "<tr id='add-" + r + "'>" +
            "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + deviceTitle + "' checked/></td>" +
            "<td>" + deviceTitle + "</td>" +
            "</tr>";
    let row = $("table#devices-table > tbody > tr:first");
    if (row.length) {
        row.before(devHtml);
    } else {
        $("table#devices-table > tbody").append(devHtml);
    }
    setTimeout(function () {
        $("#add-" + r).fadeIn(200).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200);
    }, 200);
};

/**
 * function is triggered on import icon click
 * opens pop-up to import group from xml
 */

CtrlActionGroupTable.importClick = function () {
    "use strict";

    let allHtml = AppMain.t("FILE_FOR_IMPORT", "GROUP_TABLE");
    allHtml += "<table class='mdl-data-table table-no-borders' style=\"width: 100%\"><tbody>" +
            "<tr>" +
            "<td>" + AppMain.t("FILE", "GROUP_TABLE") + " *<div id=\"fileUploadProgressSpinner\" class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner hidden\"></div></td>" +
            "<td style='text-align: left;'><div class=\"select-file\" style='padding-top: 5px;'><input id=\"sel-file-import\" type=\"file\" name=\"upload\" /></div>" +
            "<div style=\"display: none;\" class=\"file-selected\">" +
            "<span id='file-name-span'></span>" +
            "<i class='material-icons cursor-pointer' id='clear-icon' style='position:relative;top: 7px;'>clear</i>" +
            "</div>" +
            "</td></tr>" +
            "</tbody>" +
            "<tfoot><tr><td></td>" +
            "<td></td>" +
            "</tr></tfoot></table>";

    $.confirm({
        title: AppMain.t("IMPORT_GROUP", "GROUP_TABLE"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("CREATE", "global"),
                action: function () {
                    if (CtrlActionGroupTable.importXML && CtrlActionGroupTable.importXML !== "") {
                        return CtrlActionGroupTable.addResourceXMLRest(CtrlActionGroupTable.importXML);
                    }
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

    setTimeout(function () {

        // tukaj pride koda za file import
        $("#clear-icon").on("click", function () {
            CtrlActionGroupTable.importXML = "";
            $(".select-file").show();
            $("#file-name-span").html();
            $(".file-selected").hide();
        });
        const inputElement = document.getElementById("sel-file-import");
        inputElement.addEventListener("change", function () {

            let reader = new FileReader();
            let file = inputElement.files[0];
            reader.onload = function (event) {
                CtrlActionGroupTable.importXML = event.target.result;
                inputElement.value = "";
                $(".select-file").hide();
                $("#file-name-span").html(file.name);
                $(".file-selected").show();
            };
            reader.readAsText(file);

        }, false);

    }, 250);
};

/**
 * add group from XML rest function
 * @param resourceTXT xml
 * @returns {boolean}
 */
CtrlActionGroupTable.addResourceXMLRest = function (resourceTXT) {
    "use strict";

    let response = AppMain.wsMes().exec("RequestMessage", resourceTXT).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        CtrlActionGroupTable.exec();
        AppMain.dialog("GROUP_CREATED", "success", [response.ResponseMessage.Reply.ID.toString()]);
    }
    return true;
};

CtrlActionGroupTable.importAlert = function (title, content) {
    "use strict";

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
    $("#file").val("");
    $(".select-file").show();
    $("#file-name").html("");
    $(".file-selected").hide();
};

CtrlActionGroupTable.setParams = function () {
    "use strict";

    const value = $("#data-dest").val();
    const resp = AppMain.ws().exec("SetParameters", {
        "cntr": {
            "dc-push-destination-url": value
        }
    }).getResponse(false);

    if (resp.SetParametersResponse && resp.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else {
        AppMain.dialog("Error occurred: " + resp.SetParametersResponse.toString(), "error");
    }
};

CtrlActionGroupTable.init = function () {
    "use strict";

    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

CtrlActionGroupTable.onBeforeExecute = function () {
    "use strict";
    $(".main-canvas").removeClass("main-canvas-attached-devices");
};

module.exports.CtrlActionGroupTable = CtrlActionGroupTable;
