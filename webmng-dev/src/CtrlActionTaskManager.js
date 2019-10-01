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
const taskManagerHelper = require("./TaskManagerHelper");

/**
 * main controller execution function e.g. onLoad()
 */
CtrlActionTaskManager.exec = function () {
    "use strict";
    this.helper = new taskManagerHelper.TaskManagerHelper();

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
    $.each(this.resourceList, function (ignore, node) {
        if (defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION") {
            hasNotify = true;
        }
    });
    return hasNotify;
};

CtrlActionTaskManager.updateResourceList = function (resourceList) {
    "use strict";
    if (defined(resourceList.ResponseMessage.Payload.ResourceDirectory)) {
        this.resourceList = resourceList.ResponseMessage.Payload.ResourceDirectory.Resource;
        if (this.resourceList.length === undefined) {
            this.resourceList = [this.resourceList];
        }
    } else {
        this.resourceList = [];
    }
};

const checkResourceListResponse = function (resourceList) {
    "use strict";
    return resourceList.ResponseMessage.Reply && resourceList.ResponseMessage.Reply.Result
            && resourceList.ResponseMessage.Reply.Result.toString() === "OK";
};

/**
 * helper function for building table html
 */
CtrlActionTaskManager.buildNodeListHTML = function (resourceList) {
    "use strict";

    let listHtml = "";
    this.htmlTooltips = "";
    if (resourceList && resourceList.ResponseMessage && checkResourceListResponse(resourceList)) {
        CtrlActionTaskManager.updateResourceList(resourceList);
    }
    const self = this;
    $.each(this.resourceList, function (ignore, node) {
        const isUpgrade = self.helper.isResourceUpgrade(node);
        const isNotification = self.helper.isResourceNotification(node);
        const isScheduled = self.helper.isResourceScheduled(node, isUpgrade, isNotification);
        const isOndemand = self.helper.isResourceOnDemand(isScheduled, isUpgrade, isNotification);
        let typeTxt = self.helper.getResourceTypeTxt(isScheduled, isOndemand, isNotification, isUpgrade);
        const deviceTXTObj = self.helper.getResourceDeviceTxt(node, isNotification);
        const cosemObj = self.helper.getResourceCosemObj(node);
        const serviceTXT = self.helper.getResourceServiceTXT(node);
        const activatesTXT = self.helper.getResourceActivatesTXT(node);
        const expiresTXT = self.helper.getResourceExpiresTXT(node);
        let repeatTxt = self.helper.getResourceRepeatingTXT(node);
        const olderTXT = self.helper.getResourceOlderTXT(node);
        const priorityTXT = self.helper.getResourcePriorityTXT(node);
        const statusTXT = self.helper.getResourceStatusTXT(node);
        const activationTXT = self.helper.getResourceActivationTXT(node);
        const replyTXT = self.helper.getResourceReplyTXT(node);
        let durTXT = self.helper.getResourceDurationTXT(node);
        let notification = defined(node.AsyncReplyFlag);
        const clickHTML = " data-bind-event='click' data-node-id='" + node.ID.toString() + "' data-bind-method='CtrlActionTaskManager.getReferenceDevice' ";
        listHtml += "<tr>";
        listHtml += "<td class='checkbox-col'><input type='checkbox' name='selectJob' class='selectJob' data-node-ID='" + node.ID.toString() + "' " +
                "data-node-type='" + typeTxt + "' " +
                "data-node-device='" + deviceTXTObj.deviceTXT + "' " +
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
                "data-node-cosem='" + cosemObj.cosemTXT + "' " +
                "data-node-duration='" + durTXT + "' " +
                "></td>";
        listHtml += "<td class='ID'" + clickHTML + ">" + node.ID.toString() + "</td>";
        listHtml += "<td class='Type'" + clickHTML + ">" + typeTxt + "</td>";
        listHtml += "<td class='DeviceReference'" + clickHTML + ">" + deviceTXTObj.deviceTXTshort + "</td>";
        listHtml += "<td class='Service'" + clickHTML + ">" + serviceTXT + "</td>";
        listHtml += "<td class='Object'" + clickHTML + ">" + cosemObj.cosemTXTshort + "</td>";
        listHtml += "<td class='Activates'" + clickHTML + ">" + activatesTXT + "</td>";
        listHtml += "<td class='Expires'" + clickHTML + ">" + expiresTXT + "</td>";
        listHtml += "<td class='RepeatingInterval'" + clickHTML + ">" + repeatTxt + "</td>";
        listHtml += "<td class='Priority'" + clickHTML + ">" + priorityTXT + "</td>";
        listHtml += "<td" + clickHTML + "><span class='mdl-chip " + node.ResourceStatus.toString() + "'><span class='mdl-chip__text ResourceStatus'>"
                + statusTXT + "</span></span></td>";

        if (self.helper.hasResourceAsyncReplyFlag(node)) {
            listHtml += "<td" + clickHTML + "><input type='checkbox' checked disabled/></td>";
        } else {
            listHtml += "<td" + clickHTML + "><input type='checkbox' disabled/></td>";
        }
        listHtml += "<td>";
        if (self.helper.canEditResource(node, isUpgrade)) {
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

        inputC.each(function (ignore, elm) {
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

    $.each(this.resourceList, function (ignore, node) {
        if (node.ID.toString() === nodeID) {
            $thisParent.attr("data-opened", 1);
            const html = CtrlActionTaskManager.helper.getDeviceReferenceTableLineHtml(node, nodeID);
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

    let obj = {
        title: "",
        allHtml: ""
    };
    $.each(this.resourceList, function (ignore, node) {
        if (node.ID.toString() === nodeID) {
            obj = CtrlActionTaskManager.helper.getCosemAttributeDescriptorCaseCosemPopUpHTMLMaster(node, type);
        }
    });

    $.confirm({
        title: obj.title,
        content: obj.allHtml,
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

    $.each(this.resourceList, function (ignore, node) {
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

    $.each(this.resourceList, function (ignore, node) {
        if (node.ID.toString() === nodeID) {
            CtrlActionTaskManager.addJobSecond(undefined, node);
            return false;
        }
    });
};

const isResourceRestResponseOk = function (response) {
    "use strict";
    return response.ResponseMessage.Reply && response.ResponseMessage.Reply.Result && response.ResponseMessage.Reply.Result.toString() === "OK";
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

    if (response && response.ResponseMessage && isResourceRestResponseOk(response)) {
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

    let allHtml = "<span id='headerWizRow'>" + this.helper.addJobStepsHtml(1, undefined) + "</span>" +
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
            $("#headerWizRow").html(CtrlActionTaskManager.helper.addJobStepsHtml(1, value));
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

CtrlActionTaskManager.addJobFileUploadProcessNext = function (jobObj) {
    "use strict";
    if (jobObj.fileName && jobObj.fileName !== "") {
        CtrlActionTaskManager.addJobThirdStep(jobObj);
        return true;
    }
    CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
            AppMain.t("ADD_JOB_UPLOAD_FILE_ERR_TXT", "TASK_MANAGER"));
    return false;
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

    let allHtml = this.helper.addJobStepsHtml(2, jobType) + AppMain.t("FILE_FOR_UPGRADE", "TASK_MANAGER");
    allHtml += "<table class='mdl-data-table table-no-borders' style=\"width: 100%\"><tbody>" +
            "<tr>" +
            "<td>" + AppMain.t("FILE", "TASK_MANAGER") + " *<div id=\"fileUploadProgressSpinner\" class=\"mdl-spinner mdl-spinner--single-color mdl-js-spinner hidden\"></div></td>" +
            "<td style='text-align: left;'><div class=\"select-file\" style='padding-top: 5px;'><input id=\"sel-file\" type=\"file\" name=\"upload\" /></div>" +
            "<div style=\"display: none;\" class=\"file-selected\">" +
            "<div id='file-name-span'></div>" +
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
                    jobObj.imageIdentifier = $("#imgIdent").val();
                    jobObj.Activates = CtrlActionTaskManager.helper.getInsertedStartTime();
                    if (jobObj.imageIdentifier === "") {
                        CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("IMAGE_IDENTIFIER_ERROR_TXT", "TASK_MANAGER"));
                        return false;
                    }
                    return CtrlActionTaskManager.addJobFileUploadProcessNext(jobObj);
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
            const fns = $("#file-name-span");
            fns.html(node.fileName);
            fns.attr("title", node.fileName);
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
            $("#file-name-span").html("");
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
                    const fns1 = $("#file-name-span");
                    fns1.html(file.name);
                    fns1.attr("title", file.name);
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

CtrlActionTaskManager.addJobSecondProcessNext = function (node, jobObj, jobType) {
    "use strict";
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
    this.helper.arrangeRepeatingInterval(node);

    const repeatingSelector = AppMain.html.formElementSelect("repeating", this.helper.repeatValues, {
        label: "",
        elementSelected: this.helper.getResourceRepeatingInterval(node)
    }, undefined, "textfield-short-175");

    const repeatingHtml = "<tr><td>" + AppMain.t("REPEATING_INTERVAL", "TASK_MANAGER") + "</td>" +
            "<td>" + repeatingSelector + "</td></tr>";

    const duration = "<tr> <td>" + AppMain.t("DURATION", "TASK_MANAGER") + "</td>" +
            "<td><div class=\"mdl-textfield mdl-textfield-no-padding mdl-js-textfield textfield-short-175\">" +
            "<input class=\"mdl-textfield__input input-short\" style='width: 138px !important;' type=\"number\" maxlength='2' id=\"d-minutes\"> " +
            AppMain.t("MINUTES", "global") + "</div>" + "</td></tr>";

    const isCreateToFileHidden = CtrlActionTaskManager.helper.isHiddenCreateToFileForSecondStep(node, jobType);

    let allHtml = this.helper.setAddJobSecondHeader(node, jobType);
    allHtml += AppMain.t("INSERT_JOB_PARAMS", "TASK_MANAGER") + "</br>" +
            "<table class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">";

    let obj = this.helper.setResourceScheduledOrNotification(node, jobType);
    allHtml += this.helper.setIsResourceScheduledSecondStepHtml(jobType, obj, startHtml, expiresHtml, repeatingHtml, duration);
    allHtml += this.helper.setIsResourceNotNotificationSecondStepHtml(jobType, obj, notOlderThanHtml, priorityHtml, asyncDataPush, replyHtml);
    allHtml += this.helper.setIsResourceNotificationSecondStepHtml(jobType, obj, asyncDataPush, replyHtml);
    allHtml = allHtml + "</table><br/><br/>";

    $.confirm({
        title: this.helper.getAddJobSecondTitle(node),
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
                text: this.helper.getAddJobSecondConfirmText(node, jobType),
                action: function () {
                    let jobObj = CtrlActionTaskManager.helper.getAddJobSecondResourceObject(jobType, obj, CtrlActionTaskManager);
                    if (!jobObj) {
                        return false;
                    }
                    if (!CtrlActionTaskManager.helper.checkAddJobSecondManageAddRules(jobObj, jobType, CtrlActionTaskManager)) {
                        return false;
                    }
                    CtrlActionTaskManager.addJobSecondProcessNext(node, jobObj, jobType);
                    return true;
                }
            },
            createXML: {
                text: AppMain.t("CREATE_TO_FILE", "global"),
                isHidden: isCreateToFileHidden,
                action: function () {
                    let jobObj = CtrlActionTaskManager.helper.getAddJobSecondResourceObject(jobType, obj, CtrlActionTaskManager);
                    if (!jobObj) {
                        return false;
                    }
                    if (!CtrlActionTaskManager.helper.checkAddJobSecondManageAddRules(jobObj, jobType, CtrlActionTaskManager)) {
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
        AppMain.html.updateElements([".mdl-textfield", ".mdl-select", ".mdl-slider"]);
        CtrlActionTaskManager.helper.initForm(node);
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

    let allHtml = this.helper.addJobStepsHtml(3, jobObj.jobType) +
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
    if ($("table#devices-table > tbody > tr").length !== 0) {
        $("table#devices-table > tbody > tr:first").before(devHtml);
    } else {
        $("table#devices-table > tbody").html(devHtml);
    }
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

    let allHtml = this.helper.addJobStepsHtml(4, jobObj.jobType) +
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

    if (this.nodesTitle && this.nodesTitle.length > 0) {
        $.each(this.nodesTitle, function (ignore, title) {
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
                    inputC.each(function (ignore, elm) {
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
        CtrlActionTaskManager.helper.selectAllNodesOnClickSetup();

        $("#add-icon").on("click", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            CtrlActionTaskManager.addTitlePress({event: e, target: this});
            AppMain.html.updateElements([".mdl-button"]);
            return false;
        });

        const inputElement = document.getElementById("file");
        const processImportCSVfile = function (header, allTextLines, startInd) {
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

                let header = CtrlActionTaskManager.setHeader(allTextLines);
                let startInd = CtrlActionTaskManager.setStartIndex(allTextLines);
                if (!header.includes(",")) {
                    CtrlActionTaskManager.importAlert(AppMain.t("IMPORT_ERR_TITLE_TXT", "TASK_MANAGER"),
                            AppMain.t("IMPORT_CSV_ERROR", "TASK_MANAGER"));
                    return;
                }
                processImportCSVfile(header, allTextLines, startInd);
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
 * function for pop up add job: fourth-group step
 * @param jobObj
 */
CtrlActionTaskManager.addJobGroup = function (jobObj) {
    "use strict";

    let allHtml = this.helper.addJobStepsHtml(4, jobObj.jobType) +
            AppMain.t("SELECT_GROUP_REFERENCE", "TASK_MANAGER") + "</br></br>" +
            "<table id='groups-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
            "<thead class=\"th-color-grey text-align-left\">" +
            "<tr>" +
            "<th style='width: 30px;padding-left: 18px'><input class=\"selectAllNodes\" name=\"selectAllNodes\" type=\"checkbox\"/></th>" +
            "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("GROUP_ID", "TASK_MANAGER") + "</th>" +
            "</tr>" +
            "</thead><tbody>";

    if (this.groups.length > 0) {
        $.each(this.groups, function (ignore, group) {
            allHtml += "<tr>" +
                    "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-title='" + group.id + "'/></td>" +
                    "<td>" + group.id + "</td>" +
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
                    inputC.each(function (ignore, elm) {
                        const element = $(elm);
                        jobObj.groups.push(element.attr("data-node-title"));
                    });
                    if (jobObj.groups.length === 0) {
                        CtrlActionTaskManager.importAlert(AppMain.t("GROUPS_ERR_TITLE_TXT", "TASK_MANAGER"),
                                AppMain.t("GROUPS_SELECT_ERROR", "TASK_MANAGER"));
                        return false;
                    }
                    jobObj.devices = [];
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

        $("#groups-table tr").on("click", function () {
            let input = $(this).find("input[name='selectNode']");
            if (input.length > 0) {
                input[0].click();
            }
        });
        $(".selectNode").on("click", function (e) {
            e.stopPropagation();
        });
        CtrlActionTaskManager.helper.selectAllNodesOnClickSetup();
    }, 300);
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
            CtrlActionTaskManager.helper.relativeSelector, {
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
            CtrlActionTaskManager.helper.typeSelector, {
        label: AppMain.t("VALUE_TYPE", "TASK_MANAGER")
    }, undefined, "textfield-short-145 is-dirty");

    const valueInput = AppMain.html.formTextInput("variable-value", AppMain.t("VALUE", "TASK_MANAGER"), {
        wrapperClass: "textfield-short-115 mdl-textfield-less-padding is-dirty"
    });

    const attrLabel = $("#attr-label");
    attrLabel.html(AppMain.t("ATTRIBUTE_ID", "TASK_MANAGER") + " *");

    if (jobType === "on-demand") {
        return this.helper.getAddCosemHTMLForOnDemand(jobService, accessSelRowHtml, attrLabel, typeSelector, valueInput, timeSelRowHtml);
    }
    if (jobType === "scheduled") {
        return this.helper.getAddCosemHTMLForScheduled(jobService, repeatingSelector, attrLabel, typeSelector, valueInput, timeSelRowHtml);
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
    if (defined(this.helper.getAddCosemTableHTMLMap[jobService])) {
        return this.helper.getAddCosemTableHTMLMap[jobService];
    }
    return "";
};

const updateJobService = function (jobObj) {
    "use strict";
    if (jobObj.jobType !== "upgrade") {
        jobObj.jobService = "get";
    }
};

CtrlActionTaskManager.initAllhtml1 = function (jobObj, serviceSelector) {
    "use strict";
    if (jobObj.jobType === "upgrade") {
        return this.helper.addJobStepsHtml(5, jobObj.jobType) + AppMain.t("INSERT_COSEM_ATTRS_FOR_UP", "TASK_MANAGER") + "</br>" +
                "<div style='width: 100%;padding: 0;' class='mdl-grid'>";
    }
    return this.helper.addJobStepsHtml(5, jobObj.jobType) + AppMain.t("INSERT_COSEM_ATTRS", "TASK_MANAGER") + "</br>" +
            "<div style='width: 100%;padding: 0;' class='mdl-grid'>" +
            "<div class='mdl-cell' style='width: 100%;'>" + serviceSelector + "</div>";
};

/**
 * add job final step: cosem
 * @param jobObj
 */
CtrlActionTaskManager.addJobFinal = function (jobObj) {
    "use strict";

    CtrlActionTaskManager.hasCossemAttrs = false;
    updateJobService(jobObj);
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

    let allHtml1 = CtrlActionTaskManager.initAllhtml1(jobObj, serviceSelector);

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
    let hideCreateToFileButton = false;
    if (jobObj.jobType === "upgrade") {
        styleHid = "display: none;";
        hideCreateToFileButton = true;
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
                isHidden: hideCreateToFileButton,
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
        CtrlActionTaskManager.helper.selectAllNodesOnClickSetup();
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
        const processDescCell = function (jobObj) {
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
        };
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
            processDescCell(jobObj);
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
                    CtrlActionTaskManager.helper.varTypeOnchangeForJustNumberCheck(varType, varVal);
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
    CtrlActionTaskManager.helper.updateJobObjectWithAttributes(inputC, jobObj);
    if (jobObj.attrs.length === 0) {
        if (CtrlActionTaskManager.addAttrPress()) {
            inputC = $("input[name='selectNode']:checked");
            CtrlActionTaskManager.helper.updateJobObjectWithAttributes(inputC, jobObj);
            return true;
        }
        return false;
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
    let list = this.helper.initListForCheckDesc(service, objectList);
    let isDesc = true;
    $.each(list, function (index, cosem) {
        if (cosem.classId === classId && cosem.instanceId === instanceId /*&& cosem.attributeId === attrId*/) {
            isDesc = false;
            $("#job-object").val(index + 1);
        }
    });
    this.helper.checkDescRelativeSelector(classId, attrId, instanceId);
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
    let addObj = {};
    addObj.descTXT = this.helper.addAttrPressGetInsertedDescTXT(objectList);
    addObj.classID = parseInt($("#add-class").val(), 10);

    let instaID = "";
    let instaIDshort = "";
    addObj.instaID1 = parseInt($("input[name='inst1']").val(), 10);
    instaIDshort += addObj.instaID1 + ".";
    instaID += this.helper.updateInstaIDstring(addObj.instaID1);

    addObj.instaID2 = parseInt($("input[name='inst2']").val(), 10);
    instaIDshort += addObj.instaID2 + ".";
    instaID += this.helper.updateInstaIDstring(addObj.instaID2);

    addObj.instaID3 = parseInt($("input[name='inst3']").val(), 10);
    instaIDshort += addObj.instaID3 + ".";
    instaID += this.helper.updateInstaIDstring(addObj.instaID3);

    addObj.instaID4 = parseInt($("input[name='inst4']").val(), 10);
    instaIDshort += addObj.instaID4 + ".";
    instaID += this.helper.updateInstaIDstring(addObj.instaID4);

    addObj.instaID5 = parseInt($("input[name='inst5']").val(), 10);
    instaIDshort += addObj.instaID5 + ".";
    instaID += this.helper.updateInstaIDstring(addObj.instaID5);

    addObj.instaID6 = parseInt($("input[name='inst6']").val(), 10);
    instaIDshort += addObj.instaID6;
    instaID += this.helper.updateInstaIDstring(addObj.instaID6);
    addObj.instaID = instaID.toUpperCase();
    addObj.instaIDshort = instaIDshort;

    addObj.attrID = parseInt($("#add-attr").val(), 10);

    addObj.accessFrom = this.helper.addAttrPressGetAccessFrom();
    addObj.accessTo = this.helper.addAttrPressGetAccessTo();
    addObj.accessFromTXT = addObj.accessFrom;
    addObj.accessToTXT = addObj.accessTo;

    addObj.relAccessFrom = this.helper.addAttrPressGetRelAccessFrom();
    addObj.relAccessTo = this.helper.addAttrPressGetRelAccessTo();
    this.helper.addAttrPressGetMaxMindif(addObj);
    this.helper.addAttrPressGetVarTypeAndValue(addObj);

    if (!this.helper.addAttrPressCheckDataIsOk(addObj, CtrlActionTaskManager)) {
        return false;
    }
    CtrlActionTaskManager.addAttrPressProcess(addObj, addObj.classID, addObj.attrID);
    return true;
};

const isCombination4and2 = function (classID, attrID) {
    "use strict";
    return classID === 4 && attrID === 2;
};
const isCombination5and2 = function (classID, attrID) {
    "use strict";
    return classID === 5 && attrID === 2;
};
const isCombination5and3 = function (classID, attrID) {
    "use strict";
    return classID === 5 && attrID === 3;
};

CtrlActionTaskManager.addAttrPressProcess = function (addObj, classID, attrID) {
    "use strict";
    CtrlActionTaskManager.addAttrHtml(addObj);
    if (isCombination4and2(classID, attrID)) {
        addObj.attrID = 4;
        CtrlActionTaskManager.addAttrHtml(addObj);
        addObj.attrID = 5;
        CtrlActionTaskManager.addAttrHtml(addObj);
    }
    if (isCombination5and2(classID, attrID)) {
        addObj.attrID = 3;
        CtrlActionTaskManager.addAttrHtml(addObj);
    }
    if (isCombination5and3(classID, attrID)) {
        addObj.attrID = 5;
        CtrlActionTaskManager.addAttrHtml(addObj);
        addObj.attrID = 6;
        CtrlActionTaskManager.addAttrHtml(addObj);
    }
};

CtrlActionTaskManager.addAttrHtml = function (attrObj) {
    "use strict";

    let devHtml = "<tr>" +
            "<td><input type='checkbox' name='selectNode' class='selectNode' data-node-class='" + attrObj.classID + "' " +
            "data-node-instance='" + attrObj.instaID + "' data-node-attr='" + attrObj.attrID + "' " +
            "data-node-access-from='" + attrObj.accessFrom + "' data-node-access-to='" + attrObj.accessTo + "' data-node-max-diff='" + attrObj.maxDiff + "'" +
            " data-node-min-diff='" + attrObj.minDiff + "' data-node-rel-access-from='" + attrObj.relAccessFrom + "'" +
            " data-node-rel-access-to='" + attrObj.relAccessTo + "'" +
            " data-node-var-type='" + attrObj.varType + "'" +
            " data-node-var-value='" + attrObj.varValue + "' checked/></td>" +
            "<td>" + attrObj.descTXT + "</td>" +
            "<td>" + attrObj.classID + "</td>" +
            "<td>" + attrObj.instaIDshort + "</td>" +
            "<td>" + attrObj.attrID + "</td>";
    if (this.helper.hasResourceAccessFromTo(attrObj)) {
        devHtml += "<td colspan='2'>" + AppMain.t("ACCESS_SELECTION_FROM", "TASK_MANAGER") + ": " + attrObj.accessFromTXT + " <br/> "
                + AppMain.t("ACCESS_SELECTION_TO", "TASK_MANAGER") + ": " + attrObj.accessToTXT + "</td>";
    } else {
        devHtml += this.helper.addAttrHtmlHasResource(attrObj);
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

CtrlActionTaskManager.showAddResourceCreatedSuccesDialog = function (isEdit, response, resource) {
    "use strict";
    if (!isEdit) {
        AppMain.dialog("JOB_CREATED", "success", [response.ResponseMessage.Reply.ID.toString()]);
    } else {
        AppMain.dialog("JOB_UPDATED", "success", [resource.ID.toString()]);
    }
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
    if (response && response.ResponseMessage && isResourceRestResponseOk(response)) {
        CtrlActionTaskManager.exec();
        CtrlActionTaskManager.showAddResourceCreatedSuccesDialog(isEdit, response, resource);
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
    if (response && response.ResponseMessage && isResourceRestResponseOk(response)) {
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

    let addJson = this.helper.initializeAddJson(isEdit, resource);
    addJson["mes:Payload"] = {};
    addJson["mes:Payload"]["mes:DeviceAccess"] = {};

    if (isEdit) {
        addJson["mes:Request"] = {};
        addJson["mes:Request"]["mes:ID"] = resource.ID.toString();
        addJson["mes:Payload"]["mes:DeviceAccess"]._ID = resource.ID.toString();
    } else {
        this.helper.updateAddJsonReferences(addJson, resource);
        this.helper.updateAddJsonCosemAccessList(addJson, resource);
    }
    this.helper.updateAddJsonPriority(addJson, resource);
    this.helper.updateAddJsonExpires(addJson, resource);
    this.helper.updateAddJsonNotOlderThan(addJson, resource);
    this.helper.updateAddJsonAcceptDataNotification(addJson, resource);
    this.helper.updateAddJsonActivates(addJson, resource);
    this.helper.updateAddJsonRepeatinginterval(addJson, resource);
    this.helper.updateAddJsonDuration(addJson, resource);
    return addJson;
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
    $.each(nodesCosemStat, function (ignore, nodeStat) {
        nodesTitle.push(nodeStat["meter-id"]);
    });
    if (nodesTitle.length > 0) {
        $.each(nodesTitle, function (ignore, title) {
            CtrlActionTaskManager.nodesTitleObj[title] = title;
        });
    }
    this.nodesTitle = nodesTitle;
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
            "<div id='file-name-span'></div>" +
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
                    CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                            AppMain.t("ADD_JOB_UPLOAD_FILE_ERR_TXT", "TASK_MANAGER"));
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
            $("#file-name-span").html("");
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
                const fns = $("#file-name-span");
                fns.html(file.name);
                fns.attr("title", file.name);
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

    $.each(this.resourceList, function (ignore, node) {
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

            allHtml += CtrlActionTaskManager.helper.getDataPopUpReferenceHtml(node);

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
                            inputC.each(function (ignore, elm) {
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
    this.helper.restObjSetStartEndTimeAndLastValidData(restObj, getDataObj);
    this.helper.restObjSetDeviceAndGroupReference(restObj, getDataObj);
    let response = AppMain.wsMes().exec("RequestMessage", restObj).getResponse(true);
    response = vkbeautify.xml(new XMLSerializer().serializeToString(response), 2);
    download("data:text/xml;charset=utf-8;base64," + btoa(response), build.device + "_JobData_ID_" + getDataObj.id + "_" +
            moment().format("YYYY-MM-DD-HH-mm-ss") + ".xml", "text/xml");
    return true;
};

module.exports.CtrlActionTaskManager = CtrlActionTaskManager;