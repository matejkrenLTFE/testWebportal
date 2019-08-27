/**
 * @class CtrlActionTaskManager Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined, dmp, vkbeautify, FileReader, XMLSerializer */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionTaskManager = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");
const objectList = require("./includes/jobObjects");

/**
 * main controller execution function e.g. onLoad()
 */
CtrlActionTaskManager.exec = function () {
    "use strict";

    this.view.setTitle("TASK_MANAGER");

    let resourceList = AppMain.wsMes().exec("RequestMessage", {
        "mes:Header": {
            "mes:Verb": "get",
            "mes:Noun": "ResourceDirectory",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Request": {
            "mes:WithData": true
        }
    }).getResponse(false);

    const nodesCosemStat = AppMain.wsMes().exec("CosemDeviceStatisticRequest", "").getResponse(false);
    if (nodesCosemStat && nodesCosemStat.GetCosemDeviceStatisticResponse &&
            nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"]) {
        this.arrangeNodeCosemStat(nodesCosemStat.GetCosemDeviceStatisticResponse["cosem-device-statistics"]);
    }
    this.groups = this.getGroups();

    let listHtml = this.buildNodeListHTML(resourceList);

    this.view.render(this.controller.action, {
        title: AppMain.t("TITLE", "TASK_MANAGER"),
        elements: {},
        htmlResources: listHtml,
        tooltipsHtml: this.htmlTooltips,
        labels: {
            "id": AppMain.t("ID", "TASK_MANAGER"),
            "type": AppMain.t("TYPE", "TASK_MANAGER"),
            "priority": AppMain.t("PRIORITY", "TASK_MANAGER"),
            "service": AppMain.t("SERVICE", "TASK_MANAGER"),
            "object": AppMain.t("OBJECT", "TASK_MANAGER"),
            "expires": AppMain.t("EXPIRES", "TASK_MANAGER"),
            "NOT_OLDER_THAN": AppMain.t("NOT_OLDER_THAN", "TASK_MANAGER"),
            "REPLY_ADDRESS": AppMain.t("REPLY_ADDRESS", "TASK_MANAGER"),
            "ACCEPT_DATA_NOTIFICATION": AppMain.t("ACCEPT_DATA_NOTIFICATION_SHORT", "TASK_MANAGER"),
            "START_TIME": AppMain.t("START_TIME", "TASK_MANAGER"),
            "REPEATING_INTERVAL": AppMain.t("REPEATING_INTERVAL", "TASK_MANAGER"),
            "RESOURCE_STATUS": AppMain.t("RESOURCE_STATUS", "TASK_MANAGER"),
            "LAST_ACTIVATION": AppMain.t("LAST_ACTIVATION", "TASK_MANAGER"),
            "DEVICE_REFERENCE": AppMain.t("DEVICE_REFERENCE", "TASK_MANAGER"),
            addResourceTxt: AppMain.t("ADD_RESOURCE", "TASK_MANAGER"),
            filter: AppMain.t("FILTER", "global"),
            btnRefresh: AppMain.t("REFRESH_LIST", "global"),
            btnExport: AppMain.t("EXPORT", "global"),
            btnImport: AppMain.t("IMPORT_FROM_FILE", "TASK_MANAGER")
        }
    });
    //Fix attached devices table width
    $(".main-canvas").addClass("main-canvas-attached-devices");

    const tableOptions = {
        valueNames: ["ID", "Activates", "Type", "Expires", "RepeatingInterval", "NotOlderThan", "Priority", "ResourceStatus",
                "LastActivation", "ReplyAddress", "DeviceReference", "Object", "Service"]
    };
    this.initTable("resourceList", "resourceList", tableOptions);
    this.initSelectAllForJob("selectAllNodes");
};

/**
 * helper function for checking if notification job exists
 */
CtrlActionTaskManager.hasNotificationJob = function () {
    "use strict";

    let hasNotify = false;
    $.each(this.resourceList, function (index, node) {
        if (defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION") {
            hasNotify = true;
        }
    });
    return hasNotify;
};

/**
 * helper function for building table html
 */
