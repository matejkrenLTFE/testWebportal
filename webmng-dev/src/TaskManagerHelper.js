/**
 * Event log component
 * @class TaskManagerHelper helper
 */

/* global AppMain, defined, $ */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */
const moment = require("moment");

module.exports.TaskManagerHelper = function () {
    "use strict";

    this.isResourceUpgrade = function (node) {
        return defined(node.ResourceType) && node.ResourceType.toString() === "UPGRADE";
    };
    this.isResourceNotification = function (node) {
        return (defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION");
    };
    this.isResourceScheduledNodePom2 = function (node) {
        return (defined(node.Duration) && node.Duration !== "");
    };
    this.isResourceScheduledNodePom1 = function (node) {
        return (defined(node.RepeatingInterval) && node.RepeatingInterval !== "") || this.isResourceScheduledNodePom2(node);
    };
    this.isResourceScheduledNode = function (node) {
        return ((defined(node.Activates) && node.Activates !== "") || this.isResourceScheduledNodePom1(node));
    };
    this.isResourceScheduled = function (node, isUpgrade, isNotification) {
        return !isUpgrade && !isNotification && this.isResourceScheduledNode(node);
    };
    this.isResourceOnDemand = function (isScheduled, isUpgrade, isNotification) {
        return !isScheduled && !isNotification && !isUpgrade;
    };
    this.getResourceTypeTxtNotScheduled = function (isOndemand, isNotification, isUpgrade) {
        let typeTxt = "";
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
        return typeTxt;
    };
    this.getResourceTypeTxt = function (isScheduled, isOndemand, isNotification, isUpgrade) {
        let typeTxt = "";
        if (isScheduled) {
            typeTxt = AppMain.t("SCHEDULED", "TASK_MANAGER");
        } else {
            typeTxt = this.getResourceTypeTxtNotScheduled(isOndemand, isNotification, isUpgrade);
        }
        return typeTxt;
    };
    this.getDeviceRefDeviceId = function (node) {
        return defined(node.DeviceReference._DeviceID)
            ? node.DeviceReference._DeviceID
            : "---";
    };
    this.getDeviceRefGroupId = function (node) {
        return defined(node.GroupReference._GroupID)
            ? node.GroupReference._GroupID
            : "---";
    };
    this.getResourceDeviceReferenceTxt = function (node) {
        let txtObj = {
            deviceTXT: "",
            deviceTXTshort: ""
        };
        if (node.DeviceReference.length > 0) {
            if (node.DeviceReference.length === 1) {
                txtObj.deviceTXT = node.DeviceReference[0]._DeviceID;
                txtObj.deviceTXTshort = txtObj.deviceTXT;
            } else {
                txtObj.deviceTXT = "";
                $.each(node.DeviceReference, function (index, node) {
                    if (index !== 0) {
                        txtObj.deviceTXT += "; ";
                    }
                    txtObj.deviceTXT += node._DeviceID;
                });
                txtObj.deviceTXTshort = node.DeviceReference[0]._DeviceID + " ...";
            }
        } else {
            txtObj.deviceTXT = this.getDeviceRefDeviceId(node);
            txtObj.deviceTXTshort = txtObj.deviceTXT;
        }
        return txtObj;
    };

    this.getResourceRefGroupTxt = function (node) {
        let txtObj = {
            deviceTXT: "",
            deviceTXTshort: ""
        };
        if (node.GroupReference.length > 0) {
            if (node.GroupReference.length === 1) {
                txtObj.deviceTXT = node.GroupReference[0]._GroupID;
                txtObj.deviceTXTshort = txtObj.deviceTXT;
            } else {
                txtObj.deviceTXT = "";
                $.each(node.GroupReference, function (index, node) {
                    if (index !== 0) {
                        txtObj.deviceTXT += "; ";
                    }
                    txtObj.deviceTXT += node._GroupID;
                });
                txtObj.deviceTXTshort = node.GroupReference[0]._GroupID + " ...";
            }
        } else {
            txtObj.deviceTXT = this.getDeviceRefGroupId(node);
            txtObj.deviceTXTshort = txtObj.deviceTXT;
        }
        return txtObj;
    };

    this.getResourceDeviceTxt = function (node, isNotification) {
        let obj = {
            deviceTXT: "",
            deviceTXTshort: ""
        };
        if (defined(node.DeviceReference)) {
            return this.getResourceDeviceReferenceTxt(node);
        }
        if (defined(node.GroupReference)) {
            return this.getResourceRefGroupTxt(node);
        }
        if (isNotification) {
            obj.deviceTXT = "DG_ALL_METERS";
            obj.deviceTXTshort = obj.deviceTXT;
        }
        return obj;
    };

    /**
     * helper function to display instanceId
     */
    this.transformInstanceId = function (instance) {
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
        }
        return instance;
    };
    /**
     * helper function to display object
     */
    this.transformObject = function (classId, instance, attrId) {
        return "(" + classId.toString() + ") " +
                this.transformInstanceId(instance.toString()) + " ("
                + attrId.toString() + ")";
    };

    this.getResourceCosemAttrDescriptorObj = function (node) {
        let obj = {
            cosemTXT: "",
            cosemTXTshort: ""
        };
        if (node.CosemAttributeDescriptor.length === undefined) {
            node.CosemAttributeDescriptor = [node.CosemAttributeDescriptor];
        }
        obj.cosemTXTshort = this.transformObject(node.CosemAttributeDescriptor[0]["class-id"],
                node.CosemAttributeDescriptor[0]["instance-id"], node.CosemAttributeDescriptor[0]["attribute-id"]);
        if (node.CosemAttributeDescriptor.length > 1) {
            obj.cosemTXTshort += " ..."; // change
        }
        const self = this;
        $.each(node.CosemAttributeDescriptor, function (index, cosem) {
            if (index !== 0) {
                obj.cosemTXT += "; ";
            }
            obj.cosemTXT += self.transformObject(cosem["class-id"], cosem["instance-id"], cosem["attribute-id"]);
        });
        return obj;
    };
    this.getResourceCosemObj = function (node) {
        let obj = {
            cosemTXT: "",
            cosemTXTshort: ""
        };
        if (defined(node.CosemAttributeDescriptor)) {
            return this.getResourceCosemAttrDescriptorObj(node);
        }
        obj.cosemTXT = "---";
        obj.cosemTXTshort = "---";
        return obj;
    };

    this.getResourceServiceTXT = function (node) {
        return defined(node.ResourceType)
            ? AppMain.t(node.ResourceType, "TASK_MANAGER")
            : "";
    };
    this.getResourceActivatesTXT = function (node) {
        return defined(node.Activates)
            ? moment(node.Activates.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
    };
    this.getResourceExpiresTXT = function (node) {
        return defined(node.Expires)
            ? moment(node.Expires.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
    };
    this.getResourceOlderTXT = function (node) {
        return defined(node.NotOlderThan)
            ? moment(node.NotOlderThan.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
    };
    this.getResourcePriorityTXT = function (node) {
        return defined(node.Priority)
            ? node.Priority.toString()
            : "---";
    };
    this.getResourceStatusTXT = function (node) {
        return defined(node.ResourceStatus)
            ? AppMain.t(node.ResourceStatus.toString().replace(/-/g, "_"), "TASK_MANAGER")
            : "---";
    };
    this.getResourceActivationTXT = function (node) {
        return defined(node.LastActivation)
            ? moment(node.LastActivation.toString()).format(AppMain.localization("DATETIME_FORMAT"))
            : "---";
    };
    this.getResourceReplyTXT = function (node) {
        return defined(node.ReplyAddress)
            ? node.ReplyAddress.toString()
            : "---";
    };
    this.getResourceDurationTXT = function (node) {
        return (defined(node.Duration))
            ? moment.duration(node.Duration).asMinutes() + " " + AppMain.t("MINUTES", "global")
            : "---";
    };

    this.repeatingMap = {
        "P1D": AppMain.t("DAILY", "TASK_MANAGER"),
        "P7D": AppMain.t("WEEKLY", "TASK_MANAGER"),
        "P1M": AppMain.t("MONTHLY", "TASK_MANAGER"),
        "P1Y": AppMain.t("YEARLY", "TASK_MANAGER"),
        "PT1M": AppMain.t("PT1M", "TASK_MANAGER")
    };


    this.repeatValues = {
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

    this.getResourceRepeatingTXT = function (node) {
        if (defined(node.RepeatingInterval)) {
            if (defined(this.repeatingMap[node.RepeatingInterval.toString()])) {
                return this.repeatingMap[node.RepeatingInterval.toString()];
            }
            return moment.duration(node.RepeatingInterval).asMinutes() + " " + AppMain.t("MINUTES", "global");
        }
        return "---";
    };

    this.manageExpires = function (node, dateExpires) {
        if (node.Expires) {
            dateExpires.val(moment(node.Expires.toString()).format(AppMain.localization("DATETIME_FORMAT")));
        }
    };
    this.manageDateNotOlderThan = function (node, dateNotOlderThan) {
        if (node.NotOlderThan) {
            dateNotOlderThan.val(moment(node.NotOlderThan.toString()).format(AppMain.localization("DATETIME_FORMAT")));
        }
    };
    this.manageDataNotification = function (node) {
        if (node.AcceptDataNotification && (node.AcceptDataNotification.toString() === "true" || node.AcceptDataNotification === true)) {
            $("input[name=\"push-meter-alarms\"]").prop("checked", true);
        }
    };
    this.manageAsyncDataPush = function (node) {
        if (node.AsyncReplyFlag && (node.AsyncReplyFlag.toString() === "true" || node.AsyncReplyFlag === true)) {
            $("input[name=\"async-data-push\"]").prop("checked", true);
        }
    };
    this.manageReplyAddress = function (node) {
        if (node.ReplyAddress) {
            $("input[name='reply-address']").val(node.ReplyAddress);
        }
    };
    this.manageActivates = function (node, dateStart) {
        if (node.Activates) {
            dateStart.val(moment(node.Activates.toString()).format(AppMain.localization("DATETIME_FORMAT")));
        }
    };
    this.manageDuration = function (node) {
        if (node.Duration) {
            let dur = moment.duration(node.Duration);
            $("#d-minutes").val(dur.asMinutes());
        }
    };
    /**
     * helper function for init form
     * @param node
     */
    this.initForm = function (node) {
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
            this.manageExpires(node, dateExpires);
            this.manageDateNotOlderThan(node, dateNotOlderThan);
            this.manageDataNotification(node);
            this.manageAsyncDataPush(node);
            this.manageReplyAddress(node);
            this.manageActivates(node, dateStart);
            this.manageDuration(node);
        }
    };
    this.processDeviceReferenceTrHTML = function (node) {
        let obj = {
            devTXT: "",
            isMore: false,
            dType: ""
        };
        if (node.DeviceReference.length === undefined) {
            node.DeviceReference = [node.DeviceReference];
        }
        obj.devTXT += node.DeviceReference[0]._DeviceID;
        if (node.DeviceReference.length > 1) {
            obj.devTXT += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
            obj.isMore = true;
            obj.dType = "devices";
        }
        return obj;
    };
    this.processGroupReferenceTrPom = function (node) {
        let obj = {
            devTXT: "",
            isMore: false,
            dType: ""
        };
        if (node.GroupReference.length === undefined) {
            node.GroupReference = [node.GroupReference];
        }
        obj.devTXT += node.GroupReference[0]._GroupID;
        if (node.GroupReference.length > 1) {
            obj.devTXT += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
            obj.isMore = true;
            obj.dType = "group";
        }
        return obj;
    };
    this.processGroupReferenceTrHTML = function (node) {
        let obj = {
            devTXT: "",
            isMore: false,
            dType: ""
        };
        if (defined(node.GroupReference)) {
            obj = this.processGroupReferenceTrPom(node);
        } else {
            if (defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION") {
                obj.devTXT = "DG_ALL_METERS";
                obj.isMore = false;
            }
        }
        return obj;
    };

    this.getDeviceReferenceTableTRHtml = function (node, nodeID) {
        let obj;
        if (defined(node.DeviceReference)) {
            obj = this.processDeviceReferenceTrHTML(node);
        } else {
            obj = this.processGroupReferenceTrHTML(node);
        }
        if (obj.isMore) {
            return "<td colspan='2' data-node-id='" + nodeID + "' data-bind-method='CtrlActionTaskManager.cosemAttributeDescriptor' " +
                    "data-bind-event='click' data-more-type='" + obj.dType + "' class='cursor-pointer' style='text-align: left'>" + obj.devTXT + "</td>";
        }
        return "<td colspan='2' style='text-align: left'>" + obj.devTXT + "</td>";
    };

    this.manageCosemAttributeDescriptor = function (node) {
        let cosemTXT = "";
        if (node.CosemAttributeDescriptor.length === undefined) {
            node.CosemAttributeDescriptor = [node.CosemAttributeDescriptor];
        }
        cosemTXT += this.transformObject(node.CosemAttributeDescriptor[0]["class-id"], node.CosemAttributeDescriptor[0]["instance-id"],
                node.CosemAttributeDescriptor[0]["attribute-id"]);
        if (node.CosemAttributeDescriptor.length > 1) {
            cosemTXT += " <i class=\"material-icons more-icon\">photo_size_select_small</i>";
        }
        return cosemTXT;
    };

    this.getDeviceReferenceTableCosemTRHtml = function (node, nodeID) {
        let cosemTXT = "";
        if (defined(node.CosemAttributeDescriptor)) {
            cosemTXT = this.manageCosemAttributeDescriptor(node);
        } else {
            cosemTXT = "---";
        }
        if (node.CosemAttributeDescriptor && node.CosemAttributeDescriptor.length > 1) {
            return "<td class='cursor-pointer' data-node-id='" + nodeID + "' data-bind-method='CtrlActionTaskManager.cosemAttributeDescriptor' " +
                    "data-bind-event='click' data-more-type='cosem' colspan='7' style='text-align: left;' >" + cosemTXT + "</td> </tr>";
        }
        return "<td colspan='6' style='text-align: left;' >" + cosemTXT + "</td> </tr>";
    };

    this.getDeviceReferenceTableLineHtml = function (node, nodeID) {
        let html = "<tr class='nodeListShowDetails'>";
        html += "<td colspan='3'>" + AppMain.t("NOT_OLDER_THAN", "TASK_MANAGER") + "</td>";
        html += "<td colspan='2' style='text-align: left'>" + this.getResourceOlderTXT(node) + "</td>";
        html += "<td colspan='2'>" + AppMain.t("LAST_ACTIVATION", "TASK_MANAGER") + "</td>";
        html += "<td colspan='6' style='text-align: left'>" + this.getResourceActivationTXT(node) + "</td>";
        html += "</tr>";
        html += "<tr class='nodeListShowDetails'>";
        html += "<td colspan='3'>" + AppMain.t("DURATION", "TASK_MANAGER") + "</td>";
        html += "<td colspan='2' style='text-align: left'>" + this.getResourceDurationTXT(node) + "</td>";
        html += "<td colspan='2'>" + AppMain.t("REPLY_ADDRESS", "TASK_MANAGER") + "</td>";
        html += "<td colspan='6' style='text-align: left'>" + this.getResourceReplyTXT(node) + "</td>";
        html += "<tr class='nodeListShowDetails'>";
        html += "<td colspan='3'>" + AppMain.t("DEVICE_REFERENCE", "TASK_MANAGER") + "</td>";
        html += this.getDeviceReferenceTableTRHtml(node, nodeID);
        html += "<td colspan='2'>" + AppMain.t("OBJECT", "TASK_MANAGER") + "</td>";
        html += this.getDeviceReferenceTableCosemTRHtml(node, nodeID);
        return html;
    };
};