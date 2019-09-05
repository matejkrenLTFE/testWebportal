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
    const getInsertedStartTime = function () {
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
            jobObj.Activates = getInsertedStartTime();
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
};