CtrlActionTaskManager.buildNodeListHTML = function (resourceList) {
    "use strict";

    let listHtml = "";
    this.htmlTooltips = "";
    if (resourceList && resourceList.ResponseMessage && resourceList.ResponseMessage.Reply && resourceList.ResponseMessage.Reply.Result
            && resourceList.ResponseMessage.Reply.Result.toString() === "OK") {
        if (defined(resourceList.ResponseMessage.Payload.ResourceDirectory)) {
            this.resourceList = resourceList.ResponseMessage.Payload.ResourceDirectory.Resource;
            if (this.resourceList.length === undefined) {
                this.resourceList = [this.resourceList];
            }
        } else {
            this.resourceList = [];
        }
    }

    $.each(this.resourceList, function (index, node) {
        const isUpgrade = defined(node.ResourceType) && node.ResourceType.toString() === "UPGRADE";
        const isNotification = defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION";
        const isScheduled = !isUpgrade && !isNotification && ((defined(node.Activates) && node.Activates !== "") ||
                (defined(node.RepeatingInterval) && node.RepeatingInterval !== "") || (defined(node.Duration) && node.Duration !== ""));

        const isOndemand = !isScheduled && !isNotification && !isUpgrade;

        listHtml += "<tr>";
        let typeTxt = "";
        if (isScheduled) {
            typeTxt = AppMain.t("SCHEDULED", "TASK_MANAGER");
        } else {
            if (isOndemand) {
                typeTxt = AppMain.t("ON_DEMAND", "TASK_MANAGER");
            } else {
                if (isNotification) {
                    typeTxt = AppMain.t("NOTIFICATION", "TASK_MANAGER");
                }
                if (isUpgrade) {
                    typeTxt = AppMain.t("UPGRADE_TXT", "TASK_MANAGER");
                }
            }
        }

        let deviceTXT = "";
        let deviceTXTshort = "";
        if (defined(node.DeviceReference)) {
            if (node.DeviceReference.length > 0) {
                if (node.DeviceReference.length === 1) {
                    deviceTXT = node.DeviceReference[0]._DeviceID;
                    deviceTXTshort = deviceTXT;
                } else {
                    deviceTXT = "";
                    $.each(node.DeviceReference, function (index, node) {
                        if (index !== 0) {
                            deviceTXT += "; ";
                        }
                        deviceTXT += node._DeviceID;
                    });
                    deviceTXTshort = node.DeviceReference[0]._DeviceID + " ...";
                }
            } else {
                deviceTXT = defined(node.DeviceReference._DeviceID)
                    ? node.DeviceReference._DeviceID
                    : "---";
                deviceTXTshort = deviceTXT;
            }
        } else {
            if (defined(node.GroupReference)) {
                if (node.GroupReference.length > 0) {
                    if (node.GroupReference.length === 1) {
                        deviceTXT = node.GroupReference[0]._GroupID;
                        deviceTXTshort = deviceTXT;
                    } else {
                        deviceTXT = "";
                        $.each(node.GroupReference, function (index, node) {
                            if (index !== 0) {
                                deviceTXT += "; ";
                            }
                            deviceTXT += node._GroupID;
                        });
                        deviceTXTshort = node.GroupReference[0]._GroupID + " ...";
                    }
                } else {
                    deviceTXT = defined(node.GroupReference._GroupID)
                        ? node.GroupReference._GroupID
                        : "---";
                    deviceTXTshort = deviceTXT;
                }
            } else {
                if (isNotification) {
                    deviceTXT = "DG_ALL_METERS";
                    deviceTXTshort = deviceTXT;
                }
            }
        }

        let cosemTXT = "";
        let cosemTXTshort = "";
        if (defined(node.CosemAttributeDescriptor)) {
            if (node.CosemAttributeDescriptor.length === undefined) {
                node.CosemAttributeDescriptor = [node.CosemAttributeDescriptor];
            }
            cosemTXTshort = CtrlActionTaskManager.transformObject(node.CosemAttributeDescriptor[0]["class-id"],
                    node.CosemAttributeDescriptor[0]["instance-id"], node.CosemAttributeDescriptor[0]["attribute-id"]);
            if (node.CosemAttributeDescriptor.length > 1) {
                cosemTXTshort += " ..."; // change
            }
            $.each(node.CosemAttributeDescriptor, function (index, cosem) {
                if (index !== 0) {
                    cosemTXT += "; ";
                }
                cosemTXT += CtrlActionTaskManager.transformObject(cosem["class-id"], cosem["instance-id"], cosem["attribute-id"]);
            });
        } else {
            cosemTXT = "---";
            cosemTXTshort = "---";
        }
        const serviceTXT = defined(node.ResourceType)
            ? AppMain.t(node.ResourceType, "TASK_MANAGER")
            : "";
        const activatesTXT = defined(node.Activates)
            ? moment(node.Activates.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
        const expiresTXT = defined(node.Expires)
            ? moment(node.Expires.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
        let repeatTxt = "";
        if (defined(node.RepeatingInterval)) {
            switch (node.RepeatingInterval.toString()) {
            case "P1D":
                repeatTxt = AppMain.t("DAILY", "TASK_MANAGER");
                break;
            case "P7D":
                repeatTxt = AppMain.t("WEEKLY", "TASK_MANAGER");
                break;
            case "P1M":
                repeatTxt = AppMain.t("MONTHLY", "TASK_MANAGER");
                break;
            case "P1Y":
                repeatTxt = AppMain.t("YEARLY", "TASK_MANAGER");
                break;
            case "PT1M":
                repeatTxt = AppMain.t("PT1M", "TASK_MANAGER");
                break;
            }
            if (repeatTxt === "") {
                const repeat = moment.duration(node.RepeatingInterval);
                repeatTxt = repeat.asMinutes() + " " + AppMain.t("MINUTES", "global");
            }
        } else {
            repeatTxt = "---";
        }
        const olderTXT = defined(node.NotOlderThan)
            ? moment(node.NotOlderThan.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
        const priorityTXT = defined(node.Priority)
            ? node.Priority.toString()
            : "---";
        const statusTXT = defined(node.ResourceStatus)
            ? AppMain.t(node.ResourceStatus.toString().replace(/-/g, "_"), "TASK_MANAGER")
            : "---";
        const activationTXT = defined(node.LastActivation)
            ? moment(node.LastActivation.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
        const replyTXT = defined(node.ReplyAddress)
            ? node.ReplyAddress.toString()
            : "---";
        let durTXT = "---";
        if (defined(node.Duration)) {
            durTXT = moment.duration(node.Duration).asMinutes() + " " + AppMain.t("MINUTES", "global");
        }
        let notification = defined(node.AsyncReplyFlag);

        const clickHTML = " data-bind-event='click' data-node-id='" + node.ID.toString() + "' data-bind-method='CtrlActionTaskManager.getReferenceDevice' ";

        listHtml += "<td class='checkbox-col'><input type='checkbox' name='selectJob' class='selectJob' data-node-ID='" + node.ID.toString() + "' " +
                "data-node-type='" + typeTxt + "' " +
                "data-node-device='" + deviceTXT + "' " +
                "data-node-service='" + serviceTXT + "' " +
                "data-node-activates='" + activatesTXT + "' " +
                "data-node-expires='" + expiresTXT + "' " +
                "data-node-repeat='" + repeatTxt + "' " +
                "data-node-older='" + olderTXT + "' " +
                "data-node-priority='" + priorityTXT + "' " +
                "data-node-status='" + statusTXT + "' " +
                "data-node-activation='" + activationTXT + "' " +
                "data-node-notification='" + (notification.toString()) + "' " +
                "data-node-reply='" + replyTXT + "' " +
                "data-node-cosem='" + cosemTXT + "' " +
                "data-node-duration='" + durTXT + "' " +
                "></td>";
        listHtml += "<td class='ID'" + clickHTML + ">" + node.ID.toString() + "</td>";
        listHtml += "<td class='Type'" + clickHTML + ">" + typeTxt + "</td>";
        listHtml += "<td class='DeviceReference'" + clickHTML + ">" + deviceTXTshort + "</td>";
        listHtml += "<td class='Service'" + clickHTML + ">" + serviceTXT + "</td>";
        listHtml += "<td class='Object'" + clickHTML + ">" + cosemTXTshort + "</td>";
        listHtml += "<td class='Activates'" + clickHTML + ">" + activatesTXT + "</td>";
        listHtml += "<td class='Expires'" + clickHTML + ">" + expiresTXT + "</td>";
        listHtml += "<td class='RepeatingInterval'" + clickHTML + ">" + repeatTxt + "</td>";
        listHtml += "<td class='Priority'" + clickHTML + ">" + priorityTXT + "</td>";
        listHtml += "<td" + clickHTML + "><span class='mdl-chip " + node.ResourceStatus.toString() + "'><span class='mdl-chip__text ResourceStatus'>"
                + statusTXT + "</span></span></td>";

        if (defined(node.AsyncReplyFlag) && node.AsyncReplyFlag.toString() === "true") {
            listHtml += "<td" + clickHTML + "><input type='checkbox' checked disabled/></td>";
        } else {
            listHtml += "<td" + clickHTML + "><input type='checkbox' disabled/></td>";
        }

        listHtml += "<td>";
        if (node.ResourceStatus.toString() !== "FINISHED" && !isUpgrade) {
            listHtml += "<i id='edit_" + node.ID.toString() + "' data-rbac='taskManager.edit' class=\"material-icons cursor-pointer\"" +
                    " data-bind-event=\"click\" data-bind-method=\"CtrlActionTaskManager.editResource\" data-node-id='" + node.ID.toString() +
                    "'>edit</i>";
        }

        listHtml += "<span id='get_" + node.ID.toString() + "' data-rbac=\"nodes.kickoff\" class=\"get-data-icon cursor-pointer\" " +
                "data-bind-event=\"click\" data-bind-method=\"CtrlActionTaskManager.getDataPopUp\" data-node-id='" + node.ID.toString() + "'></span>";

        listHtml += "<i id='delete_" + node.ID.toString() + "' data-rbac=\"taskManager.delete\" class=\"material-icons cursor-pointer\" " +
                "data-bind-event=\"click\" data-bind-method=\"CtrlActionTaskManager.deleteResource\" data-node-id='" + node.ID.toString() +
                "'>clear</i>";

        CtrlActionTaskManager.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"get_" + node.ID.toString() + "\">" +
                AppMain.t("GET_JOB_DATA", "TASK_MANAGER") + "</div>";

        listHtml += "</td>";

        CtrlActionTaskManager.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"delete_" + node.ID.toString() + "\">" +
                AppMain.t("DELETE", "global") + "</div>";
        CtrlActionTaskManager.htmlTooltips += "<div class=\"mdl-tooltip\" data-mdl-for=\"edit_" + node.ID.toString() + "\">" +
                AppMain.t("EDIT", "global") + "</div>";

        listHtml += "</tr>";
    });

    return listHtml;
};
/**
 * helper function to display instanceId
 */
CtrlActionTaskManager.transformInstanceId = function (instance) {
    "use strict";

    if (instance.length === 12) {
        let rez = "";
        while (instance.length) {
            const nmb = parseInt(instance.substr(0, 2), 16);
            if (instance.length === 2) {
                rez += nmb;
            } else {
                rez += nmb + ".";
            }
            instance = instance.substr(2);
        }
        return rez;
    } else {
        return instance;
    }
};

/**
 * helper function to display object
 */
CtrlActionTaskManager.transformObject = function (classId, instance, attrId) {
    "use strict";

    return "(" + classId.toString() + ") " +
            CtrlActionTaskManager.transformInstanceId(instance.toString()) + " ("
            + attrId.toString() + ")";
};

/**
 * function to export jobs
 */
CtrlActionTaskManager.export = function () {
    "use strict";

    let csv = "";
    let isNotSelected = true;
    let inputC = $("input:checked");

    if (inputC.length > 0) {
        csv = "SEP=,\r\n";
        csv += "\"" + AppMain.t("ID", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("TYPE", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("DEVICE_REFERENCE", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("SERVICE", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("OBJECT", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("START_TIME", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("EXPIRES", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("REPEATING_INTERVAL", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("NOT_OLDER_THAN", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("PRIORITY", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("RESOURCE_STATUS", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("LAST_ACTIVATION", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("ACCEPT_DATA_NOTIFICATION_SHORT", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("REPLY_ADDRESS", "TASK_MANAGER") + "\",";
        csv += "\"" + AppMain.t("DURATION", "TASK_MANAGER") + "\"";
        csv += "\r\n";

        inputC.each(function (i, elm) {
            const element = $(elm);
            if (element.hasClass("selectJob")) {
                isNotSelected = false;
                csv += element.attr("data-node-ID") + ",";
                csv += element.attr("data-node-type") + ",";
                csv += element.attr("data-node-device") + ",";
                csv += element.attr("data-node-service") + ",";
                csv += element.attr("data-node-cosem") + ",";
                csv += element.attr("data-node-activates") + ",";
                csv += element.attr("data-node-expires") + ",";
                csv += element.attr("data-node-repeat") + ",";
                csv += element.attr("data-node-older") + ",";
                csv += element.attr("data-node-priority") + ",";
                csv += element.attr("data-node-status") + ",";
                csv += element.attr("data-node-activation") + ",";
                csv += element.attr("data-node-notification") + ",";
                csv += element.attr("data-node-reply") + ",";
                csv += element.attr("data-node-duration") + "";
                csv += "\r\n";
            }
        });
    }

    if (isNotSelected) {
        AppMain.dialog("JOBS_SELECT_ERR", "default");
        return;
    }
    AppMain.dialog("CSV_CREATED_JOS", "success");

    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_JobsTable_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
};

/**
 * function to display job details
 */
CtrlActionTaskManager.getReferenceDevice = function (e) {
    "use strict";

    let $this = $(e.target);
    let $thisParent = $(e.target).parent();
    const nLsD = $("table tr.nodeListShowDetails");
    if ($thisParent.attr("data-opened") === "1") {
        $thisParent.attr("data-opened", 0);
        nLsD.remove();
        return;
    }
    $("table tr td[data-opened]").attr("data-opened", "0");
    nLsD.remove();

    let nodeID = $this.attr("data-node-id");

    $.each(this.resourceList, function (index, node) {
        if (node.ID.toString() === nodeID) {
            $thisParent.attr("data-opened", 1);
            let html = "<tr class='nodeListShowDetails'>";
            html += "<td colspan='3'>" + AppMain.t("NOT_OLDER_THAN", "TASK_MANAGER") + "</td>";
            html += "<td colspan='2' style='text-align: left'>" + (defined(node.NotOlderThan)
                ? moment(node.NotOlderThan.toString()).format(AppMain.localization("DATETIME_FORMAT"))
                : "---") + "</td>";
            html += "<td colspan='2'>" + AppMain.t("LAST_ACTIVATION", "TASK_MANAGER") + "</td>";
            html += "<td colspan='6' style='text-align: left'>" + (defined(node.LastActivation)
                ? moment(node.LastActivation.toString()).format(AppMain.localization("DATETIME_FORMAT"))
                : "---") + "</td>";
            html += "</tr>";
            html += "<tr class='nodeListShowDetails'>";
            html += "<td colspan='3'>" + AppMain.t("DURATION", "TASK_MANAGER") + "</td>";
            let dur = "---";
            if (defined(node.Duration)) {
                dur = moment.duration(node.Duration).asMinutes() + AppMain.t("MINUTES", "global");
            }
            html += "<td colspan='2' style='text-align: left'>" + dur + "</td>";
            html += "<td colspan='2'>" + AppMain.t("REPLY_ADDRESS", "TASK_MANAGER") + "</td>";
            html += "<td colspan='6' style='text-align: left'>" + (defined(node.ReplyAddress)
                ? node.ReplyAddress.toString()
                : "---") + "</td>";
            html += "<tr class='nodeListShowDetails'>";
            html += "<td colspan='3'>" + AppMain.t("DEVICE_REFERENCE", "TASK_MANAGER") + "</td>";
            let devTXT = "";
            let isMore = false;
            let dType = "";
            if (defined(node.DeviceReference)) {
                if (node.DeviceReference.length === undefined) {
                    node.DeviceReference = [node.DeviceReference];
                }
                devTXT += node.DeviceReference[0]._DeviceID;
                if (node.DeviceReference.length > 1) {
                    devTXT += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
                    isMore = true;
                    dType = "devices";
                }
            } else {
                if (defined(node.GroupReference)) {
                    if (node.GroupReference.length === undefined) {
                        node.GroupReference = [node.GroupReference];
                    }
                    devTXT += node.GroupReference[0]._GroupID;
                    if (node.GroupReference.length > 1) {
                        devTXT += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
                        isMore = true;
                        dType = "group";
                    }
                } else {
                    if (defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION") {
                        devTXT = "DG_ALL_METERS";
                        isMore = false;
                    }
                }
            }
            if (isMore) {
                html += "<td colspan='2' data-node-id='" + nodeID + "' data-bind-method='CtrlActionTaskManager.cosemAttributeDescriptor' " +
                        "data-bind-event='click' data-more-type='" + dType + "' class='cursor-pointer' style='text-align: left'>" + devTXT;
                html += "</td>";
            } else {
                html += "<td colspan='2' style='text-align: left'>" + devTXT;
                html += "</td>";
            }
            html += "<td colspan='2'>" + AppMain.t("OBJECT", "TASK_MANAGER") + "</td>";
            let cosemTXT = "";
            if (defined(node.CosemAttributeDescriptor)) {
                if (node.CosemAttributeDescriptor.length === undefined) {
                    node.CosemAttributeDescriptor = [node.CosemAttributeDescriptor];
                }
                cosemTXT += CtrlActionTaskManager.transformObject(node.CosemAttributeDescriptor[0]["class-id"], node.CosemAttributeDescriptor[0]["instance-id"],
                        node.CosemAttributeDescriptor[0]["attribute-id"]);
                if (node.CosemAttributeDescriptor.length > 1) {
                    cosemTXT += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
                }
            } else {
                cosemTXT = "---";
            }
            if (node.CosemAttributeDescriptor && node.CosemAttributeDescriptor.length > 1) {
                html += "<td class='cursor-pointer' data-node-id='" + nodeID + "' data-bind-method='CtrlActionTaskManager.cosemAttributeDescriptor' " +
                        "data-bind-event='click' data-more-type='cosem' colspan='7' style='text-align: left;' >" + cosemTXT + "</td> </tr>";
            } else {
                html += "<td colspan='6' style='text-align: left;' >" + cosemTXT + "</td> </tr>";
            }
            $thisParent.after(html);
            return false;
        }
    });

    CtrlActionTaskManager.view.rebindElementEvents();
};

/**
 * function to display job cosem/device/group details
 */
CtrlActionTaskManager.cosemAttributeDescriptor = function (e) {
    "use strict";

    let $this = $(e.target);
    const nodeID = $this.attr("data-node-id");
    const type = $this.attr("data-more-type");

    let tableHTML = "";
    let title = "";
    $.each(this.resourceList, function (index, node) {
        if (node.ID.toString() === nodeID) {
            switch (type) {
            case "cosem":
                title = AppMain.t("JOB_OBJECTS", "TASK_MANAGER").toString();
                $.each(node.CosemAttributeDescriptor, function (index, cosem) {
                    if (index === 0) {
                        tableHTML += "<tr>";
                    } else {
                        if (index % 3 === 0) {
                            tableHTML += "</tr><tr>";
                        }
                    }
                    tableHTML += "<td>" + CtrlActionTaskManager.transformObject(cosem["class-id"], cosem["instance-id"], cosem["attribute-id"]) + "</td>";
                });
                if (node.CosemAttributeDescriptor && node.CosemAttributeDescriptor.length % 3 === 1) {
                    tableHTML += "<td></td><td></td></tr>";
                }
                if (node.CosemAttributeDescriptor && node.CosemAttributeDescriptor.length % 3 === 2) {
                    tableHTML += "<td></td></tr>";
                }
                break;
            case "devices":
                title = AppMain.t("JOB_DEVICE_REFERENCES", "TASK_MANAGER").toString();
                $.each(node.DeviceReference, function (index, node) {
                    if (index === 0) {
                        tableHTML += "<tr>";
                    } else {
                        if (index % 3 === 0) {
                            tableHTML += "</tr><tr>";
                        }
                    }
                    tableHTML += "<td>" + node._DeviceID + "</td>";
                });
                if (node.DeviceReference.length % 3 === 1) {
                    tableHTML += "<td></td><td></td></tr>";
                }
                if (node.DeviceReference.length % 3 === 2) {
                    tableHTML += "<td></td></tr>";
                }
                break;
            case "group":
                title = AppMain.t("JOB_GROUP_REFERENCES", "TASK_MANAGER").toString();
                $.each(node.GroupReference, function (index, node) {
                    if (index === 0) {
                        tableHTML += "<tr>";
                    } else {
                        if (index % 3 === 0) {
                            tableHTML += "</tr><tr>";
                        }
                    }
                    tableHTML += "<td>" + node._GroupID + "</td>";
                });
                if (node.GroupReference.length % 3 === 1) {
                    tableHTML += "<td></td><td></td></tr>";
                }
                if (node.GroupReference.length % 3 === 2) {
                    tableHTML += "<td></td></tr>";
                }
                break;
            }
        }
    });

    let allHtml = "<table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            "<thead class=\"th-color-grey text-align-left\"><tbody>";
    allHtml += tableHTML;
    allHtml += "</tbody></table>";


    $.confirm({
        title: title,
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

/**
 * function to delete job
 */
CtrlActionTaskManager.deleteResource = function (e) {
    "use strict";

    const $this = $(e.target);
    let nodeID = $this.attr("data-node-id");

    $.each(this.resourceList, function (index, node) {
        if (node.ID.toString() === nodeID) {
            $.confirm({
                title: AppMain.t("DELETE_RESOURCE", "TASK_MANAGER"),
                content: AppMain.t("DELETE_RESOURCE_DESC", "TASK_MANAGER", [nodeID]),
                useBootstrap: false,
                theme: "material",
                buttons: {
                    confirm: {
                        text: AppMain.t("OK", "global"),
                        action: function () {
                            return CtrlActionTaskManager.deleteResourceRest(nodeID);
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

/**
 * function to edit job
 */
CtrlActionTaskManager.editResource = function (e) {
    "use strict";

    const $this = $(e.target);
    let nodeID = $this.attr("data-node-id");

    $.each(this.resourceList, function (index, node) {
        if (node.ID.toString() === nodeID) {
            CtrlActionTaskManager.addJobSecond(undefined, node);
            return false;
        }
    });
};

/**
 * function for delete job request
 */
CtrlActionTaskManager.deleteResourceRest = function (resourceID) {
    "use strict";

    let response = AppMain.wsMes().exec("RequestMessage", {
        "mes:Header": {
            "mes:Verb": "delete",
            "mes:Noun": "DeviceAccess",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Request": {
            "mes:ID": resourceID
        }
    }).getResponse(false);

    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        setTimeout(function () {
            CtrlActionTaskManager.exec();
        }, 500);
        AppMain.dialog("JOB_REMOVED", "success");
        return true;
    }
    AppMain.dialog("JOB_REMOVED_ERROR", "success");
    return false;
};

/**
 * helper function getting top html in add job wizard
 */
CtrlActionTaskManager.addJobStepsHtml = function (position, jobType) {
    "use strict";

    let html =
            "<div class='mdl-slider-wizard'>" +
            "<hr class='wizard-line'/>" +
            "</div>" +
            "<div class='mdl-grid wizard-chips'>" +
            "<div class='mdl-card mdl-cell--1-col'></div>";

    if (jobType === "notification") {
        if (position === 1) {
            html += "<div class='mdl-card mdl-cell--5-col active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--5-col'>";
        }
        html += "<span class=\"mdl-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("JOB_TYPE", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        if (position === 2) {
            html += "<div class='mdl-card mdl-cell--5-col active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--5-col'>";
        }
        html += "<span class=\"mdl-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("JOB_PARAMETERS", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        return html;
    }
    if (position === 1) {
        html += "<div class='mdl-card mdl-cell--2-col active'>";
    } else {
        html += "<div class='mdl-card mdl-cell--2-col'>";
    }

    html += "<span class=\"mdl-chip\">" +
            "<span class=\"mdl-chip__text\">" + AppMain.t("JOB_TYPE", "TASK_MANAGER") + "</span>" +
            "</span></div>";
    if (position === 2) {
        html += "<div class='mdl-card mdl-cell--3-col active'>";
    } else {
        html += "<div class='mdl-card mdl-cell--3-col'>";
    }

    html += "<span class=\"mdl-chip\">" +
            "<span class=\"mdl-chip__text\">" + AppMain.t("JOB_PARAMETERS", "TASK_MANAGER") + "</span>" +
            "</span></div>";

    if (position === 3) {
        html += "<div class='mdl-card mdl-cell--3-col active'>";
    } else {
        html += "<div class='mdl-card mdl-cell--3-col'>";
    }

    html += "<span class=\"mdl-chip\">" +
            "<span class=\"mdl-chip__text\">" + AppMain.t("REFERENCE_TYPE", "TASK_MANAGER") + "</span>" +
            "</span></div>";
    if (position === 4) {
        html += "<div class='mdl-card mdl-cell--2-col active'>";
    } else {
        html += "<div class='mdl-card mdl-cell--2-col'>";
    }

    html += "<span class=\"mdl-chip\">" +
            "<span class=\"mdl-chip__text\">" + AppMain.t("REFERENCE", "TASK_MANAGER") + "</span>" +
            "</span></div>";

    if (position === 5) {
        html += "<div class='mdl-card mdl-cell--2-col cosem active'>";
    } else {
        html += "<div class='mdl-card mdl-cell--2-col cosem'>";
    }

    html += "<span class=\"mdl-chip cosem-chip\">" +
            "<span class=\"mdl-chip__text\">" + AppMain.t("COSEM", "TASK_MANAGER") + "</span>" +
            "</span></div>";

    html += "" + "</div>";

    return html;
};

/**
 * function for pop up add job: first step
 */
CtrlActionTaskManager.addJobFirstStep = function () {
    "use strict";

    const onDemand = "<tr>\n    " +
            "<td class=\"mdl-data-table__cell--non-numeric\" style='width: 30px'>\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='on-demand' id=\"on-demand\" name=\"job-type\" class=\"mdl-radio__button\" checked>\n        " +
            "</label>\n    " +
            "</td>\n    " +
            "<td>\n    " +
            AppMain.t("ON_DEMAND_JOB", "TASK_MANAGER") +
            "</td>" +
            // "<td rowspan='3' style='background-color: #fff!important;'><span id='service-txt'>" + serviceSelector + "</span></td>" +
            "</tr>";
    const scheduled = "<tr>\n    " +
            "<td class=\"mdl-data-table__cell--non-numeric\" style='width: 30px'>\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='scheduled' id=\"scheduled\" name=\"job-type\" class=\"mdl-radio__button\">\n        " +
            "</label>\n    " +
            "</td>\n    " +
            "<td>\n    " +
            AppMain.t("SCHEDULED_JOB", "TASK_MANAGER") +
            "</td>" +
            "</tr>";

    const notification = "<tr>\n    " +
            "<td class=\"mdl-data-table__cell--non-numeric\" style='width: 30px'>\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='notification' id=\"notification\" name=\"job-type\" class=\"mdl-radio__button\">\n        " +
            "</label>\n    " +
            "</td>\n    " +
            "<td>\n    " +
            AppMain.t("NOTIFICATION_JOB", "TASK_MANAGER") +
            "</td>" +
            "</tr>";

    const upgrade = "<tr>\n    " +
            "<td class=\"mdl-data-table__cell--non-numeric\" style='width: 30px'>\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='upgrade' id=\"upgrade\" name=\"job-type\" class=\"mdl-radio__button\">\n        " +
            "</label>\n    " +
            "</td>\n    " +
            "<td>\n    " +
            AppMain.t("FIRMWARE_UPGRADE", "TASK_MANAGER") +
            "</td>" +
            "</tr>";

    let allHtml = "<span id='headerWizRow'>" + this.addJobStepsHtml(1, undefined) + "</span>" +
            AppMain.t("SELECT_JOB_TYPE", "TASK_MANAGER") + "</br>" +
            "<table id='job-type-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            onDemand +
            scheduled +
            notification +
            upgrade +
            "</table>";

    $.confirm({
        title: AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        theme: "material",
        draggable: false,
        buttons: {
            confirm: {
                text: AppMain.t("NEXT", "global"),
                btnClass: "btn-default nextBtn",
                action: function () {
                    const jobType = $("input[type='radio']:checked").val();
                    if (jobType === "upgrade") {
                        CtrlActionTaskManager.addJobFileUpload(jobType);
                    } else {
                        CtrlActionTaskManager.addJobSecond(jobType);
                    }
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
        AppMain.html.updateElements([".mdl-select", ".mdl-slider"]);
        $("#job-type-table tr").on("click", function () {
            let input = $(this).find("input[name='job-type']");
            if (input.length > 0) {
                input[0].click();
            }
        });

        $("input[name='job-type']").on("click", function () {
            const value = $("input[type='radio']:checked").val();
            $("#headerWizRow").html(CtrlActionTaskManager.addJobStepsHtml(1, value));
            if (value === "notification" && CtrlActionTaskManager.hasNotificationJob() && !CtrlActionTaskManager.hasNotify) {
                $(".nextBtn").addClass("is-disabled");
                CtrlActionTaskManager.hasNotify = true;
                CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_NOTIFICATION_ERR_TITLE", "TASK_MANAGER"),
                        AppMain.t("NOTIFICATION_EXISTS_ERR", "TASK_MANAGER"));
            } else {
                CtrlActionTaskManager.hasNotify = false;
                $(".nextBtn").removeClass("is-disabled");
            }
        });

    }, 200);
};

/**
 * function for pop up add job: upload file
 */
CtrlActionTaskManager.addJobFileUpload = function (jobType, node) {
    "use strict";

    let jobObj = {};

    const startHtml = "<tr> <td>" + AppMain.t("START_TIME", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-js-textfield-datepicker textfield-short-175\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"dateStart\"></div>" +
            "</td></tr>";

    const imgHtml = "<tr> <td>" + AppMain.t("IMAGE_IDENTIFIER", "TASK_MANAGER") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield\" style='width: 400px;'>" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"imgIdent\"></div>" +
            "</td></tr>";


    let allHtml = this.addJobStepsHtml(2, jobType) + AppMain.t("FILE_FOR_UPGRADE", "TASK_MANAGER");
    allHtml += "<table class='mdl-data-table table-no-borders' style=\"width: 100%\"><tbody>" +
            "<tr>" +
            "<td>" + AppMain.t("FILE", "TASK_MANAGER") + " *<div id=\"fileUploadProgressSpinner\" class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner hidden\"></div></td>" +
            "<td style='text-align: left;'><div class=\"select-file\" style='padding-top: 5px;'><input id=\"sel-file\" type=\"file\" name=\"upload\" /></div>" +
            "<div style=\"display: none;\" class=\"file-selected\">" +
            "<span id='file-name-span'></span>" +
            "<i class='material-icons cursor-pointer' id='clear-icon' style='position:relative;top: 7px;'>clear</i>" +
            "</div>" +
            "</td></tr>" +
            imgHtml + startHtml +
            "</tbody>" +
            "<tfoot><tr><td></td>" +
            "<td></td>" +
            "</tr></tfoot></table>";

    $.confirm({
        title: AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            back: {
                text: AppMain.t("BACK", "global"),
                action: function () {
                    CtrlActionTaskManager.addJobFirstStep();
                    return true;
                }
            },
            confirm: {
                text: AppMain.t("NEXT", "global"),
                action: function () {
                    jobObj.jobType = jobType;
                    jobObj.jobService = "upgrade";
                    const startTime = $("#dateStart").val();
                    jobObj.imageIdentifier = $("#imgIdent").val();
                    jobObj.Activates = startTime !== ""
                        ? moment(startTime).toISOString()
                        : "";
                    if (jobObj.imageIdentifier === "") {
                        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("IMAGE_IDENTIFIER_ERROR_TXT", "TASK_MANAGER"));
                        return false;
                    }

                    if (jobObj.fileName && jobObj.fileName !== "") {
                        CtrlActionTaskManager.addJobThirdStep(jobObj);
                    } else {
                        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("ADD_JOB_UPLOAD_FILE_ERR_TXT", "TASK_MANAGER"));
                        return false;
                    }
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

        const dateStart = $("#dateStart");
        dateStart.datetimepicker({
            dayOfWeekStart: 1,
            lang: "sl",
            startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
            format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
        });

        if (node) { // from back
            $(".select-file").hide();
            $("#file-name-span").html(node.fileName);
            $(".file-selected").show();
            jobObj.fileName = node.fileName;
            jobObj.fileSize = node.fileSize;
            $("#imgIdent").val(node.imageIdentifier);
            if (node.Activates) {
                dateStart.val(moment(node.Activates.toString()).format(AppMain.localization("DATETIME_FORMAT")));
            }
        }

        // tukaj pride koda za file upload
        $("#clear-icon").on("click", function () {
            jobObj.fileName = "";
            jobObj.fileSize = "";
            $(".select-file").show();
            $("#file-name-span").html();
            $(".file-selected").hide();
        });
        const inputElement = document.getElementById("sel-file");
        const spinner = $("#fileUploadProgressSpinner");
        inputElement.addEventListener("change", function () {

            let transferBytes = 0;
            let transferBegin = false;
            let transferEnd = false;
            let transferChunkCounter = 0;

            let reader = new FileReader();
            reader.onload = function () {
                //    file upload completed
                dmp("File upload complete");
            };

            CtrlActionTaskManager.readFileChunks(inputElement.files[0], function (dataChunk, file) {
                transferBegin = transferBytes === 0;
                transferBytes += 256 * 1024;
                transferEnd = (transferBytes >= file.size);
                transferChunkCounter += 1;

                // Show progress bar
                if (transferBegin) {
                    spinner.removeClass("hidden");
                    spinner.addClass("is-active");
                }

                if (transferEnd) {
                    spinner.removeClass("is-active");
                    spinner.addClass("hidden");
                    inputElement.value = "";
                    jobObj.fileName = file.name;
                    jobObj.fileSize = file.size;
                    $(".select-file").hide();
                    $("#file-name-span").html(file.name);
                    $(".file-selected").show();
                }

                AppMain.ws().exec("FileTransfer", {
                    "file-name": file.name,
                    data64: window.btoa(dataChunk),
                    "end-of-file": transferEnd,
                    "start-file": transferBegin,
                    "direction": "UPLOAD"
                }).getResponse(false);
            });

        }, false);

    }, 250);
};

/**
 * function for pop up add job: second step
 * @param jobType
 * @param node-> if node then it is edit
 */
CtrlActionTaskManager.addJobSecond = function (jobType, node) {
    "use strict";

    const priorityHtml = "<tr> <td>" + AppMain.t("PRIORITY", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"number\" name=\"priority\"/></div></td>" +
            "</tr>";

    const expiresHtml = "<tr> <td>" + AppMain.t("EXPIRES", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-js-textfield-datepicker textfield-short-175\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"dateExpires\"></div>" +
            "</td></tr>";

    const notOlderThanHtml = "<tr> <td>" + AppMain.t("NOT_OLDER_THAN", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-js-textfield-datepicker textfield-short-175\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"dateNotOlderThan\"></div>" +
            "</td></tr>";

    const asyncDataPush = "<tr> <td>" + AppMain.t("ASYNC_DATA_PUSH", "TASK_MANAGER") + "</td>" +
            "<td style='text-align: left'><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"checkbox\" name=\"async-data-push\"/></div></td>" +
            "</tr>";

    const replyHtml = "<tr> <td>" + AppMain.t("REPLY_ADDRESS_INPUT", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-textfield--floating-label textfield-short-175\">" +
            "<input class=\"mdl-textfield__input\" placeholder=\"http://...\" type=\"text\" name=\"reply-address\"" +
            " pattern=\"^[a-zA-Z\\d\\-:\/_.]+$\"/></div></td>" +
            "</tr>";

    const startHtml = "<tr> <td>" + AppMain.t("START_TIME", "TASK_MANAGER") + " *</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-js-textfield-datepicker textfield-short-175\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"dateStart\"></div>" +
            "</td></tr>";

    let repeatValues = {
        "": AppMain.t("NONE", "TASK_MANAGER"),
        "P1D": AppMain.t("DAILY", "TASK_MANAGER"),
        "P7D": AppMain.t("WEEKLY", "TASK_MANAGER"),
        "P1M": AppMain.t("MONTHLY", "TASK_MANAGER"),
        "P1Y": AppMain.t("YEARLY", "TASK_MANAGER"),
        "PT1M": AppMain.t("PT1M", "TASK_MANAGER"),
        "PT5M": AppMain.t("PT5M", "TASK_MANAGER"),
        "PT10M": AppMain.t("PT10M", "TASK_MANAGER"),
        "PT15M": AppMain.t("PT15M", "TASK_MANAGER"),
        "PT30M": AppMain.t("PT30M", "TASK_MANAGER"),
        "PT1H": AppMain.t("PT1H", "TASK_MANAGER"),
        "PT2H": AppMain.t("PT2H", "TASK_MANAGER"),
        "PT3H": AppMain.t("PT3H", "TASK_MANAGER"),
        "PT5H": AppMain.t("PT5H", "TASK_MANAGER"),
        "PT6H": AppMain.t("PT6H", "TASK_MANAGER"),
        "PT12H": AppMain.t("PT12H", "TASK_MANAGER")
    };
    if (node && node.RepeatingInterval) {
        if (!defined(repeatValues[node.RepeatingInterval.toString()])) {
            repeatValues[node.RepeatingInterval.toString()] = moment.duration(node.RepeatingInterval).asMinutes() + " " + AppMain.t("MINUTES", "global");
        }
    }
    const repeatingSelector = AppMain.html.formElementSelect("repeating", repeatValues, {
        label: "",
        elementSelected: (node && node.RepeatingInterval)
            ? node.RepeatingInterval.toString()
            : ""
    }, undefined, "textfield-short-175");

    const repeatingHtml = "<tr> <td>" + AppMain.t("REPEATING_INTERVAL", "TASK_MANAGER") + "</td>" +
            "<td>" + repeatingSelector + "</td></tr>";

    const duration = "<tr> <td>" + AppMain.t("DURATION", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-175\">" +
            "<input class=\"mdl-textfield__input input-short\" style='width: 138px !important;' type=\"number\" maxlength='2' id=\"d-minutes\"> " +
            AppMain.t("MINUTES", "global") + "</div>" + "</td></tr>";

    let allHtml = "";
    if (!(node && node.back !== true)) {
        allHtml += this.addJobStepsHtml(2, jobType);
    }

    allHtml += AppMain.t("INSERT_JOB_PARAMS", "TASK_MANAGER") + "</br>" +
            "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">";

    let isNodeScheduled = false;
    let isNodeNotification = false;
    if (node !== undefined) {
        isNodeNotification = defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION";
    }
    if (!isNodeNotification && node !== undefined) {
        if (node.Activates && node.Activates !== "") {
            isNodeScheduled = true;
        }
        if (node.RepeatingInterval && node.RepeatingInterval !== "") {
            isNodeScheduled = true;
        }
        if (node.Duration && node.Duration !== "") {
            isNodeScheduled = true;
        }
    }
    if (jobType === "notification") {
        isNodeNotification = true;
        isNodeScheduled = false;
    }
    if (jobType === "scheduled") {
        isNodeNotification = false;
        isNodeScheduled = true;
    }
    if (jobType === "on-demand") {
        isNodeNotification = false;
        isNodeScheduled = false;
    }

    if (jobType === "scheduled" || isNodeScheduled) {
        allHtml += startHtml + expiresHtml + repeatingHtml + duration;
    }
    if (!(jobType === "notification" || isNodeNotification)) {
        allHtml += notOlderThanHtml + priorityHtml + asyncDataPush + replyHtml;
    }
    if (jobType === "notification" || isNodeNotification) {
        allHtml += asyncDataPush + replyHtml;
    }

    allHtml = allHtml + "</table><br/><br/>";

    $.confirm({
        title: (node && node.back !== true)
            ? AppMain.t("EDIT_JOB", "TASK_MANAGER")
            : AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            back: {
                isHidden: node && node.back === undefined,
                text: AppMain.t("BACK", "global"),
                action: function () {
                    CtrlActionTaskManager.addJobFirstStep();
                    return true;
                }
            },
            confirm: {
                text: (node && node.back === undefined)
                    ? AppMain.t("SAVE", "global")
                    : jobType === "notification"
                        ? AppMain.t("CREATE", "global")
                        : AppMain.t("NEXT", "global"),
                action: function () {
                    let jobObj = {};
                    jobObj.jobType = jobType;
                    jobObj.ReplyAddress = $("input[name='reply-address']").val();
                    if (jobType === "notification" || isNodeNotification) {
                        jobObj.AcceptDataNotification = true;
                        jobObj.AsyncReplyFlag = $("input[name=\"async-data-push\"]:checked").length > 0;
                    } else {
                        const priority = $("input[name='priority']").val();
                        jobObj.Priority = priority !== ""
                            ? (Number.isNaN(parseInt(priority, 10))
                                ? 255
                                : parseInt(priority, 10))
                            : 255;
                        if (jobObj.Priority > 255 || jobObj.Priority < 0) {
                            jobObj.Priority = 255;
                            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("PRIORITY_ERROR_TXT", "TASK_MANAGER"));
                            return false;
                        }
                        const expires = $("#dateExpires").val();
                        jobObj.Expires = (expires && expires !== "")
                            ? moment(expires).toISOString()
                            : "";

                        const dateNotOlderThan = $("#dateNotOlderThan").val();
                        jobObj.NotOlderThan = dateNotOlderThan !== ""
                            ? moment(dateNotOlderThan).toISOString()
                            : "";

                        jobObj.AsyncReplyFlag = $("input[name=\"async-data-push\"]:checked").length > 0;

                        if (jobType === "scheduled" || isNodeScheduled) {
                            const startTime = $("#dateStart").val();
                            jobObj.Activates = startTime !== ""
                                ? moment(startTime).toISOString()
                                : "";

                            jobObj.RepeatingInterval = $("#repeating").val();

                            const dMinutes = parseInt($("#d-minutes").val(), 10);
                            jobObj.Duration = moment.duration({
                                seconds: 0,
                                minutes: (Number.isNaN(dMinutes) || dMinutes < 0)
                                    ? 0
                                    : dMinutes,
                                hours: 0,
                                days: 0,
                                months: 0,
                                years: 0
                            }).toISOString();
                            if (moment.duration(jobObj.Duration).asSeconds() === 0) {
                                jobObj.Duration = "";
                            }
                        }
                    }

                    // manage add rules
                    if (jobObj.NotOlderThan && jobObj.NotOlderThan !== "" && moment(jobObj.NotOlderThan).diff(moment()) <= 0) {
                        // Data Valid until  > current
                        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("DATA_VALID_ERROR_TXT", "TASK_MANAGER"));
                        return false;
                    }
                    if (jobObj.ReplyAddress) {
                        let re = new RegExp("^[a-zA-Z\\d\\-:\/_.]+$");
                        if (!re.test(jobObj.ReplyAddress)) {
                            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("PUSH_DEST_ERROR_TXT", "TASK_MANAGER"));
                            return false;
                        }
                    }
                    if (jobType === "scheduled") {
                        if (jobObj.Activates === "") {
                            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("START_TIME_ERROR_TXT", "TASK_MANAGER"));
                            return false;
                        }
                        if (jobObj.Expires && jobObj.Expires !== "") {
                            if (moment(jobObj.Expires).diff(moment(jobObj.Activates)) <= 0) { //expires > start_time
                                CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                        AppMain.t("EXPIRES_START_TIME_GREATER_ERROR_TXT", "TASK_MANAGER"));
                                return false;
                            }
                            if (jobObj.NotOlderThan && jobObj.NotOlderThan !== "" && moment(jobObj.NotOlderThan)
                                .diff(moment(jobObj.Expires)) <= 0) { //Data Valid until > expires
                                CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                        AppMain.t("EXPIRES_DATA_VALID_GREATER_ERROR_TXT", "TASK_MANAGER"));
                                return false;
                            }
                        }
                        if (jobObj.Duration && moment.duration(jobObj.Duration).asSeconds() < 60) {
                            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("DURATION_ERROR_TXT", "TASK_MANAGER"));
                            return false;
                        }
                        if (jobObj.RepeatingInterval && moment.duration(jobObj.RepeatingInterval).asSeconds() < 60) {
                            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("REPEATING_ERROR_TXT", "TASK_MANAGER"));
                            return false;
                        }
                    }

                    if (node && !node.back) {
                        jobObj.ID = node.ID;
                        CtrlActionTaskManager.addResourceRest(jobObj, true);
                    } else {
                        if (jobType === "notification") {
                            CtrlActionTaskManager.addResourceRest(jobObj);
                        } else {
                            CtrlActionTaskManager.addJobThirdStep(jobObj);
                        }
                    }
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
        AppMain.html.updateElements([".mdl-textfield", ".mdl-select", ".mdl-slider"]);
        CtrlActionTaskManager.initForm(node);
    }, 200);
};

/**
 * function for pop up add job: third step
 * @param jobObj
 */
CtrlActionTaskManager.addJobThirdStep = function (jobObj) {
    "use strict";

    const deviceRef = "<tr>\n    " +
            "<td class=\"mdl-data-table__cell--non-numeric\" style='width: 30px'>\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='device' name=\"ref-type\" class=\"mdl-radio__button\" checked>\n        " +
            "</label>" +
            "</td>" +
            "<td>" +
            AppMain.t("DEVICE_REFERENCE", "TASK_MANAGER") +
            "</td>" +
            "</tr>";
    const groupRef = "<tr>" +
            "<td class=\"mdl-data-table__cell--non-numeric\" style='width: 30px'>\n        " +
            "<label class=\"mdl-radio mdl-js-radio\" for=\"input-type\">\n            " +
            "<input type=\"radio\" value='group' name=\"ref-type\" class=\"mdl-radio__button\">\n        " +
            "</label>\n    " +
            "</td>\n    " +
            "<td>\n    " +
            AppMain.t("GROUP_REFERENCE", "TASK_MANAGER") +
            "</td>" +
            "</tr>";

    let allHtml = this.addJobStepsHtml(3, jobObj.jobType) +
            AppMain.t("SELECT_REFERENCE", "TASK_MANAGER") + "</br></br>" +
            "<table id='reference-type' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            deviceRef +
            groupRef +
            "</table>";

    $.confirm({
        title: AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            back: {
                text: AppMain.t("BACK", "global"),
                action: function () {
                    jobObj.back = true;
                    if (jobObj.jobService && jobObj.jobService === "upgrade") {
                        CtrlActionTaskManager.addJobFileUpload(jobObj.jobType, jobObj);
                    } else {
                        CtrlActionTaskManager.addJobSecond(jobObj.jobType, jobObj);
                    }
                    return true;
                }
            },
            confirm: {
                text: AppMain.t("NEXT", "global"),
                action: function () {
                    const refType = $("input[type='radio']:checked").val();
                    if (refType === "device") {
                        CtrlActionTaskManager.addJobDevice(jobObj);
                    } else {
                        CtrlActionTaskManager.addJobGroup(jobObj);
                    }
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
        $("#reference-type tr").on("click", function () {
            let input = $(this).find("input[name='ref-type']");
            if (input.length > 0) {
                input[0].click();
            }
        });
        AppMain.html.updateElements([".mdl-slider"]);
    }, 300);
};

/**
 * helper function for add node to devices
 */
CtrlActionTaskManager.addTitlePress = function () {
    "use strict";

    const devTitle = $("#add-title").val();
    if (devTitle !== "") {
        CtrlActionTaskManager.addTitle(devTitle);
    } else {
        CtrlActionTaskManager.importAlert(AppMain.t("DEVICES_ERR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("DEVICE_INSERT_ERROR", "TASK_MANAGER"));
    }
};

/**
 * helper function for add node to devices
 */
CtrlActionTaskManager.addTitle = function (deviceTitle) {
    "use strict";
    //add to table
    let r = Math.random().toString(36).substring(7);
    let devHtml = "<tr id='add-" + r + "'>" +
            "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + deviceTitle + "' checked/></td>" +
            "<td>" + deviceTitle + "</td>" +
            "</tr>";

    $("table#devices-table > tbody > tr:first").before(devHtml);
    setTimeout(function () {
        $("#add-" + r).fadeIn(200).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200);
    }, 200);
};

/**
 * function for pop up add job: fourth-devices step
 * @param jobObj
 */
CtrlActionTaskManager.addJobDevice = function (jobObj) {
    "use strict";

    const addHtml = "<div>" + AppMain.t("DEVICE_TITLE", "TASK_MANAGER") + ": " +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id='add-title' name=\"add-title\"/></div>" +
            "<button id='add-icon' class='mdl-button mdl-js-button mdl-button--raised mdl-button-small ' style='margin-left: 5px;'>" +
            AppMain.t("ADD", "global") + "</button>" +
            "</div><br/>";

    const importHtml = "<div>" + AppMain.t("DEVICE_IMPORT", "TASK_MANAGER") + ": " +
            "<span class=\"select-file\"> <input id=\"file\" type=\"file\" name=\"upload\" /></span>" +
            "<div id='file-selected' style=\"display: none;float: right;\" class=\"file-selected\">" +
            "   <i class='material-icons cursor-pointer' id='remove-' onclick='$(\"#file\").val(\"\");$(\".select-file\")" +
            ".show();$(\"#file-name\").html(\"\");$(\".file-selected\").hide();'>clear</i>" +
            "</div>" +
            "<div style=\"display: none;float:right; margin-right: 15px;margin-top: 3px;\" class=\"file-selected\" id=\"file-name\"></div>" +
            "</div><br/>";

    let allHtml = this.addJobStepsHtml(4, jobObj.jobType) +
            AppMain.t("SELECT_DEVICE_REFERENCE", "TASK_MANAGER") + "</br></br>" +
            addHtml +
            importHtml +
            "<table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            "<thead class=\"th-color-grey text-align-left\">" +
            "<tr>" +
            "<th style='width: 30px;padding-left: 18px'><input class=\"selectAllNodes\" name=\"selectAllNodes\" type=\"checkbox\"/></th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("DEVICE_TITLE", "TASK_MANAGER") + "</th>" +
            "</tr>" +
            "</thead><tbody>";

    if (this.nodesTitle.length > 0) {
        $.each(this.nodesTitle, function (index, title) {
            if (title.toString() !== "[object Object]") {
                allHtml += "<tr>" +
                        "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + title + "'/></td>" +
                        "<td>" + title + "</td>" +
                        "</tr>";
            }
        });
    }
    allHtml += "</tbody></table>";

    $.confirm({
        title: AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            back: {
                text: AppMain.t("BACK", "global"),
                action: function () {
                    jobObj.back = true;
                    CtrlActionTaskManager.addJobThirdStep(jobObj);
                    return true;
                }
            },
            confirm: {
                text: jobObj.jobType === "notification"
                    ? AppMain.t("CREATE", "global")
                    : AppMain.t("NEXT", "global"),
                action: function () {
                    jobObj.devices = [];
                    let inputC = $("input[name='selectNode']:checked");
                    inputC.each(function (i, elm) {
                        const element = $(elm);
                        jobObj.devices.push(element.attr("data-node-title"));
                    });
                    if (jobObj.devices.length === 0) {
                        CtrlActionTaskManager.importAlert(AppMain.t("DEVICES_ERR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("DEVICES_SELECT_ERROR", "TASK_MANAGER"));
                        return false;
                    }
                    jobObj.groups = [];
                    if (jobObj.jobType === "notification") {
                        CtrlActionTaskManager.addResourceRest(jobObj);
                    } else {
                        CtrlActionTaskManager.addJobFinal(jobObj);
                    }
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
        AppMain.html.updateElements([".mdl-slider"]);

        $(".selectNode").on("click", function (e) {
            e.stopPropagation();
        });

        $("#devices-table tr").on("click", function () {
            let input = $(this).find("input[name='selectNode']");
            if (input.length > 0) {
                input[0].click();
            }
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

        $("#add-icon").on("click", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            CtrlActionTaskManager.addTitlePress({event: e, target: this});
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
                    CtrlActionTaskManager.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "TASK_MANAGER"),
                            AppMain.t("IMPORT_CSV_ERROR", "TASK_MANAGER"));
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
                    CtrlActionTaskManager.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "TASK_MANAGER"),
                            AppMain.t("IMPORT_CSV_ERROR", "TASK_MANAGER"));
                    return;
                }
                header = header.split(",");

                const ind = header.indexOf("\"" + AppMain.t("DEVICE_TITLE", "NODES") + "\"");
                if (ind === -1) {
                    CtrlActionTaskManager.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "TASK_MANAGER"),
                            AppMain.t("IMPORT_ERROR", "TASK_MANAGER"));
                }
                allTextLines.forEach(function (line, index) {
                    if (index < startInd) {
                        return;
                    }
                    if (line !== "") {
                        CtrlActionTaskManager.addTitle(line.split(",")[ind]
                            .replace("\"", "").replace("\"", ""));
                    }
                });
            };
            reader.readAsText(uploadElement.files[0]);
            $("#file").val("");
            $(".select-file").show();
            $("#file-name").html("");
            $(".file-selected").hide();
        }, false);
    }, 500);
};


/**
 * helper function for devices import
 * @param title
 * @param content
 */
CtrlActionTaskManager.importAlert = function (title, content) {
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

/**
 * function for pop up add job: fourth-group step
 * @param jobObj
 */
CtrlActionTaskManager.addJobGroup = function (jobObj) {
    "use strict";

    let allHtml = this.addJobStepsHtml(4, jobObj.jobType) +
            AppMain.t("SELECT_GROUP_REFERENCE", "TASK_MANAGER") + "</br></br>" +
            "<table id='groups-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            "<thead class=\"th-color-grey text-align-left\">" +
            "<tr>" +
            "<th style='width: 30px;padding-left: 18px'><input class=\"selectAllNodes\" name=\"selectAllNodes\" type=\"checkbox\"/></th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("GROUP_ID", "TASK_MANAGER") + "</th>" +
            "</tr>" +
            "</thead><tbody>";

    if (this.groups.length > 0) {
        $.each(this.groups, function (index, group) {
            allHtml += "<tr>" +
                    "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + group + "'/></td>" +
                    "<td>" + group + "</td>" +
                    "</tr>";
        });
    }
    allHtml += "</tbody></table>";

    $.confirm({
        title: AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            back: {
                text: AppMain.t("BACK", "global"),
                action: function () {
                    jobObj.back = true;
                    CtrlActionTaskManager.addJobThirdStep(jobObj);
                    return true;
                }
            },
            confirm: {
                text: jobObj.jobType === "notification"
                    ? AppMain.t("CREATE", "global")
                    : AppMain.t("NEXT", "global"),
                action: function () {
                    jobObj.groups = [];
                    let inputC = $("input[name='selectNode']:checked");
                    inputC.each(function (i, elm) {
                        const element = $(elm);
                        jobObj.groups.push(element.attr("data-node-title"));
                    });
                    if (jobObj.groups.length === 0) {
                        CtrlActionTaskManager.importAlert(AppMain.t("GROUPS_ERR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("GROUPS_SELECT_ERROR", "TASK_MANAGER"));
                        return false;
                    } else {
                        jobObj.devices = [];
                        if (jobObj.jobType === "notification") {
                            CtrlActionTaskManager.addResourceRest(jobObj);
                        } else {
                            CtrlActionTaskManager.addJobFinal(jobObj);
                        }
                        return true;
                    }
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
        AppMain.html.updateElements([".mdl-slider"]);

        $("#groups-table tr").on("click", function () {
            let input = $(this).find("input[name='selectNode']");
            if (input.length > 0) {
                input[0].click();
            }
        });
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
    }, 300);
};


/**
 * relative range selector
 * @type {{"0": string, FFFDFFFF5AFFFFFFFFFFFFFF: String, FFFDFFFF1EFFFFFFFFFFFFFF: String, FFFDFFFF01FFFFFFFFFFFFFF: String, FFFDFFFFFF01FFFFFFFFFFFF:
 * String, FFFDFFFF07FFFFFFFFFFFFFF: String, FFFDFFFFB4FFFFFFFFFFFFFF: String}}
 */
CtrlActionTaskManager.relativeSelector = {
    "0": "---",
    "FFFDFFFFFF01FFFFFFFFFFFF": AppMain.t("1_HOUR", "TASK_MANAGER"),
    "FFFDFFFF01FFFFFFFFFFFFFF": AppMain.t("1_DAY", "TASK_MANAGER"),
    "FFFDFFFF07FFFFFFFFFFFFFF": AppMain.t("7_DAY", "TASK_MANAGER"),
    "FFFDFFFF1EFFFFFFFFFFFFFF": AppMain.t("30_DAY", "TASK_MANAGER"),
    "FFFDFFFF5AFFFFFFFFFFFFFF": AppMain.t("90_DAY", "TASK_MANAGER"),
    "FFFDFFFFB4FFFFFFFFFFFFFF": AppMain.t("180_DAY", "TASK_MANAGER")
};

/**
 * type selector
 * @type {{"cos:long-unsigned": String, "cos:enum": String, "cos:octet-string": String, "cos:integer": String}}
 */
CtrlActionTaskManager.typeSelector = {
    "cos:enum": AppMain.t("ENUM", "TASK_MANAGER"),
    "cos:long": AppMain.t("LONG", "TASK_MANAGER"),
    "cos:integer": AppMain.t("INTEGER", "TASK_MANAGER"),
    "cos:boolean": AppMain.t("BOOLEAN", "TASK_MANAGER"),
    "cos:unsigned": AppMain.t("UNSIGNED", "TASK_MANAGER"),
    "cos:long-unsigned": AppMain.t("LONG_UNSIGNED", "TASK_MANAGER"),
    "cos:double-long-unsigned": AppMain.t("DOUBLE_LONG_UNSIGNED", "TASK_MANAGER"),
    "cos:octet-string": AppMain.t("OCTET_STRING", "TASK_MANAGER")
};

/**
 * helper function for cosem html
 * @param jobType
 * @param jobService
 * @returns {string}
 */
CtrlActionTaskManager.getAddCosemHTML = function (jobType, jobService) {
    "use strict";

    const accessSelRowHtml = "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label mdl-js-textfield-datepicker " +
            "textfield-short-160 is-dirty\" style='margin-right: 20px;'>" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"add-access-from\" name=\"add-access-from\">" +
            "<label class=\"mdl-textfield__label\">" + AppMain.t("ACCESS_SELECTION_FROM", "TASK_MANAGER") + "</label>" +
            "</div>" +
            "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label mdl-js-textfield-datepicker textfield-short-160 is-dirty\">" +
            "<input class=\"mdl-textfield__input\" type=\"text\" id=\"add-access-to\" name=\"add-access-to\">" +
            "<label class=\"mdl-textfield__label\">" + AppMain.t("ACCESS_SELECTION_TO", "TASK_MANAGER") + "</label>" +
            "</div>";

    const repeatingSelector = AppMain.html.formElementSelect("relative-selector",
            CtrlActionTaskManager.relativeSelector, {
        label: AppMain.t("RELATIVE_ACCESS_SELECTION", "TASK_MANAGER"),
        elementSelected: "0"
    }, undefined, "textfield-short-175 is-dirty");


    const timeSelRowHtml = "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label is-dirty\" style='margin-right: 20px;'>" +
            "<input class=\"mdl-textfield__input just-number\" type=\"text\" id='min-time-diff' name=\"min-time-diff\"/>" +
            "<label class=\"mdl-textfield__label\">" + AppMain.t("MIN_TIME_DIFF", "TASK_MANAGER") + "</label>" +
            "</div>" +
            "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label is-dirty\">" +
            "<input class=\"mdl-textfield__input just-number\" type=\"text\" id='max-time-diff' name=\"max-time-diff\"/>" +
            "<label class=\"mdl-textfield__label\">" + AppMain.t("MAX_TIME_DIFF", "TASK_MANAGER") + "</label>" +
            "</div>";

    const typeSelector = AppMain.html.formElementSelect("variable-type",
            CtrlActionTaskManager.typeSelector, {
        label: AppMain.t("VALUE_TYPE", "TASK_MANAGER")
    }, undefined, "textfield-short-145 is-dirty");

    const valueInput = AppMain.html.formTextInput("variable-value", AppMain.t("VALUE", "TASK_MANAGER"), {
        wrapperClass: "textfield-short-115 mdl-textfield-less-padding is-dirty"
    });

    const attrLabel = $("#attr-label");
    attrLabel.html(AppMain.t("ATTRIBUTE_ID", "TASK_MANAGER") + " *");

    switch (jobType) {
    case "on-demand":
        switch (jobService) {
        case "get":
            return accessSelRowHtml;
        case "action":
            attrLabel.html(AppMain.t("METHOD_ID", "TASK_MANAGER") + " *");
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        case "set":
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        case "time-sync":
            return timeSelRowHtml;
        }
        break;
    case "scheduled":
        switch (jobService) {
        case "get":
            return repeatingSelector;
        case "action":
            attrLabel.html(AppMain.t("METHOD_ID", "TASK_MANAGER") + " *");
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        case "set":
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        case "time-sync":
            return timeSelRowHtml;
        }
        break;
    }
    return "";
};

/**
 * helper function service type
 * @param jobService
 * @returns {*}
 */
CtrlActionTaskManager.getAddCosemTableHTML = function (jobService) {
    "use strict";

    switch (jobService) {
    case "get":
        return AppMain.t("ACCESS_SELECTION", "TASK_MANAGER");
    case "set":
    case "action":
        return AppMain.t("VALUE", "TASK_MANAGER");
    case "time-sync":
        return AppMain.t("TIME_SYNC", "TASK_MANAGER");
    }
    return "";
};

/**
 * add job final step: cosem
 * @param jobObj
 */
CtrlActionTaskManager.addJobFinal = function (jobObj) {
    "use strict";

    CtrlActionTaskManager.hasCossemAttrs = false;
    if (jobObj.jobType !== "upgrade") {
        jobObj.jobService = "get";
    }
    let objValues = {
        "0": "---"
    };
    let objTimeValues = {
        "0": "---"
    };
    $.each(objectList.get, function (index, cosem) {
        objValues[index + 1] = AppMain.t(cosem.descCode, "TASK_MANAGER");
    });

    $.each(objectList.timeSync, function (index, cosem) {
        objTimeValues[index + 1] = AppMain.t(cosem.descCode, "TASK_MANAGER");
    });

    const objectSelector = AppMain.html.formElementSelect("job-object", objValues, {
        label: AppMain.t("SELECT_JOB_DESCRIPTION", "TASK_MANAGER"),
        elementSelected: "0"
    }, undefined, "textfield-short-185 mdl-textfield-less-padding");

    const objectTimeSelector = AppMain.html.formElementSelect("job-object", objTimeValues, {
        label: AppMain.t("SELECT_JOB_DESCRIPTION", "TASK_MANAGER"),
        elementSelected: "1"
    }, undefined, "textfield-short-185 mdl-textfield-less-padding");

    const serviceSelector = AppMain.html.formElementSelect("job-service", {
        "get": AppMain.t("GET", "TASK_MANAGER"),
        "set": AppMain.t("SET", "TASK_MANAGER"),
        "action": AppMain.t("ACTION", "TASK_MANAGER"),
        "time-sync": AppMain.t("TIME_SYNC", "TASK_MANAGER")
    }, {
        label: AppMain.t("SELECT_JOB_SERVICE", "TASK_MANAGER")
    }, undefined, "textfield-short-185 mdl-textfield-less-padding");

    const classHtml = "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label textfield-short-50 is-dirty\">" +
            "<input class=\"mdl-textfield__input just-number desc-check\" type=\"text\" id='add-class' maxlength='5' name=\"add-class\"/>" +
            "<label class=\"mdl-textfield__label\">" + AppMain.t("CLASS_ID", "TASK_MANAGER") + " *</label>" +
            "</div>";

    const instHtml = "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label is-dirty\" style='width: 180px;'>" +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-25 desc-check\">" +
            "<input  class=\"mdl-textfield__input just-number\" type=\"text\" name=\"inst1\" maxlength=\"3\"/></div>." +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-25 desc-check\">" +
            "<input  class=\"mdl-textfield__input just-number\" type=\"text\" name=\"inst2\" maxlength=\"3\"/></div>." +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-25 desc-check\">" +
            "<input  class=\"mdl-textfield__input just-number\" type=\"text\" name=\"inst3\" maxlength=\"3\"/></div>." +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-25 desc-check\">" +
            "<input  class=\"mdl-textfield__input just-number\" type=\"text\" name=\"inst4\" maxlength=\"3\"/></div>." +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-25 desc-check\">" +
            "<input  class=\"mdl-textfield__input just-number\" type=\"text\" name=\"inst5\" maxlength=\"3\"/></div>." +
            "<div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-25 desc-check\">" +
            "<input  class=\"mdl-textfield__input just-number\" type=\"text\" name=\"inst6\" maxlength=\"3\"/></div>" +
            "<label class=\"mdl-textfield__label\">" + AppMain.t("INSTANCE_ID", "TASK_MANAGER") + " *</label>" +
            "</div>";

    const attrHtml = "<div class=\"mdl-textfield mdl-textfield-less-padding mdl-textfield--floating-label is-dirty\" style='width: 77px;'>" +
            "<input class=\"mdl-textfield__input just-number desc-check\" type=\"text\" id='add-attr' maxlength='3' name=\"add-attr\"/>" +
            "<label class=\"mdl-textfield__label\" id='attr-label'>" + AppMain.t("ATTRIBUTE_ID", "TASK_MANAGER") + " *</label>" +
            "</div>";

    const addHtml = "<button id='add-icon' class='mdl-button mdl-js-button mdl-button--raised mdl-button-small ' style='margin-left: 5px;position: relative;top: 12px;'>" +
            AppMain.t("ADD", "global") + "</button>";

    let allHtml1;
    if (jobObj.jobType === "upgrade") {
        allHtml1 = this.addJobStepsHtml(5, jobObj.jobType) + AppMain.t("INSERT_COSEM_ATTRS_FOR_UP", "TASK_MANAGER") + "</br>" +
                "<div style='width: 100%;padding: 0;' class='mdl-grid'>";
    } else {
        allHtml1 = this.addJobStepsHtml(5, jobObj.jobType) + AppMain.t("INSERT_COSEM_ATTRS", "TASK_MANAGER") + "</br>" +
                "<div style='width: 100%;padding: 0;' class='mdl-grid'>" +
                "<div class='mdl-cell' style='width: 100%;'>" + serviceSelector + "</div>";
    }

    allHtml1 += "<div class='mdl-cell' id='obj_desc_cell' style='width: auto; margin-right: 15px;'>" + objectSelector + "</div>" +
            "<div class='mdl-cell' style='width:auto;margin-right:15px;'>" + classHtml + "</div>" +
            "<div class='mdl-cell' style='width:auto;margin-right:15px;'>" + instHtml + "</div>" +
            "<div class='mdl-cell' style='width:auto;margin-right:15px;'>" + attrHtml + "</div>";
    if (jobObj.jobType !== "upgrade") {
        allHtml1 += "<div id='accessSelRow' class='mdl-cell' style='width: auto; margin-right: 15px;'>" +
                CtrlActionTaskManager.getAddCosemHTML(jobObj.jobType, jobObj.jobService) + "</div>" +
                "<div class='mdl-cell' style='width: auto; margin-right: 15px;'>" + addHtml + "</div>";
    }
    allHtml1 += "</div>";

    let styleHid = "";
    if (jobObj.jobType === "upgrade") {
        styleHid = "display: none;";
    }

    let allHtml = allHtml1 +
            "<table id='cosem-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%;" + styleHid + "\">" +
            "<thead class=\"th-color-grey text-align-left\">" +
            "<tr>" +
            "<th style='width: 30px;'><input class=\"selectAllNodes\" name=\"selectAllNodes\" type=\"checkbox\"/></th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("SELECT_JOB_DESCRIPTION", "TASK_MANAGER") + "</th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("CLASS_ID", "TASK_MANAGER") + "</th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("INSTANCE_ID", "TASK_MANAGER") + "</th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("ATTRIBUTE_ID", "TASK_MANAGER") + "</th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\" id='tableCosemTH'>" + CtrlActionTaskManager.getAddCosemTableHTML(jobObj.jobService) + "" +
            "</thead><tbody></tbody></table><br/>";

    $.confirm({
        title: AppMain.t("ADD_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        boxWidth: jobObj.jobType !== "upgrade"
            ? "85%"
            : undefined,
        buttons: {
            back: {
                text: AppMain.t("BACK", "global"),
                action: function () {
                    jobObj.back = true;
                    if (jobObj.devices && jobObj.devices.length > 0) {
                        CtrlActionTaskManager.addJobDevice(jobObj);
                    } else {
                        CtrlActionTaskManager.addJobGroup(jobObj);
                    }
                    return true;
                }
            },
            confirm: {
                text: AppMain.t("CREATE", "global"),
                action: function () {
                    if (CtrlActionTaskManager.updateAttrs(jobObj)) {
                        if (jobObj.attrs.length === 0) {
                            CtrlActionTaskManager.importAlert(AppMain.t("COSEM_ERR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("COSEM_SELECT_ERROR", "TASK_MANAGER"));
                            return false;
                        }
                    } else {
                        return false;
                    }
                    CtrlActionTaskManager.addResourceRest(jobObj);
                    return true;
                }
            },
            createXML: {
                text: AppMain.t("CREATE_TO_FILE", "global"),
                action: function () {
                    if (CtrlActionTaskManager.updateAttrs(jobObj)) {
                        if (jobObj.attrs.length === 0) {
                            CtrlActionTaskManager.importAlert(AppMain.t("COSEM_ERR_TITLE_TXT", "TASK_MANAGER"),
                                    AppMain.t("COSEM_SELECT_ERROR", "TASK_MANAGER"));
                            return false;
                        }
                    } else {
                        return false;
                    }
                    CtrlActionTaskManager.addResourceXML(jobObj);
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
        AppMain.html.updateAllElements();

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
        $(".desc-check").on("input", function () {
            CtrlActionTaskManager.checkDesc();
        });
        $("#add-icon").on("click", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            CtrlActionTaskManager.addAttrPress();
            AppMain.html.updateElements([".mdl-button"]);
            return false;
        });

        let dateAccFrom = $("#add-access-from");
        dateAccFrom.datetimepicker({
            dayOfWeekStart: 1,
            lang: "sl",
            startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
            format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
        });

        let dateAccTo = $("#add-access-to");
        dateAccTo.datetimepicker({
            dayOfWeekStart: 1,
            lang: "sl",
            startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
            format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
        });

        $(".just-number").on("input", function () {
            if ($(this).hasClass("just-number")) {
                const nonNumReg = /[^0-9]/g;
                $(this).val($(this).val().replace(nonNumReg, ""));
            }
        });
        if (jobObj.jobType === "upgrade") {
            CtrlActionTaskManager.selectCosemHelper(objectList.upgrade[0]);
        }
        const jOd = $("#job-object");
        jOd.on("change", function () {
            if (jOd.val() !== "0") {
                const newValPos = parseInt(jOd.val(), 10) - 1;
                CtrlActionTaskManager.selectCosemHelper(objectList.get[newValPos]);
            }
        });
        const jS = $("#job-service");
        jS.on("change", function () {
            const jSerPom = jobObj.jobService;
            if (CtrlActionTaskManager.hasCossemAttrs && jobObj.jobService !== jS.val()) {
                return $.confirm({
                    title: AppMain.t("JOB_SERVICE_CHANGE", "TASK_MANAGER"),
                    content: AppMain.t("JOB_SERVICE_CHANGE_TXT", "TASK_MANAGER"),
                    useBootstrap: false,
                    draggable: false,
                    theme: "material",
                    buttons: {
                        confirm: {
                            text: AppMain.t("OK", "global"),
                            action: function () {
                                $("table#cosem-table > tbody").html("");
                                CtrlActionTaskManager.hasCossemAttrs = false;
                                jS.change();
                                return true;
                            }
                        },
                        cancel: {
                            text: AppMain.t("CANCEL", "global"),
                            action: function () {
                                setTimeout(function () {
                                    jS.val(jSerPom);
                                    jS.change();
                                }, 200);
                                return true;
                            }
                        }
                    }
                });
            }
            jobObj.jobService = jS.val();
            const descCell = $("#obj_desc_cell");
            if (jobObj.jobService !== "get" && jobObj.jobService !== "time-sync") {
                descCell.hide();
                descCell.html();
            } else {
                descCell.show();
                if (jobObj.jobService === "time-sync") {
                    descCell.html(objectTimeSelector);
                } else {
                    descCell.html(objectSelector);
                }
            }
            $("#accessSelRow").html(CtrlActionTaskManager.getAddCosemHTML(jobObj.jobType, jobObj.jobService));
            $("#tableCosemTH").html(CtrlActionTaskManager.getAddCosemTableHTML(jobObj.jobService));
            let varType = $("#variable-type");
            let varVal = $("#variable-value");
            setTimeout(function () {
                AppMain.html.updateAllElements();
                const jOd2 = $("#job-object");
                CtrlActionTaskManager.checkDesc();
                jOd2.on("change", function () {
                    if (jOd2.val() !== "0") {
                        const newValPos = parseInt(jOd2.val(), 10) - 1;
                        CtrlActionTaskManager.selectCosemHelper(objectList.get[newValPos]);
                    }
                });
                if (jobObj.jobService === "time-sync") {
                    CtrlActionTaskManager.selectCosemHelper(objectList.timeSync[0]);
                }
                dateAccFrom = $("#add-access-from");
                dateAccFrom.datetimepicker({
                    dayOfWeekStart: 1,
                    lang: "sl",
                    startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
                    format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
                });

                dateAccTo = $("#add-access-to");
                dateAccTo.datetimepicker({
                    dayOfWeekStart: 1,
                    lang: "sl",
                    startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
                    format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
                });

                varType = $("#variable-type");
                varVal = $("#variable-value");
                varVal.addClass("just-number"); // also enum is integer
                varType.on("change", function () {
                    switch (varType.val()) {
                    case "cos:enum":
                    case "cos:integer":
                    case "cos:long":
                    case "cos:boolean":
                    case "cos:long-unsigned":
                    case "cos:unsigned":
                    case "cos:double-long-unsigned":
                        varVal.addClass("just-number");
                        break;
                    default:
                        varVal.removeClass("just-number");
                    }
                    if (varVal.hasClass("just-number")) {
                        const nonNumReg = /[^0-9]/g;
                        varVal.val(varVal.val().replace(nonNumReg, ""));
                    }
                    return false;
                });

                varVal.on("input", function () {
                    if (varVal.hasClass("just-number")) {
                        const nonNumReg = /[^0-9]/g;
                        varVal.val(varVal.val().replace(nonNumReg, ""));
                    }
                });

                $(".just-number").on("input", function () {
                    if ($(this).hasClass("just-number")) {
                        const nonNumReg = /[^0-9]/g;
                        $(this).val($(this).val().replace(nonNumReg, ""));
                    }
                });
            }, 200);
        });
    }, 300);
};

/**
 * function inserts data from selected cosem
 * @param cosemObj Object
 */
CtrlActionTaskManager.selectCosemHelper = function (cosemObj) {
    "use strict";

    $("#add-class").val(cosemObj.classId);
    const instanceArr = cosemObj.instanceId.split(".");
    $.each(instanceArr, function (index, instance) {
        $("input[name='inst" + (index + 1) + "']").val(instance);
    });
    $("#add-attr").val(cosemObj.attributeId);

    if (cosemObj.classId === 7 && cosemObj.attributeId === 2) {
        if (cosemObj.instanceId === "1.0.99.1.0.255") {
            $("#relative-selector").val("FFFDFFFF07FFFFFFFFFFFFFF");
        } else {
            $("#relative-selector").val("FFFDFFFF1EFFFFFFFFFFFFFF");
        }
    } else {
        $("#relative-selector").val("0");
    }
};

/**
 * helper function to update jobObj - adds selected cosem attrs
 * @param jobObj
 * @returns {boolean}
 */
CtrlActionTaskManager.updateAttrs = function (jobObj) {
    "use strict";

    jobObj.attrs = [];
    let inputC = $("input[name='selectNode']:checked");
    inputC.each(function (i, elm) {
        const element = $(elm);
        jobObj.attrs.push({
            cClass: element.attr("data-node-class"),
            cInstance: element.attr("data-node-instance"),
            cAttr: element.attr("data-node-attr"),
            cAccessFrom: element.attr("data-node-access-from"),
            cAccessTo: element.attr("data-node-access-to"),
            cRelAccessFrom: element.attr("data-node-rel-access-from"),
            cRelAccessTo: element.attr("data-node-rel-access-to"),
            cMaxDiff: element.attr("data-node-max-diff"),
            cMinDiff: element.attr("data-node-min-diff"),
            cVarType: element.attr("data-node-var-type"),
            cVarValue: element.attr("data-node-var-value")
        });
    });
    if (jobObj.attrs.length === 0) {
        if (CtrlActionTaskManager.addAttrPress()) {
            inputC = $("input[name='selectNode']:checked");
            inputC.each(function (i, elm) {
                const element = $(elm);
                jobObj.attrs.push({
                    cClass: element.attr("data-node-class"),
                    cInstance: element.attr("data-node-instance"),
                    cAttr: element.attr("data-node-attr"),
                    cAccessFrom: element.attr("data-node-access-from"),
                    cAccessTo: element.attr("data-node-access-to"),
                    cRelAccessFrom: element.attr("data-node-rel-access-from"),
                    cRelAccessTo: element.attr("data-node-rel-access-to"),
                    cMaxDiff: element.attr("data-node-max-diff"),
                    cMinDiff: element.attr("data-node-min-diff"),
                    cVarType: element.attr("data-node-var-type"),
                    cVarValue: element.attr("data-node-var-value")
                });
            });
            return true;
        } else {
            return false;
        }
    }
    return true;
};

/**
 * function is called on classID, attrID or InstanceId change
 */
CtrlActionTaskManager.checkDesc = function () {
    "use strict";

    const classId = parseInt($("#add-class").val(), 10);
    const instanceId = $("input[name='inst1']").val() + "." + $("input[name='inst2']").val() + "." +
            $("input[name='inst3']").val() + "." + $("input[name='inst4']").val() + "." +
            $("input[name='inst5']").val() + "." + $("input[name='inst6']").val();
    const attrId = parseInt($("#add-attr").val(), 10);
    const service = $("#job-service").val();
    let list = [];
    switch (service) {
    case "get":
        list = objectList.get;
        break;
    case "time-sync":
        list = objectList.timeSync;
        break;
    }
    let isDesc = true;
    $.each(list, function (index, cosem) {
        if (cosem.classId === classId && cosem.instanceId === instanceId /*&& cosem.attributeId === attrId*/) {
            isDesc = false;
            $("#job-object").val(index + 1);
        }
    });
    if (classId === 7 && attrId === 2) {
        if (instanceId === "1.0.99.1.0.0") {
            $("#relative-selector").val("FFFDFFFF07FFFFFFFFFFFFFF");
        } else {
            $("#relative-selector").val("FFFDFFFF1EFFFFFFFFFFFFFF");
        }
    }
    if (isDesc) {
        $("#job-object").val("0");
    }
};

/**
 * function for adding cosem attributes to table list
 * @returns {boolean}
 */
CtrlActionTaskManager.addAttrPress = function () {
    "use strict";

    const descVal = $("#job-object").val();
    const service = $("#job-service").val();
    let descTXT = "---";
    switch (service) {
    case "get":
        descTXT = (defined(descVal) && descVal !== "0" && descVal !== "")
            ? objectList.get[parseInt(descVal, 10) - 1].description
            : "---";
        break;
    case "time-sync":
        descTXT = (defined(descVal) && descVal !== "0" && descVal !== "")
            ? objectList.timeSync[parseInt(descVal, 10) - 1].description
            : "---";
        break;
    }
    const classID = parseInt($("#add-class").val(), 10);
    if (Number.isNaN(classID) || classID < 0 || classID > 65536) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("CLASS_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }

    let instaID = "";
    let instaIDshort = "";
    const instaID1 = parseInt($("input[name='inst1']").val(), 10);
    if (Number.isNaN(instaID1) || instaID1 < 0 || instaID1 > 255) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("ATTRIBUTE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    instaIDshort += instaID1 + ".";
    if (instaID1.toString(16).length === 2) {
        instaID += instaID1.toString(16);
    } else {
        instaID += "0" + instaID1.toString(16);
    }

    const instaID2 = parseInt($("input[name='inst2']").val(), 10);
    if (Number.isNaN(instaID2) || instaID2 < 0 || instaID2 > 255) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("INSTANCE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    instaIDshort += instaID2 + ".";
    if (instaID2.toString(16).length === 2) {
        instaID += instaID2.toString(16);
    } else {
        instaID += "0" + instaID2.toString(16);
    }

    const instaID3 = parseInt($("input[name='inst3']").val(), 10);
    if (Number.isNaN(instaID3) || instaID3 < 0 || instaID3 > 255) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("INSTANCE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    instaIDshort += instaID3 + ".";
    if (instaID3.toString(16).length === 2) {
        instaID += instaID3.toString(16);
    } else {
        instaID += "0" + instaID3.toString(16);
    }

    const instaID4 = parseInt($("input[name='inst4']").val(), 10);
    if (Number.isNaN(instaID4) || instaID4 < 0 || instaID4 > 255) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("INSTANCE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    instaIDshort += instaID4 + ".";
    if (instaID4.toString(16).length === 2) {
        instaID += instaID4.toString(16);
    } else {
        instaID += "0" + instaID4.toString(16);
    }

    const instaID5 = parseInt($("input[name='inst5']").val(), 10);
    if (Number.isNaN(instaID5) || instaID5 < 0 || instaID5 > 255) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("INSTANCE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    instaIDshort += instaID5 + ".";
    if (instaID5.toString(16).length === 2) {
        instaID += instaID5.toString(16);
    } else {
        instaID += "0" + instaID5.toString(16);
    }

    const instaID6 = parseInt($("input[name='inst6']").val(), 10);
    if (Number.isNaN(instaID6) || instaID6 < 0 || instaID6 > 255) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("INSTANCE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    instaIDshort += instaID6;
    if (instaID6.toString(16).length === 2) {
        instaID += instaID6.toString(16);
    } else {
        instaID += "0" + instaID6.toString(16);
    }

    instaID = instaID.toUpperCase();

    const attrID = parseInt($("#add-attr").val(), 10);
    if (Number.isNaN(attrID) || attrID < 0 || attrID > 127) {
        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                AppMain.t("ATTRIBUTE_ID_ERROR_TXT", "TASK_MANAGER"));
        return false;
    }
    let accessFrom = $("#add-access-from").val();
    accessFrom = (defined(accessFrom) && accessFrom !== "")
        ? moment(accessFrom).toISOString()
        : "";
    let accessTo = $("#add-access-to").val();
    accessTo = (defined(accessTo) && accessTo !== "")
        ? moment(accessTo).toISOString()
        : "";
    let accessFromTXT = accessFrom;
    let accessToTXT = accessTo;
    if ((accessFrom && accessFrom !== "") || (accessTo && accessTo !== "")) {// isAccessSel
        if (accessFrom === "") {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("FROM_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        if (accessTo === "") {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("TO_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        if (moment(accessFrom).isAfter(accessTo)) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("FROM_TO_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
    }
    let relAccessFrom = $("#relative-selector").val();
    relAccessFrom = (defined(relAccessFrom) && relAccessFrom !== "0")
        ? relAccessFrom
        : "";
    let relAccessTo = "";
    if (relAccessFrom && relAccessFrom !== "") { // is relative access sel
        relAccessTo = "FFFEFFFFFFFFFFFFFFFFFFFF";
    }

    const maxDiffInt = parseInt($("#max-time-diff").val(), 10);
    let maxDiff = "";
    const minDiffInt = parseInt($("#min-time-diff").val(), 10);
    let minDiff = "";
    if (!Number.isNaN(maxDiffInt) || !Number.isNaN(minDiffInt)) { //is time sync
        if (Number.isNaN(maxDiffInt)) {
            maxDiff = "";
        } else {
            maxDiff = maxDiffInt + "";
        }
        if (Number.isNaN(minDiffInt)) {
            minDiff = "";
        } else {
            minDiff = minDiffInt + "";
        }
        if (!Number.isNaN(minDiffInt) && !Number.isNaN(maxDiffInt) && minDiffInt > maxDiffInt) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("MAXMINDIF_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
    } else {
        maxDiff = "";
        minDiff = "";
    }

    let varType = "";
    let varValue = "";
    const vType = $("#variable-type");
    if (vType.length) {
        varType = vType.val();
        varValue = $("#variable-value").val();
    }

    CtrlActionTaskManager.addAttrHtml(classID, instaID, attrID, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
            relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType);
    if (classID === 4 && attrID === 2) {
        CtrlActionTaskManager.addAttrHtml(classID, instaID, 4, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
                relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType);
        CtrlActionTaskManager.addAttrHtml(classID, instaID, 5, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
                relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType);
    }
    if (classID === 5 && attrID === 2) {
        CtrlActionTaskManager.addAttrHtml(classID, instaID, 5, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
                relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType);
    }
    if (classID === 5 && attrID === 3) {
        CtrlActionTaskManager.addAttrHtml(classID, instaID, 5, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
                relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType);
        CtrlActionTaskManager.addAttrHtml(classID, instaID, 6, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
                relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType);
    }
    return true;
};

CtrlActionTaskManager.addAttrHtml = function (classID, instaID, attrID, accessFrom, accessFromTXT, accessTo, accessToTXT, maxDiff, minDiff,
        relAccessFrom, relAccessTo, varType, varValue, descTXT, instaIDshort, vType) {
    "use strict";

    let devHtml = "<tr>" +
            "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-class='" + classID + "' " +
            "data-node-instance='" + instaID + "' data-node-attr='" + attrID + "' " +
            "data-node-access-from='" + accessFrom + "' data-node-access-to='" + accessTo + "' data-node-max-diff='" + maxDiff + "'" +
            " data-node-min-diff='" + minDiff + "' data-node-rel-access-from='" + relAccessFrom + "'" +
            " data-node-rel-access-to='" + relAccessTo + "'" +
            " data-node-var-type='" + varType + "'" +
            " data-node-var-value='" + varValue + "' checked/></td>" +
            "<td>" + descTXT + "</td>" +
            "<td>" + classID + "</td>" +
            "<td>" + instaIDshort + "</td>" +
            "<td>" + attrID + "</td>";
    if ((accessFrom && accessFrom !== "") || (accessTo && accessTo !== "")) {
        devHtml += "<td colspan='2'>" + AppMain.t("ACCESS_SELECTION_FROM", "TASK_MANAGER") + ": " + accessFromTXT + " <br/> "
                + AppMain.t("ACCESS_SELECTION_TO", "TASK_MANAGER") + ": " + accessToTXT + "</td>";
    } else if (relAccessFrom && relAccessFrom !== "") {
        devHtml += "<td colspan='2'>" + CtrlActionTaskManager.relativeSelector[relAccessFrom] + "</td>";
    } else if ((maxDiff !== "") || (minDiff !== "")) {
        devHtml += "<td colspan='2'>" + AppMain.t("MAX_TIME_DIFF", "TASK_MANAGER") + ": " + maxDiff + " <br/> "
                + AppMain.t("MIN_TIME_DIFF", "TASK_MANAGER") + ": " + minDiff + "</td>";
    } else if (vType.length) {
        devHtml += "<td colspan='2'>" + CtrlActionTaskManager.typeSelector[varType] + "(" + varValue + ")</td>";
    } else {
        devHtml += "<td></td>";
    }
    devHtml += "</tr>";
    const body = $("table#cosem-table > tbody");
    body.html(body.html() + devHtml);
    CtrlActionTaskManager.hasCossemAttrs = true;
};

/**
 * function to save resource XML to file
 * @param resource
 */
CtrlActionTaskManager.addResourceXML = function (resource) {
    "use strict";

    const addJson = CtrlActionTaskManager.getResourceJson(resource, undefined);
    let responseXML = AppMain.wsMes().getXML(addJson);
    download("data:text/xml;charset=utf-8;base64," + btoa(responseXML), build.device + "_Job_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".xml", "text/xml");
};

/**
 * add resource rest function
 * @param resource
 * @param isEdit
 * @returns {boolean}
 */
CtrlActionTaskManager.addResourceRest = function (resource, isEdit) {
    "use strict";

    const addJson = CtrlActionTaskManager.getResourceJson(resource, isEdit);
    let response = AppMain.wsMes().exec("RequestMessage", addJson).getResponse(false);
    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        CtrlActionTaskManager.exec();
        if (!isEdit) {
            AppMain.dialog("JOB_CREATED", "success", [response.ResponseMessage.Reply.ID.toString()]);
        } else {
            AppMain.dialog("JOB_UPDATED", "success", [resource.ID.toString()]);
        }
    }
    return true;
};
/**
 * add resource from XML rest function
 * @param resourceTXT xml
 * @returns {boolean}
 */
CtrlActionTaskManager.addResourceXMLRest = function (resourceTXT) {
    "use strict";

    let response = AppMain.wsMes().exec("RequestMessage", resourceTXT).getResponse(false);
    if (response && response.ResponseMessage && response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result
            && response.ResponseMessage.Reply.Result.toString() === "OK") {
        CtrlActionTaskManager.exec();
        AppMain.dialog("JOB_CREATED", "success", [response.ResponseMessage.Reply.ID.toString()]);
    }
    return true;
};

/**
 * function for creating resorce JSON, that is then transformed to XML for create request
 * @param resource
 * @param isEdit
 * @returns {{"mes:Header": {"mes:Noun": string, "mes:Verb": string, "mes:CorrelationID": string, "mes:Timestamp": string, "mes:MessageID": string}}}
 */
CtrlActionTaskManager.getResourceJson = function (resource, isEdit) {
    "use strict";

    let addJson = {
        "mes:Header": {
            "mes:Verb": "create",
            "mes:Noun": "DeviceAccess",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        }
    };
    if (isEdit) {
        addJson = {
            "mes:Header": {
                "mes:Verb": "change",
                "mes:Noun": "DeviceAccess",
                "mes:Timestamp": moment().toISOString(),
                "mes:MessageID": "78465521",
                "mes:CorrelationID": "78465521"
            }
        };
    }
    if (resource.AsyncReplyFlag && resource.AsyncReplyFlag !== "") {
        addJson["mes:Header"]["mes:AsyncReplyFlag"] = resource.AsyncReplyFlag;
    }
    if (resource.ReplyAddress && resource.ReplyAddress !== "") {
        addJson["mes:Header"]["mes:ReplyAddress"] = resource.ReplyAddress;
    }


    const xmlMainEl = "mes:Payload";
    addJson[xmlMainEl] = {};
    addJson[xmlMainEl]["mes:DeviceAccess"] = {};

    if (isEdit) {
        addJson["mes:Request"] = {};
        addJson["mes:Request"]["mes:ID"] = resource.ID.toString();
        addJson[xmlMainEl]["mes:DeviceAccess"]._ID = resource.ID.toString();
    }

    if (!isEdit) {
        if (resource.devices && resource.devices.length > 0) {
            addJson[xmlMainEl]["mes:DeviceAccess"]["dev:DevicesReferenceList"] = {};
            addJson[xmlMainEl]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:DeviceReference"] = [];
            $.each(resource.devices, function (i, elm) {
                addJson[xmlMainEl]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:DeviceReference"].push({
                    "_DeviceID": elm
                });
            });
        } else {
            if (resource.groups && resource.groups.length > 0) {
                addJson[xmlMainEl]["mes:DeviceAccess"]["dev:DevicesReferenceList"] = {};
                addJson[xmlMainEl]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:GroupReference"] = [];
                $.each(resource.groups, function (i, elm) {
                    addJson[xmlMainEl]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:GroupReference"].push({
                        "_GroupID": elm
                    });
                });
            }
        }

        if (resource.jobType !== "notification") {  //cosem access list
            addJson[xmlMainEl]["mes:DeviceAccess"]["dev:CosemAccessList"] = {};
            addJson[xmlMainEl]["mes:DeviceAccess"]["dev:CosemAccessList"]["dev:CosemAccess"] = [];
            $.each(resource.attrs, function (i, elm) {
                let obj;
                if (resource.jobService === "time-sync") {
                    obj = {
                        "dev:CosemAccessDescriptor": {
                            "dev:CosemTimeSync": {
                                "dev:cosem-object": {
                                    "cos:class-id": elm.cClass,
                                    "cos:instance-id": elm.cInstance,
                                    "cos:attribute-id": elm.cAttr
                                }
                            }
                        }
                    };
                    if (elm.cMinDiff) {
                        obj["dev:CosemAccessDescriptor"]["dev:CosemTimeSync"]["dev:min-time-diff"] = elm.cMinDiff;
                    }
                    if (elm.cMaxDiff) {
                        obj["dev:CosemAccessDescriptor"]["dev:CosemTimeSync"]["dev:max-time-diff"] = elm.cMaxDiff;
                    }
                    addJson[xmlMainEl]["mes:DeviceAccess"]["dev:CosemAccessList"]["dev:CosemAccess"].push(obj);

                } else {
                    obj = {};
                    if (resource.jobService === "set") {
                        obj = {
                            "dev:CosemAccessDescriptor": {
                                "dev:CosemXDLMSDescriptor": {
                                    "cos:set-request": {
                                        "cos:set-request-normal": {
                                            "cos:invoke-id-and-priority": 64,
                                            "cos:cosem-attribute-descriptor": {
                                                "cos:class-id": elm.cClass,
                                                "cos:instance-id": elm.cInstance,
                                                "cos:attribute-id": elm.cAttr
                                            },
                                            "cos:value": {}
                                        }
                                    }
                                }
                            }
                        };
                        obj["dev:CosemAccessDescriptor"]["dev:CosemXDLMSDescriptor"]["cos:set-request"]["cos:set-request-normal"]["cos:value"][elm.cVarType] = elm.cVarValue;
                    } else {
                        if (resource.jobService === "action") {
                            obj = {
                                "dev:CosemAccessDescriptor": {
                                    "dev:CosemXDLMSDescriptor": {
                                        "cos:action-request": {
                                            "cos:action-request-normal": {
                                                "cos:invoke-id-and-priority": 64,
                                                "cos:cosem-method-descriptor": {
                                                    "cos:class-id": elm.cClass,
                                                    "cos:instance-id": elm.cInstance,
                                                    "cos:method-id": elm.cAttr
                                                },
                                                "cos:method-invocation-parameters": {}
                                            }
                                        }
                                    }
                                }
                            };
                            obj["dev:CosemAccessDescriptor"]["dev:CosemXDLMSDescriptor"]["cos:action-request"]["cos:action-request-normal"]
                                ["cos:method-invocation-parameters"][elm.cVarType] = elm.cVarValue;
                        } else {
                            if (resource.jobType === "upgrade") {
                                obj = {
                                    "dev:CosemAccessDescriptor": {
                                        "dev:CosemUpgrade": {
                                            "dev:upgrade-file": resource.fileName,
                                            "dev:image-identifier": resource.imageIdentifier,
                                            "dev:image-size": resource.fileSize,
                                            "dev:cosem-object": {
                                                "cos:class-id": elm.cClass,
                                                "cos:instance-id": elm.cInstance,
                                                "cos:attribute-id": elm.cAttr
                                            }
                                        }
                                    }
                                };
                            } else {
                                obj = {
                                    "dev:CosemAccessDescriptor": {
                                        "dev:CosemXDLMSDescriptor": {
                                            "cos:get-request": {
                                                "cos:get-request-normal": {
                                                    "cos:invoke-id-and-priority": 64,
                                                    "cos:cosem-attribute-descriptor": {
                                                        "cos:class-id": elm.cClass,
                                                        "cos:instance-id": elm.cInstance,
                                                        "cos:attribute-id": elm.cAttr
                                                    }
                                                }
                                            }
                                        }
                                    }
                                };
                                if (defined(elm.cAccessFrom) && elm.cAccessFrom !== "" && defined(elm.cAccessTo) && elm.cAccessTo !== "") {
                                    obj["dev:CosemAccessDescriptor"]["dev:CosemXDLMSDescriptor"]["cos:get-request"]["cos:get-request-normal"]["cos:access-selection"] = {
                                        "cos:access-selector": 1,
                                        "cos:access-parameters": {
                                            "cos:structure": {
                                                "cos:structure": {
                                                    "cos:octet-string": "0000010000FF",
                                                    "cos:integer": 2,
                                                    "cos:long-unsigned": [8, 0]
                                                },
                                                "cos:date-time": [elm.cAccessFrom, elm.cAccessTo]
                                            }
                                        }
                                    };
                                }
                                if (defined(elm.cRelAccessFrom) && elm.cRelAccessFrom !== "" && defined(elm.cRelAccessTo) && elm.cRelAccessTo !== "") {
                                    obj["dev:CosemAccessDescriptor"]["dev:CosemXDLMSDescriptor"]["cos:get-request"]["cos:get-request-normal"]["cos:access-selection"] = {
                                        "cos:access-selector": 1,
                                        "cos:access-parameters": {
                                            "cos:structure": {
                                                "cos:structure": {
                                                    "cos:octet-string": "0000010000FF",
                                                    "cos:integer": 2,
                                                    "cos:long-unsigned": [8, 0]
                                                },
                                                "cos:octet-string": [elm.cRelAccessFrom, elm.cRelAccessTo]
                                            }
                                        }
                                    };
                                }
                            }
                        }
                    }
                    addJson[xmlMainEl]["mes:DeviceAccess"]["dev:CosemAccessList"]["dev:CosemAccess"].push(obj);
                }

            });
        }
    }

    if (defined(resource.Priority)) {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:Priority"] = resource.Priority;
    }

    if (resource.Expires && resource.Expires !== "") {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:Expires"] = resource.Expires;
    }

    if (resource.NotOlderThan && resource.NotOlderThan !== "") {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:NotOlderThan"] = resource.NotOlderThan;
    }

    if (resource.AcceptDataNotification && resource.AcceptDataNotification !== "") {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:AcceptDataNotification"] = resource.AcceptDataNotification;
    }

    if (resource.Activates && resource.Activates !== "") {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:Activates"] = resource.Activates;
    }

    if (resource.RepeatingInterval && resource.RepeatingInterval !== "") {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:RepeatingInterval"] = resource.RepeatingInterval;
    }

    if (resource.Duration && resource.Duration !== "") {
        addJson[xmlMainEl]["mes:DeviceAccess"]["dev:Duration"] = resource.Duration;
    }

    return addJson;
};

/**
 * helper function for init form
 * @param node
 */
CtrlActionTaskManager.initForm = function (node) {
    "use strict";

    const dateExpires = $("#dateExpires");
    dateExpires.datetimepicker({
        dayOfWeekStart: 1,
        lang: "sl",
        startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });

    const dateNotOlderThan = $("#dateNotOlderThan");
    dateNotOlderThan.datetimepicker({
        dayOfWeekStart: 1,
        lang: "sl",
        startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });

    const dateStart = $("#dateStart");
    dateStart.datetimepicker({
        dayOfWeekStart: 1,
        lang: "sl",
        startDate: moment().add(1, "day").format(AppMain.localization("DATETIME_FORMAT")),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });
    if (node !== undefined) {
        $("input[name='priority']").val(node.Priority);
        if (node.Expires) {
            dateExpires.val(moment(node.Expires.toString()).format(AppMain.localization("DATETIME_FORMAT")));
        }
        if (node.NotOlderThan) {
            dateNotOlderThan.val(moment(node.NotOlderThan.toString()).format(AppMain.localization("DATETIME_FORMAT")));
        }
        if (node.AcceptDataNotification && (node.AcceptDataNotification.toString() === "true" || node.AcceptDataNotification === true)) {
            $("input[name=\"push-meter-alarms\"]").prop("checked", true);
        }
        if (node.AsyncReplyFlag && (node.AsyncReplyFlag.toString() === "true" || node.AsyncReplyFlag === true)) {
            $("input[name=\"async-data-push\"]").prop("checked", true);
        }
        if (node.ReplyAddress) {
            $("input[name='reply-address']").val(node.ReplyAddress);
        }
        if (node.Activates) {
            dateStart.val(moment(node.Activates.toString()).format(AppMain.localization("DATETIME_FORMAT")));
        }
        if (node.Duration) {
            let dur = moment.duration(node.Duration);
            $("#d-minutes").val(dur.asMinutes());
        }
    }
};

/**
 * helper function for arranging cosem statistics
 * @param nodesCosemStat
 */
CtrlActionTaskManager.arrangeNodeCosemStat = function (nodesCosemStat) {
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
            CtrlActionTaskManager.nodesTitleObj[title] = title;
        });
    }
    this.nodesTitle = nodesTitle;
};


/**
 * function for getting groups
 * @returns {Array} array of groups
 */
CtrlActionTaskManager.getGroups = function () {
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
            rez.push(group._GroupID);
        });
        return rez;
    }
    return [];
};

/**
 * read file chunks function, helper for upload file
 * @param file
 * @param callback
 */
CtrlActionTaskManager.readFileChunks = function (file, callback) {
    "use strict";

    const chunkSize = 256 * 1024; // bytes
    let offset = 0;
    let chunkReaderBlock;
    const readEventHandler = function (evt) {
        if (evt.target.error === null) {
            offset += evt.target.result.length;
            callback(evt.target.result, file); // callback for handling read chunk
        } else {
            dmp("Read error: " + evt.target.error);
            return;
        }
        if (offset >= file.size) {
            dmp("Done reading file");
            return;
        }
        chunkReaderBlock(offset, chunkSize, file);
    };
    chunkReaderBlock = function (_offset, length, _file) {
        let r = new FileReader();
        const blob = _file.slice(_offset, length + _offset);
        r.onload = readEventHandler;
        r.readAsBinaryString(blob);
    };
    chunkReaderBlock(offset, chunkSize, file);
};

/**
 * function is triggered on import icon click
 * opens pop-up to import create job xml
 */

CtrlActionTaskManager.importClick = function () {
    "use strict";

    let allHtml = AppMain.t("FILE_FOR_IMPORT", "TASK_MANAGER");
    allHtml += "<table class='mdl-data-table table-no-borders' style=\"width: 100%\"><tbody>" +
            "<tr>" +
            "<td>" + AppMain.t("FILE", "TASK_MANAGER") + " *<div id=\"fileUploadProgressSpinner\" class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner hidden\"></div></td>" +
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
        title: AppMain.t("IMPORT_JOB", "TASK_MANAGER"),
        content: allHtml,
        useBootstrap: false,
        draggable: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("CREATE", "global"),
                action: function () {
                    if (CtrlActionTaskManager.importXML && CtrlActionTaskManager.importXML !== "") {
                        return CtrlActionTaskManager.addResourceXMLRest(CtrlActionTaskManager.importXML);
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
            CtrlActionTaskManager.importXML = "";
            $(".select-file").show();
            $("#file-name-span").html();
            $(".file-selected").hide();
        });
        const inputElement = document.getElementById("sel-file-import");
        inputElement.addEventListener("change", function () {

            let reader = new FileReader();
            let file = inputElement.files[0];
            reader.onload = function (event) {
                CtrlActionTaskManager.importXML = event.target.result;
                inputElement.value = "";
                $(".select-file").hide();
                $("#file-name-span").html(file.name);
                $(".file-selected").show();
            };
            reader.readAsText(file);

        }, false);

    }, 250);
};

CtrlActionTaskManager.getDataPopUp = function (e) {
    "use strict";

    const $this = $(e.target);
    let nodeID = $this.attr("data-node-id");

    $.each(this.resourceList, function (index, node) {
        if (node.ID.toString() === nodeID) {

            const startHtml = "<tr><td>" + AppMain.t("START_TIME", "TASK_MANAGER") + "</td>" +
                    "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-js-textfield-datepicker textfield-short-175\">" +
                    "<input class=\"mdl-textfield__input\" type=\"text\" id=\"dateStart\"></div>" +
                    "</td></tr>";

            const endHtml = "<tr> <td>" + AppMain.t("END_TIME", "TASK_MANAGER") + "</td>" +
                    "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield mdl-js-textfield-datepicker textfield-short-175\">" +
                    "<input class=\"mdl-textfield__input\" type=\"text\" id=\"dateEnd\"></div>" +
                    "</td></tr>";

            const lastValidData = "<tr> <td>" + AppMain.t("LAST_VALID_DATA", "TASK_MANAGER") + "</td>" +
                    "<td style='text-align: left'><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-145\">" +
                    "<input class=\"mdl-textfield__input\" type=\"checkbox\" name=\"last-valid-data\"/></div></td>" +
                    "</tr>";

            let allHtml = AppMain.t("INSERT_GET_JOB_PARAMS", "TASK_MANAGER") + "</br>" +
                    "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">"
                    + startHtml + endHtml + lastValidData + "</table>";
            if (node.DeviceReference || node.GroupReference) {
                allHtml += "<table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
                        "<thead class=\"th-color-grey text-align-left\">" +
                        "<tr>" +
                        "<th style='width: 30px;padding-left: 18px'><input class=\"selectAllTitles\" name=\"selectAllTitles\" type=\"checkbox\"/></th>";
                if (node.DeviceReference) {
                    allHtml += "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("DEVICE_TITLE", "TASK_MANAGER") + "</th>";
                } else {
                    allHtml += "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("GROUP_ID", "TASK_MANAGER") + "</th>";
                }
                allHtml += "</tr>" + "</thead><tbody>";

                if (node.DeviceReference) {
                    if (!node.DeviceReference.length) {
                        node.DeviceReference = [node.DeviceReference];
                    }
                    $.each(node.DeviceReference, function (index, title) {
                        allHtml += "<tr>";
                        allHtml += "<td><input type='checkbox' name='selectTitle' class='selectTitle' data-node-title='" + title._DeviceID + "'/></td>";
                        allHtml += "<td class='deviceTitleTxT'>" + title._DeviceID + "</td>" + "</tr>";
                    });
                } else {
                    if (!node.GroupReference.length) {
                        node.GroupReference = [node.GroupReference];
                    }
                    $.each(node.GroupReference, function (index, title) {
                        allHtml += "<tr>";
                        allHtml += "<td><input type='checkbox' name='selectTitle' class='selectTitle' data-node-title='" + title._GroupID + "'/></td>";
                        allHtml += "<td class='deviceTitleTxT'>" + title._GroupID + "</td>" + "</tr>";
                    });
                }
                allHtml += "</table>";
            }

            $.confirm({
                title: AppMain.t("GET_JOB_DATA_TITLE", "TASK_MANAGER", [nodeID]),
                content: allHtml,
                useBootstrap: false,
                draggable: false,
                theme: "material",
                buttons: {
                    confirm: {
                        text: AppMain.t("GET", "global"),
                        action: function () {
                            let getDataObj = {
                                id: nodeID
                            };
                            const startTime = $("#dateStart").val();
                            if (startTime !== "") {
                                getDataObj.startTime = moment(startTime).toISOString();
                            }
                            const endTime = $("#dateEnd").val();
                            if (endTime !== "") {
                                getDataObj.endTime = moment(endTime).toISOString();
                            }
                            if ($("input[name=\"last-valid-data\"]:checked").length > 0) {
                                getDataObj.lastValidData = true;
                            }

                            getDataObj.deviceReference = [];
                            getDataObj.groupReference = [];
                            let inputC = $("input[name='selectTitle']:checked");
                            inputC.each(function (i, elm) {
                                const element = $(elm);
                                if (node.DeviceReference) {
                                    getDataObj.deviceReference.push({
                                        "_DeviceID": element.attr("data-node-title")
                                    });
                                } else {
                                    getDataObj.groupReference.push({
                                        "_GroupID": element.attr("data-node-title")
                                    });
                                }
                            });
                            return CtrlActionTaskManager.getJobDataRest(getDataObj);
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
    });

    setTimeout(function () {
        const dateStart = $("#dateStart");
        dateStart.datetimepicker({
            dayOfWeekStart: 1,
            lang: "sl",
            startDate: moment().add(-1, "day").format(AppMain.localization("DATETIME_FORMAT")),
            format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
        });
        const dateEnd = $("#dateEnd");
        dateEnd.datetimepicker({
            dayOfWeekStart: 1,
            lang: "sl",
            startDate: moment().format(AppMain.localization("DATETIME_FORMAT")),
            format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
        });

        $(".selectAllTitles").on("click", function (e) {
            e.stopPropagation();
            const selectNode = $(".selectTitle");
            if (e.target.checked === true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            } else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });

        $("#devices-table tr td.deviceTitleTxT").on("click", function () {
            let input = $(this).parent().find("input[name='selectTitle']");
            if (input.length > 0) {
                input[0].click();
            }
        });
    }, 200);

};

CtrlActionTaskManager.getJobDataRest = function (getDataObj) {
    "use strict";

    let restObj = {
        "mes:Header": {
            "mes:Verb": "get",
            "mes:Noun": "DeviceAccess",
            "mes:Timestamp": moment().toISOString(),
            "mes:MessageID": "78465521",
            "mes:CorrelationID": "78465521"
        },
        "mes:Request": {
            "mes:ID": getDataObj.id
        },
        "mes:Payload": {
            "mes:DeviceAccess": {
                "dev:DevicesReferenceList": {}
            }
        }
    };
    if (getDataObj.startTime) {
        restObj["mes:Request"]["mes:StartTime"] = getDataObj.startTime;
    }
    if (getDataObj.endTime) {
        restObj["mes:Request"]["mes:EndTime"] = getDataObj.endTime;
    }
    if (getDataObj.lastValidData) {
        restObj["mes:Request"]["mes:LastValidData"] = "true";
    }

    if (getDataObj.deviceReference.length > 0) {
        restObj["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:DeviceReference"] = getDataObj.deviceReference;
    }
    if (getDataObj.groupReference > 0) {
        restObj["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:GroupReference"] = getDataObj.deviceReference;
    }

    let response = AppMain.wsMes().exec("RequestMessage", restObj).getResponse(true);

    response = vkbeautify.xml(new XMLSerializer().serializeToString(response), 2);

    download("data:text/xml;charset=utf-8;base64," + btoa(response), build.device + "_JobData_ID_" + getDataObj.id + "_" +
            moment().format("YYYY-MM-DD-HH-mm-ss") + ".xml", "text/xml");

    return true;
};

module.exports.CtrlActionTaskManager = CtrlActionTaskManager;