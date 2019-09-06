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


    const justNumberVarTypeValues = ["cos:enum", "cos:integer", "cos:long", "cos:boolean", "cos:long-unsigned", "cos:unsigned", "cos:double-long-unsigned"];

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

    /**
     * relative range selector
     * @type {{"0": string, FFFDFFFF5AFFFFFFFFFFFFFF: String, FFFDFFFF1EFFFFFFFFFFFFFF: String, FFFDFFFF01FFFFFFFFFFFFFF: String, FFFDFFFFFF01FFFFFFFFFFFF:
     * String, FFFDFFFF07FFFFFFFFFFFFFF: String, FFFDFFFFB4FFFFFFFFFFFFFF: String}}
     */
    this.relativeSelector = {
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
    this.typeSelector = {
        "cos:enum": AppMain.t("ENUM", "TASK_MANAGER"),
        "cos:long": AppMain.t("LONG", "TASK_MANAGER"),
        "cos:integer": AppMain.t("INTEGER", "TASK_MANAGER"),
        "cos:boolean": AppMain.t("BOOLEAN", "TASK_MANAGER"),
        "cos:unsigned": AppMain.t("UNSIGNED", "TASK_MANAGER"),
        "cos:long-unsigned": AppMain.t("LONG_UNSIGNED", "TASK_MANAGER"),
        "cos:double-long-unsigned": AppMain.t("DOUBLE_LONG_UNSIGNED", "TASK_MANAGER"),
        "cos:octet-string": AppMain.t("OCTET_STRING", "TASK_MANAGER")
    };

    this.getAddCosemTableHTMLMap = {
        "get": AppMain.t("ACCESS_SELECTION", "TASK_MANAGER"),
        "set": AppMain.t("VALUE", "TASK_MANAGER"),
        "action": AppMain.t("VALUE", "TASK_MANAGER"),
        "time-sync": AppMain.t("TIME_SYNC", "TASK_MANAGER")
    };

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
    this.hasResourceAsyncReplyFlag = function (node) {
        return defined(node.AsyncReplyFlag) && node.AsyncReplyFlag.toString() === "true";
    };
    this.canEditResource = function (node, isUpgrade) {
        return node.ResourceStatus.toString() !== "FINISHED" && !isUpgrade;
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

    this.getResourceRepeatingTXT = function (node) {
        if (defined(node.RepeatingInterval)) {
            if (defined(this.repeatingMap[node.RepeatingInterval.toString()])) {
                return this.repeatingMap[node.RepeatingInterval.toString()];
            }
            return moment.duration(node.RepeatingInterval).asMinutes() + " " + AppMain.t("MINUTES", "global");
        }
        return "---";
    };

    this.getResourceRepeatingInterval = function (node) {
        return (node && node.RepeatingInterval)
            ? node.RepeatingInterval.toString()
            : "";
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

    const dividableby3is1 = function (node) {
        return node.CosemAttributeDescriptor && node.CosemAttributeDescriptor.length % 3 === 1;
    };
    const dividableby3is2 = function (node) {
        return node.CosemAttributeDescriptor && node.CosemAttributeDescriptor.length % 3 === 2;
    };
    this.getCosemAttributeDescriptorCaseCosemPopUpHTMLMaster = function (node, type) {
        let obj = {
            title: "",
            allHtml: ""
        };
        if (type === "cosem") {
            return this.getCosemAttributeDescriptorCaseCosemPopUpHTML(node);
        }
        if (type === "devices") {
            return this.getCosemAttributeDescriptorCaseDevicesPopUpHTML(node);
        }
        if (type === "group") {
            return this.getCosemAttributeDescriptorCaseGroupPopUpHTML(node);
        }
        return obj;
    };
    this.getCosemAttributeDescriptorCaseCosemPopUpHTML = function (node) {
        let obj = {
            title: AppMain.t("JOB_OBJECTS", "TASK_MANAGER").toString(),
            tableHTML: ""
        };
        const self = this;
        $.each(node.CosemAttributeDescriptor, function (index, cosem) {
            if (index === 0) {
                obj.tableHTML += "<tr>";
            } else {
                if (index % 3 === 0) {
                    obj.tableHTML += "</tr><tr>";
                }
            }
            obj.tableHTML += "<td>" + self.transformObject(cosem["class-id"], cosem["instance-id"], cosem["attribute-id"]) + "</td>";
        });
        if (dividableby3is1(node)) {
            obj.tableHTML += "<td></td><td></td></tr>";
        }
        if (dividableby3is2(node)) {
            obj.tableHTML += "<td></td></tr>";
        }
        return this.getCosemAttributeDescriptorPopUpHTML(obj);
    };
    this.getCosemAttributeDescriptorCaseDevicesPopUpHTML = function (node) {
        let obj = {
            title: AppMain.t("JOB_DEVICE_REFERENCES", "TASK_MANAGER").toString(),
            tableHTML: ""
        };
        $.each(node.DeviceReference, function (index, node) {
            if (index === 0) {
                obj.tableHTML += "<tr>";
            } else {
                if (index % 3 === 0) {
                    obj.tableHTML += "</tr><tr>";
                }
            }
            obj.tableHTML += "<td>" + node._DeviceID + "</td>";
        });
        if (node.DeviceReference.length % 3 === 1) {
            obj.tableHTML += "<td></td><td></td></tr>";
        }
        if (node.DeviceReference.length % 3 === 2) {
            obj.tableHTML += "<td></td></tr>";
        }
        return this.getCosemAttributeDescriptorPopUpHTML(obj);
    };
    this.getCosemAttributeDescriptorCaseGroupPopUpHTML = function (node) {
        let obj = {
            title: AppMain.t("JOB_GROUP_REFERENCES", "TASK_MANAGER").toString(),
            tableHTML: ""
        };
        $.each(node.GroupReference, function (index, node) {
            if (index === 0) {
                obj.tableHTML += "<tr>";
            } else {
                if (index % 3 === 0) {
                    obj.tableHTML += "</tr><tr>";
                }
            }
            obj.tableHTML += "<td>" + node._GroupID + "</td>";
        });
        if (node.GroupReference.length % 3 === 1) {
            obj.tableHTML += "<td></td><td></td></tr>";
        }
        if (node.GroupReference.length % 3 === 2) {
            obj.tableHTML += "<td></td></tr>";
        }
        return this.getCosemAttributeDescriptorPopUpHTML(obj);
    };
    this.getCosemAttributeDescriptorPopUpHTML = function (obj) {
        let allHtml = "<table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
                "<thead class=\"th-color-grey text-align-left\"><tbody>";
        allHtml += obj.tableHTML;
        allHtml += "</tbody></table>";
        obj.allHtml = allHtml;
        return obj;
    };

    this.addJobNotificationsStepsHtml = function (html, position) {
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
    };
    this.addJobStepsFirsStepHtml = function (position) {
        let html = "";
        if (position === 1) {
            html += "<div class='mdl-card mdl-cell--2-col active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--2-col'>";
        }

        html += "<span class=\"mdl-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("JOB_TYPE", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        return html;
    };
    this.addJobStepsSecondStepHtml = function (position) {
        let html = "";
        if (position === 2) {
            html += "<div class='mdl-card mdl-cell--3-col active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--3-col'>";
        }

        html += "<span class=\"mdl-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("JOB_PARAMETERS", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        return html;
    };
    this.addJobStepsThirdStepHtml = function (position) {
        let html = "";
        if (position === 3) {
            html += "<div class='mdl-card mdl-cell--3-col active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--3-col'>";
        }

        html += "<span class=\"mdl-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("REFERENCE_TYPE", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        return html;
    };
    this.addJobStepsFourthStepHtml = function (position) {
        let html = "";
        if (position === 4) {
            html += "<div class='mdl-card mdl-cell--2-col active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--2-col'>";
        }

        html += "<span class=\"mdl-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("REFERENCE", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        return html;
    };
    this.addJobStepsFifthStepHtml = function (position) {
        let html = "";
        if (position === 5) {
            html += "<div class='mdl-card mdl-cell--2-col cosem active'>";
        } else {
            html += "<div class='mdl-card mdl-cell--2-col cosem'>";
        }

        html += "<span class=\"mdl-chip cosem-chip\">" +
                "<span class=\"mdl-chip__text\">" + AppMain.t("COSEM", "TASK_MANAGER") + "</span>" +
                "</span></div>";
        return html;
    };

    /**
     * helper function getting top html in add job wizard
     */
    this.addJobStepsHtml = function (position, jobType) {
        let html =
                "<div class='mdl-slider-wizard'>" +
                "<hr class='wizard-line'/>" +
                "</div>" +
                "<div class='mdl-grid wizard-chips'>" +
                "<div class='mdl-card mdl-cell--1-col'></div>";

        if (jobType === "notification") {
            this.addJobNotificationsStepsHtml(html, position);
        }
        html += this.addJobStepsFirsStepHtml(position);
        html += this.addJobStepsSecondStepHtml(position);
        html += this.addJobStepsThirdStepHtml(position);
        html += this.addJobStepsFourthStepHtml(position);
        html += this.addJobStepsFifthStepHtml(position);
        html += "" + "</div>";
        return html;
    };

    this.arrangeRepeatingInterval = function (node) {
        if (node && node.RepeatingInterval) {
            if (!defined(this.repeatValues[node.RepeatingInterval.toString()])) {
                this.repeatValues[node.RepeatingInterval.toString()] = moment.duration(node.RepeatingInterval).asMinutes() + " " + AppMain.t("MINUTES", "global");
            }
        }
    };

    this.setAddJobSecondHeader = function (node, jobType) {
        if (!(node && node.back !== true)) {
            return this.addJobStepsHtml(2, jobType);
        }
        return "";
    };

    const setResourceScheduledOrNotificationProcessNodeUndefined = function (obj, node) {
        if (node !== undefined) {
            obj.isNodeNotification = defined(node.ResourceType) && node.ResourceType.toString() === "DATA-NOTIFICATION";
        }
    };
    const isNodeActivatesSet = function (node) {
        return node.Activates && node.Activates !== "";
    };
    const isNodeRepeatingSet = function (node) {
        return node.RepeatingInterval && node.RepeatingInterval !== "";
    };
    const isNodeDurationSet = function (node) {
        return node.Duration && node.Duration !== "";
    };
    const setResourceScheduledOrNotificationProcessNodeNotNotificationPom = function (obj, node) {
        if (isNodeActivatesSet(node)) {
            obj.isNodeScheduled = true;
        }
        if (isNodeRepeatingSet(node)) {
            obj.isNodeScheduled = true;
        }
        if (isNodeDurationSet(node)) {
            obj.isNodeScheduled = true;
        }
    };
    const setResourceScheduledOrNotificationProcessNodeNotNotification = function (obj, node) {
        if (!obj.isNodeNotification && node !== undefined) {
            setResourceScheduledOrNotificationProcessNodeNotNotificationPom(obj, node);
        }
    };
    const setResourceScheduledOrNotificationProcessNodeNotification = function (obj, jobType) {
        if (jobType === "notification") {
            obj.isNodeNotification = true;
            obj.isNodeScheduled = false;
        }
    };
    const setResourceScheduledOrNotificationProcessNodeScheduled = function (obj, jobType) {
        if (jobType === "scheduled") {
            obj.isNodeNotification = false;
            obj.isNodeScheduled = true;
        }
    };
    const setResourceScheduledOrNotificationProcessNodeOnDemand = function (obj, jobType) {
        if (jobType === "on-demand") {
            obj.isNodeNotification = false;
            obj.isNodeScheduled = false;
        }
    };

    this.setResourceScheduledOrNotification = function (node, jobType) {
        let obj = {
            isNodeScheduled: false,
            isNodeNotification: false
        };
        setResourceScheduledOrNotificationProcessNodeUndefined(obj, node);
        setResourceScheduledOrNotificationProcessNodeNotNotification(obj, node);
        setResourceScheduledOrNotificationProcessNodeNotification(obj, jobType);
        setResourceScheduledOrNotificationProcessNodeScheduled(obj, jobType);
        setResourceScheduledOrNotificationProcessNodeOnDemand(obj, jobType);
        return obj;
    };

    this.setIsResourceScheduledSecondStepHtml = function (jobType, obj, startHtml, expiresHtml, repeatingHtml, duration) {
        if (jobType === "scheduled" || obj.isNodeScheduled) {
            return startHtml + expiresHtml + repeatingHtml + duration;
        }
        return "";
    };

    this.setIsResourceNotNotificationSecondStepHtml = function (jobType, obj, notOlderThanHtml, priorityHtml, asyncDataPush, replyHtml) {
        if (!(jobType === "notification" || obj.isNodeNotification)) {
            return notOlderThanHtml + priorityHtml + asyncDataPush + replyHtml;
        }
        return "";
    };

    this.setIsResourceNotificationSecondStepHtml = function (jobType, obj, asyncDataPush, replyHtml) {
        if (jobType === "notification" || obj.isNodeNotification) {
            return asyncDataPush + replyHtml;
        }
        return "";
    };

    this.getAddJobSecondTitle = function (node) {
        return (node && node.back !== true)
            ? AppMain.t("EDIT_JOB", "TASK_MANAGER")
            : AppMain.t("ADD_JOB", "TASK_MANAGER");
    };

    this.getAddJobSecondConfirmText = function (node, jobType) {
        return (node && node.back === undefined)
            ? AppMain.t("SAVE", "global")
            : jobType === "notification"
                ? AppMain.t("CREATE", "global")
                : AppMain.t("NEXT", "global");
    };

    const getInsertedPriority = function () {
        const priority = $("input[name='priority']").val();
        return priority !== ""
            ? (Number.isNaN(parseInt(priority, 10))
                ? 255
                : parseInt(priority, 10))
            : 255;
    };
    const getInsertedExpires = function () {
        const expires = $("#dateExpires").val();
        return (expires && expires !== "")
            ? moment(expires).toISOString()
            : "";
    };
    const getInsertedNotOlderThan = function () {
        const dateNotOlderThan = $("#dateNotOlderThan").val();
        return dateNotOlderThan !== ""
            ? moment(dateNotOlderThan).toISOString()
            : "";
    };
    this.getInsertedStartTime = function () {
        const startTime = $("#dateStart").val();
        return startTime !== ""
            ? moment(startTime).toISOString()
            : "";
    };
    const getInsertedDuration = function () {
        const dMinutes = parseInt($("#d-minutes").val(), 10);
        const durObj = moment.duration({
            seconds: 0,
            minutes: (Number.isNaN(dMinutes) || dMinutes < 0)
                ? 0
                : dMinutes,
            hours: 0,
            days: 0,
            months: 0,
            years: 0
        }).toISOString();
        if (moment.duration(durObj).asSeconds() === 0) {
            return "";
        }
        return durObj;
    };

    const isPriorityInRange = function (jobObj) {
        return jobObj.Priority > 255 || jobObj.Priority < 0;
    };

    this.getAddJobSecondResourceObjectNotNotification = function (jobObj, jobType, obj, CtrlActionTaskManager) {
        jobObj.Priority = getInsertedPriority();
        if (isPriorityInRange(jobObj)) {
            jobObj.Priority = 255;
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("PRIORITY_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        jobObj.Expires = getInsertedExpires();
        jobObj.NotOlderThan = getInsertedNotOlderThan();
        jobObj.AsyncReplyFlag = $("input[name=\"async-data-push\"]:checked").length > 0;
        if (jobType === "scheduled" || obj.isNodeScheduled) {
            jobObj.Activates = this.getInsertedStartTime();
            jobObj.RepeatingInterval = $("#repeating").val();
            jobObj.Duration = getInsertedDuration();
        }
    };

    this.getAddJobSecondResourceObject = function (jobType, obj, CtrlActionTaskManager) {
        let jobObj = {};
        jobObj.jobType = jobType;
        jobObj.ReplyAddress = $("input[name='reply-address']").val();
        if (jobType === "notification" || obj.isNodeNotification) {
            jobObj.AcceptDataNotification = true;
            jobObj.AsyncReplyFlag = $("input[name=\"async-data-push\"]:checked").length > 0;
        } else {
            this.getAddJobSecondResourceObjectNotNotification(jobObj, jobType, obj, CtrlActionTaskManager);
        }
        return jobObj;
    };
    const isJobObjExpiresOk = function (jobObj) { //expires > start_time
        return moment(jobObj.Expires).diff(moment(jobObj.Activates)) <= 0;
    };
    const isJobObjNotOlderThanOk = function (jobObj) {//Data Valid until > expires
        return jobObj.NotOlderThan && jobObj.NotOlderThan !== "" && moment(jobObj.NotOlderThan).diff(moment(jobObj.Expires)) <= 0;
    };
    const isJobObjDurationOk = function (jobObj) {
        return jobObj.Duration && moment.duration(jobObj.Duration).asSeconds() < 60;
    };
    const isJobObjRepeatingOK = function (jobObj) {
        return jobObj.RepeatingInterval && moment.duration(jobObj.RepeatingInterval).asSeconds() < 60;
    };
    this.checkAddJobSecondManageAddRulesPom5 = function (jobObj, CtrlActionTaskManager) {
        // manage add rules
        if (isJobObjExpiresOk(jobObj)) { //expires > start_time
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("EXPIRES_START_TIME_GREATER_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        if (isJobObjNotOlderThanOk(jobObj)) { //Data Valid until > expires
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("EXPIRES_DATA_VALID_GREATER_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return true;
    };
    this.checkAddJobSecondManageAddRulesPom4 = function (jobObj, CtrlActionTaskManager) {
        // manage add rules
        if (jobObj.Expires && jobObj.Expires !== "") {
            return this.checkAddJobSecondManageAddRulesPom5(jobObj, CtrlActionTaskManager);
        }
        return true;
    };
    this.checkAddJobSecondManageAddRulesPom3 = function (jobObj, CtrlActionTaskManager) {
        // manage add rules
        if (!this.checkAddJobSecondManageAddRulesPom4(jobObj, CtrlActionTaskManager)) {
            return false;
        }
        if (isJobObjDurationOk(jobObj)) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("DURATION_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        if (isJobObjRepeatingOK(jobObj)) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("REPEATING_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return true;
    };
    this.checkAddJobSecondManageAddRulesPom2 = function (jobObj, CtrlActionTaskManager) {
        // manage add rules
        if (jobObj.Activates === "") {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("START_TIME_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return this.checkAddJobSecondManageAddRulesPom3(jobObj, CtrlActionTaskManager);
    };
    this.checkAddJobSecondManageAddRulesPom = function (jobObj, jobType, CtrlActionTaskManager) {
        // manage add rules
        let re = new RegExp("^[a-zA-Z\\d\\-:\/_.]+$");
        if (jobObj.ReplyAddress && !re.test(jobObj.ReplyAddress)) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("PUSH_DEST_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        if (jobType === "scheduled") {
            return this.checkAddJobSecondManageAddRulesPom2(jobObj, CtrlActionTaskManager);
        }
        return true;
    };
    this.checkAddJobSecondManageAddRules = function (jobObj, jobType, CtrlActionTaskManager) {
        // manage add rules
        if (jobObj.NotOlderThan && jobObj.NotOlderThan !== "" && moment(jobObj.NotOlderThan).diff(moment()) <= 0) {
            // Data Valid until  > current
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("DATA_VALID_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return this.checkAddJobSecondManageAddRulesPom(jobObj, jobType, CtrlActionTaskManager);
    };

    this.getAddCosemHTMLForOnDemandPom = function (jobService, typeSelector, valueInput, timeSelRowHtml) {
        if (jobService === "set") {
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        }
        if (jobService === "time-sync") {
            return timeSelRowHtml;
        }
    };
    this.getAddCosemHTMLForOnDemand = function (jobService, accessSelRowHtml, attrLabel, typeSelector, valueInput, timeSelRowHtml) {
        if (jobService === "get") {
            return accessSelRowHtml;
        }
        if (jobService === "action") {
            attrLabel.html(AppMain.t("METHOD_ID", "TASK_MANAGER") + " *");
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        }
        return this.getAddCosemHTMLForOnDemandPom(jobService, typeSelector, valueInput, timeSelRowHtml);
    };
    this.getAddCosemHTMLForScheduledPom = function (jobService, typeSelector, valueInput, timeSelRowHtml) {
        if (jobService === "set") {
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        }
        if (jobService === "time-sync") {
            return timeSelRowHtml;
        }
    };

    this.getAddCosemHTMLForScheduled = function (jobService, repeatingSelector, attrLabel, typeSelector, valueInput, timeSelRowHtml) {
        if (jobService === "get") {
            return repeatingSelector;
        }
        if (jobService === "action") {
            attrLabel.html(AppMain.t("METHOD_ID", "TASK_MANAGER") + " *");
            return typeSelector + "<span style='margin-left: 15px'>" + valueInput + "</span>";
        }
        return this.getAddCosemHTMLForScheduledPom(jobService, typeSelector, valueInput, timeSelRowHtml);
    };
    this.varTypeOnchangeForJustNumberCheck = function (varType, varVal) {
        if (justNumberVarTypeValues.indexOf(varType.val()) !== -1) {
            varVal.addClass("just-number");
        } else {
            varVal.removeClass("just-number");
        }
        if (varVal.hasClass("just-number")) {
            const nonNumReg = /[^0-9]/g;
            varVal.val(varVal.val().replace(nonNumReg, ""));
        }
    };
    this.initListForCheckDesc = function (service, objectList) {
        let list = [];
        switch (service) {
        case "get":
            list = objectList.get;
            break;
        case "time-sync":
            list = objectList.timeSync;
            break;
        }
        return list;
    };
    this.checkDescRelativeSelector = function (classId, attrId, instanceId) {
        if (classId === 7 && attrId === 2) {
            if (instanceId === "1.0.99.1.0.0") {
                $("#relative-selector").val("FFFDFFFF07FFFFFFFFFFFFFF");
            } else {
                $("#relative-selector").val("FFFDFFFF1EFFFFFFFFFFFFFF");
            }
        }
    };

    this.restObjSetStartEndTimeAndLastValidData = function (restObj, getDataObj) {
        if (getDataObj.startTime) {
            restObj["mes:Payload"]["mes:StartTime"] = getDataObj.startTime;
        }
        if (getDataObj.endTime) {
            restObj["mes:Payload"]["mes:EndTime"] = getDataObj.endTime;
        }
        if (getDataObj.lastValidData) {
            restObj["mes:Payload"]["mes:LastValidData"] = "true";
        }
    };
    this.restObjSetDeviceAndGroupReference = function (restObj, getDataObj) {
        if (getDataObj.deviceReference.length > 0) {
            restObj["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:DeviceReference"] = getDataObj.deviceReference;
        }
        if (getDataObj.groupReference > 0) {
            restObj["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:GroupReference"] = getDataObj.deviceReference;
        }
    };
    const getDataPopUpReferenceTableHeader = function (node) {
        if (node.DeviceReference) {
            return "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("DEVICE_TITLE", "TASK_MANAGER") + "</th>";
        }
        return "<th class=\"mdl-data-table__cell--non-numeric\">" + AppMain.t("GROUP_ID", "TASK_MANAGER") + "</th>";
    };
    const getDataPopUpReferenceDevicePart = function (node) {
        let allHtml = "";
        if (!node.DeviceReference.length) {
            node.DeviceReference = [node.DeviceReference];
        }
        $.each(node.DeviceReference, function (ignore, title) {
            allHtml += "<tr>";
            allHtml += "<td><input type='checkbox' name='selectTitle' class='selectTitle' data-node-title='" + title._DeviceID + "'/></td>";
            allHtml += "<td class='deviceTitleTxT'>" + title._DeviceID + "</td>" + "</tr>";
        });
        return allHtml;
    };
    const getDataPopUpReferenceGroupPart = function (node) {
        let allHtml = "";
        if (!node.GroupReference.length) {
            node.GroupReference = [node.GroupReference];
        }
        $.each(node.GroupReference, function (ignore, title) {
            allHtml += "<tr>";
            allHtml += "<td><input type='checkbox' name='selectTitle' class='selectTitle' data-node-title='" + title._GroupID + "'/></td>";
            allHtml += "<td class='deviceTitleTxT'>" + title._GroupID + "</td>" + "</tr>";
        });
        return allHtml;
    };
    this.getDataPopUpReferenceHtml = function (node) {
        let allHtml = "";
        if (node.DeviceReference || node.GroupReference) {
            allHtml += "<table id='devices-table' class=\"mdl-data-table mdl-js-data-table table-no-borders\" style=\"width: 100%\">" +
                    "<thead class=\"th-color-grey text-align-left\">" +
                    "<tr>" +
                    "<th style='width: 30px;padding-left: 18px'><input class=\"selectAllTitles\" name=\"selectAllTitles\" type=\"checkbox\"/></th>";
            allHtml += getDataPopUpReferenceTableHeader(node);
            allHtml += "</tr>" + "</thead><tbody>";

            if (node.DeviceReference) {
                allHtml += getDataPopUpReferenceDevicePart(node);
            } else {
                allHtml += getDataPopUpReferenceGroupPart(node);
            }
            allHtml += "</table>";
        }
        return allHtml;
    };
    this.addAttrPressGetInsertedDescTXTForGet = function (descVal, objectList) {
        return (defined(descVal) && descVal !== "0" && descVal !== "")
            ? objectList.get[parseInt(descVal, 10) - 1].description
            : "---";
    };
    this.addAttrPressGetInsertedDescTXTForTimeSynchro = function (descVal, objectList) {
        return (defined(descVal) && descVal !== "0" && descVal !== "")
            ? objectList.timeSync[parseInt(descVal, 10) - 1].description
            : "---";
    };
    this.addAttrPressGetInsertedDescTXT = function (objectList) {
        const descVal = $("#job-object").val();
        const service = $("#job-service").val();
        let descTXT = "---";
        if (service === "get") {
            descTXT = this.addAttrPressGetInsertedDescTXTForGet(descVal, objectList);
        }
        if (service === "time-sync") {
            descTXT = this.addAttrPressGetInsertedDescTXTForTimeSynchro(descVal, objectList);
        }
        return descTXT;
    };

    this.addAttrPressCheckDataIsOkInstaID1 = function (instaID1, CtrlActionTaskManager) {
        if (Number.isNaN(instaID1) || instaID1 < 0 || instaID1 > 255) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("ATTRIBUTE_ID_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return true;
    };
    this.addAttrPressCheckDataIsOkClassId = function (classID, CtrlActionTaskManager) {
        if (Number.isNaN(classID) || classID < 0 || classID > 65536) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("CLASS_ID_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return true;
    };
    this.addAttrPressCheckDataIsOkAttrID = function (attrID, CtrlActionTaskManager) {
        if (Number.isNaN(attrID) || attrID < 0 || attrID > 127) {
            CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                    AppMain.t("ATTRIBUTE_ID_ERROR_TXT", "TASK_MANAGER"));
            return false;
        }
        return true;
    };
    this.addAttrPressCheckAccessFromAndToIsAccessSelection = function (accessFrom, accessTo, CtrlActionTaskManager) {
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
        return true;
    };
    this.isAtttrPressCheckIsAccess = function (accessFrom, accessTo) {
        return (accessFrom && accessFrom !== "") || (accessTo && accessTo !== "");
    };
    this.addAttrPressCheckAccessFromAndTo = function (accessFrom, accessTo, CtrlActionTaskManager) {
        if (this.isAtttrPressCheckIsAccess(accessFrom, accessTo)) {// isAccessSel
            return this.addAttrPressCheckAccessFromAndToIsAccessSelection(accessFrom, accessTo, CtrlActionTaskManager);
        }
        return true;
    };
    this.isTimeSynchroCheckValues = function (minDiffInt, maxDiffInt) {
        return !Number.isNaN(minDiffInt) && !Number.isNaN(maxDiffInt) && minDiffInt > maxDiffInt;
    };
    this.addAttrPressCheckAccessMinDiffMaxDiff = function (minDiff, maxDiff, CtrlActionTaskManager) {
        if (minDiff !== "" || maxDiff !== "") {
            const minDiffInt = Number.parseInt(minDiff, 10);
            const maxDiffInt = Number.parseInt(maxDiff, 10);
            if (this.isTimeSynchroCheckValues(minDiffInt, maxDiffInt)) {
                CtrlActionTaskManager.importAlert(AppMain.t("ADD_JOB_COSEM_PARAMETER_ERROR_TITLE_TXT", "TASK_MANAGER"),
                        AppMain.t("MAXMINDIF_ERROR_TXT", "TASK_MANAGER"));
                return false;
            }
        }
        return true;
    };
    this.addAttrPressCheckDataIsOkPom3 = function (addObj, CtrlActionTaskManager) {
        return this.addAttrPressCheckAccessMinDiffMaxDiff(addObj.minDiff, addObj.maxDiff, CtrlActionTaskManager);
    };
    this.addAttrPressCheckDataIsOkPom2 = function (addObj, CtrlActionTaskManager) {
        return this.addAttrPressCheckDataIsOkInstaID1(addObj.instaID6, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkAttrID(addObj.attrID, CtrlActionTaskManager) &&
                this.addAttrPressCheckAccessFromAndTo(addObj.accessFrom, addObj.accessTo, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkPom3(addObj, CtrlActionTaskManager);
    };
    this.addAttrPressCheckDataIsOkPom1 = function (addObj, CtrlActionTaskManager) {
        return this.addAttrPressCheckDataIsOkInstaID1(addObj.instaID3, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkInstaID1(addObj.instaID4, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkInstaID1(addObj.instaID5, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkPom2(addObj, CtrlActionTaskManager);
    };
    this.addAttrPressCheckDataIsOk = function (addObj, CtrlActionTaskManager) {
        return this.addAttrPressCheckDataIsOkClassId(addObj.classID, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkInstaID1(addObj.instaID1, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkInstaID1(addObj.instaID2, CtrlActionTaskManager) &&
                this.addAttrPressCheckDataIsOkPom1(addObj, CtrlActionTaskManager);
    };
    this.updateInstaIDstring = function (instaIDString) {
        if (instaIDString.toString(16).length === 2) {
            return instaIDString.toString(16);
        }
        return "0" + instaIDString.toString(16);
    };
    this.addAttrPressGetAccessFrom = function () {
        let accessFrom = $("#add-access-from").val();
        return (defined(accessFrom) && accessFrom !== "")
            ? moment(accessFrom).toISOString()
            : "";
    };
    this.addAttrPressGetRelAccessFrom = function () {
        let relAccessFrom = $("#relative-selector").val();
        return (defined(relAccessFrom) && relAccessFrom !== "0")
            ? relAccessFrom
            : "";
    };
    this.addAttrPressGetRelAccessTo = function (relAccessFrom) {
        if (relAccessFrom && relAccessFrom !== "") { // is relative access sel
            return "FFFEFFFFFFFFFFFFFFFFFFFF";
        }
        return "";
    };
    this.isTimeSynchro = function (maxDiffInt, minDiffInt) {
        return !Number.isNaN(maxDiffInt) || !Number.isNaN(minDiffInt);
    };
    this.addAttrPressGetMaxMindif = function (addObj) {
        const maxDiffInt = parseInt($("#max-time-diff").val(), 10);
        addObj.maxDiff = "";
        const minDiffInt = parseInt($("#min-time-diff").val(), 10);
        addObj.minDiff = "";
        if (this.isTimeSynchro(maxDiffInt, minDiffInt)) { //is time sync
            if (!Number.isNaN(maxDiffInt)) {
                addObj.maxDiff = maxDiffInt + "";
            }
            if (!Number.isNaN(minDiffInt)) {
                addObj.minDiff = minDiffInt + "";
            }
        }
    };
    this.addAttrPressGetVarTypeAndValue = function (addObj) {
        addObj.varType = "";
        addObj.varValue = "";
        addObj.vType = $("#variable-type");
        if (addObj.vType.length) {
            addObj.varType = addObj.vType.val();
            addObj.varValue = $("#variable-value").val();
        }
    };
    this.addAttrPressGetAccessTo = function () {
        let accessTo = $("#add-access-to").val();
        return (defined(accessTo) && accessTo !== "")
            ? moment(accessTo).toISOString()
            : "";
    };

    this.hasResourceAccessFromTo = function (attrObj) {
        return (attrObj.accessFrom && attrObj.accessFrom !== "") || (attrObj.accessTo && attrObj.accessTo !== "");
    };
    this.hasResourceRelativeAccessFromTo = function (attrObj) {
        return attrObj.relAccessFrom && attrObj.relAccessFrom !== "";
    };
    this.hasResourceMinMaxDiff = function (attrObj) {
        return (attrObj.maxDiff !== "") || (attrObj.minDiff !== "");
    };
    this.hasResourceAsyncReplyFlagForAddJson = function (resource) {
        return resource.AsyncReplyFlag && resource.AsyncReplyFlag !== "";
    };
    this.hasResourceReplyAddForAddJson = function (resource) {
        return resource.ReplyAddress && resource.ReplyAddress !== "";
    };
    this.initializeAddJson = function (isEdit, resource) {
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
        if (this.hasResourceAsyncReplyFlagForAddJson(resource)) {
            addJson["mes:Header"]["mes:AsyncReplyFlag"] = resource.AsyncReplyFlag;
        }
        if (this.hasResourceReplyAddForAddJson(resource)) {
            addJson["mes:Header"]["mes:ReplyAddress"] = resource.ReplyAddress;
        }
        return addJson;
    };
    this.hasAddJsonDevices = function (resource) {
        return resource.devices && resource.devices.length > 0;
    };
    this.hasAddJsonGroups = function (resource) {
        return resource.groups && resource.groups.length > 0;
    };
    this.updateAddJsonReferences = function (addJson, resource) {
        if (this.hasAddJsonDevices(resource)) {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"] = {};
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:DeviceReference"] = [];
            $.each(resource.devices, function (ignore, elm) {
                addJson["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:DeviceReference"].push({
                    "_DeviceID": elm
                });
            });
        } else {
            if (this.hasAddJsonGroups(resource)) {
                addJson["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"] = {};
                addJson["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:GroupReference"] = [];
                $.each(resource.groups, function (ignore, elm) {
                    addJson["mes:Payload"]["mes:DeviceAccess"]["dev:DevicesReferenceList"]["dev:GroupReference"].push({
                        "_GroupID": elm
                    });
                });
            }
        }
    };
    this.updateAddJsonCosemAccessListUpdateMinMaxDif = function (obj, elm) {
        if (elm.cMinDiff) {
            obj["dev:CosemAccessDescriptor"]["dev:CosemTimeSync"]["dev:min-time-diff"] = elm.cMinDiff;
        }
        if (elm.cMaxDiff) {
            obj["dev:CosemAccessDescriptor"]["dev:CosemTimeSync"]["dev:max-time-diff"] = elm.cMaxDiff;
        }
    };
    this.cosemAttributeDescriptorHasAccessFromOrTo = function (elm) {
        return defined(elm.cAccessFrom) && elm.cAccessFrom !== "" && defined(elm.cAccessTo) && elm.cAccessTo !== "";
    };
    this.cosemAttributeDescriptorHasRelAccessFromOrTo = function (elm) {
        return defined(elm.cRelAccessFrom) && elm.cRelAccessFrom !== "" && defined(elm.cRelAccessTo) && elm.cRelAccessTo !== "";
    };
    this.getCosemAttributeDescriptorForUpgradeAccessUpdate = function (obj, elm) {
        if (this.cosemAttributeDescriptorHasAccessFromOrTo(elm)) {
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
    };
    this.getCosemAttributeDescriptorForUpgradeRelAccessUpdate = function (obj, elm) {
        if (this.cosemAttributeDescriptorHasRelAccessFromOrTo(elm)) {
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
    };
    this.getCosemAttributeDescriptorForUpgrade = function (resource, elm) {
        let obj = {};
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
            this.getCosemAttributeDescriptorForUpgradeAccessUpdate(obj, elm);
            this.getCosemAttributeDescriptorForUpgradeRelAccessUpdate(obj, elm);
        }
        return obj;
    };
    this.getCosemAttributeDescriptorForNotTimeSyncro = function (resource, elm) {
        let obj = {};
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
                obj["dev:CosemAccessDescriptor"]["dev:CosemXDLMSDescriptor"]["cos:action-request"]["cos:action-request-normal"]["cos:method-invocation-parameters"][elm.cVarType] = elm.cVarValue;
            } else {
                obj = this.getCosemAttributeDescriptorForUpgrade(resource, elm);
            }
        }
        return obj;
    };
    this.updateAddJsonCosemAccessList = function (addJson, resource) {
        if (resource.jobType !== "notification") {  //cosem access list
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:CosemAccessList"] = {};
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:CosemAccessList"]["dev:CosemAccess"] = [];
            const self = this;
            $.each(resource.attrs, function (ignore, elm) {
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
                    self.updateAddJsonCosemAccessListUpdateMinMaxDif(obj, elm);
                    addJson["mes:Payload"]["mes:DeviceAccess"]["dev:CosemAccessList"]["dev:CosemAccess"].push(obj);

                } else {
                    obj = self.getCosemAttributeDescriptorForNotTimeSyncro(resource, elm);
                    addJson["mes:Payload"]["mes:DeviceAccess"]["dev:CosemAccessList"]["dev:CosemAccess"].push(obj);
                }
            });
        }
    };
    this.updateAddJsonPriority = function (addJson, resource) {
        if (defined(resource.Priority)) {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:Priority"] = resource.Priority;
        }
    };
    this.updateAddJsonExpires = function (addJson, resource) {
        if (resource.Expires && resource.Expires !== "") {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:Expires"] = resource.Expires;
        }
    };
    this.updateAddJsonNotOlderThan = function (addJson, resource) {
        if (resource.NotOlderThan && resource.NotOlderThan !== "") {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:NotOlderThan"] = resource.NotOlderThan;
        }
    };
    this.updateAddJsonAcceptDataNotification = function (addJson, resource) {
        if (resource.AcceptDataNotification && resource.AcceptDataNotification !== "") {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:AcceptDataNotification"] = resource.AcceptDataNotification;
        }
    };
    this.updateAddJsonActivates = function (addJson, resource) {
        if (resource.Activates && resource.Activates !== "") {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:Activates"] = resource.Activates;
        }
    };
    this.updateAddJsonRepeatinginterval = function (addJson, resource) {
        if (resource.RepeatingInterval && resource.RepeatingInterval !== "") {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:RepeatingInterval"] = resource.RepeatingInterval;
        }
    };
    this.updateAddJsonDuration = function (addJson, resource) {
        if (resource.Duration && resource.Duration !== "") {
            addJson["mes:Payload"]["mes:DeviceAccess"]["dev:Duration"] = resource.Duration;
        }
    };
    this.selectAllNodesOnClickSetup = function () {
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
    };
    this.addAttrHtmlHasResourceForMinMaxDif = function (attrObj) {
        let devHtml = "";
        if (this.hasResourceMinMaxDiff(attrObj)) {
            devHtml += "<td colspan='2'>" + AppMain.t("MAX_TIME_DIFF", "TASK_MANAGER") + ": " + attrObj.maxDiff + " <br/> "
                    + AppMain.t("MIN_TIME_DIFF", "TASK_MANAGER") + ": " + attrObj.minDiff + "</td>";
        } else {
            if (attrObj.vType.length) {
                devHtml += "<td colspan='2'>" + this.typeSelector[`${attrObj.varType}`] + "(" + attrObj.varValue + ")</td>";
            } else {
                devHtml += "<td></td>";
            }
        }
        return devHtml;
    };
    this.addAttrHtmlHasResource = function (attrObj) {
        let devHtml = "";
        if (this.hasResourceRelativeAccessFromTo(attrObj)) {
            devHtml += "<td colspan='2'>" + this.relativeSelector[`${attrObj.relAccessFrom}`] + "</td>";
        } else {
            this.addAttrHtmlHasResourceForMinMaxDif(attrObj);
        }
        return devHtml;
    };
};