/**
 * @class CtrlActionEvents Controller action using IControllerAction interface.
 */
/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionEvents = Object.create(new modulecontrolleraction.IControllerAction());
const modulecomeventform = require("./ComEventForm");
const moment = require("moment");
const build = require("../build.info");
const includesevents = require("./includes/events.js");
const download = require("./vendor/download.js");

/**
 * Current event log list
 * @type Array
 */
CtrlActionEvents.eventsData = [];

CtrlActionEvents.exec = function () {
    "use strict";

    this.view.setTitle("EVENTS");
    // Components ref: CEventForm
    if (!defined(this.CEventForm)) {
        this.CEventForm = modulecomeventform.ComEventForm;
    }

    let events = {
        htmlList: "",
        data: {}
    };

    const allEventList = defined(includesevents.events)
        ? includesevents.events
        : [];
    this.eventListMap = {};
    $.each(allEventList, function (i, item) {
        CtrlActionEvents.eventListMap[item.enumeration] = item.severity;
    });
    this.eventListIDMap = {};
    $.each(allEventList, function (i, item) {
        CtrlActionEvents.eventListIDMap[item.enumeration] = item.id;
    });

    // Default render
    this.view.renderEmpty("Events", {
        title: AppMain.t("EVENT_LOGS", "EVENTS"),
        events: events,
        thID: AppMain.t("EVENT_NAME", "EVENTS"),
        thIP: AppMain.t("IP_ADDRESS", "EVENTS"),
        thTimestamp: AppMain.t("TIMESTAMP", "EVENTS"),
        thSeverity: AppMain.t("SEVERITY", "EVENTS"),
        dateFrom: AppMain.t("DATE_FROM", "EVENTS"),
        dateTo: AppMain.t("DATE_TO", "EVENTS"),
        formApply: AppMain.t("APPLY", "global"),
        formSelectType: AppMain.t("EVT_LOG_TYPE", "EVENTS"),
        labels: {
            btnExport: AppMain.t("EXPORT_EVT_LIST", "EVENTS")
        }
    });
    this.CEventForm.init();

    let to = this.CEventForm.data("dateTo");
    if (to === "---") {
        to = moment().add(1, "days").format(AppMain.localization("DATE_FORMAT") + " 00:00:00");
    }

    let response = AppMain.ws().exec("GetEventLog", {
        "EventTypeSelector": this.CEventForm.data("eventType"),
        "time-stamp-selector": {
            "from-time": moment(moment(this.CEventForm.data("dateFrom"), AppMain.localization("DATETIME_FORMAT")).toISOString()).unix(),
            "to-time": moment(moment(to, AppMain.localization("DATETIME_FORMAT")).toISOString()).unix()
        }
    }).getResponse(false);
    response = response.GetEventLogResponse;

    // Response events must always be array of events
    if (defined(response) && defined(response.event) && Object.prototype.toString.call(response.event) === "[object Array]") {
        events.data = response.event;
    } else {
        if (defined(response) && defined(response.event) && defined(response.event.id)) {
            events.data = [response.event];
        } else {
            events.data = [];
        }
    }

    // Store events for availability inside action module
    CtrlActionEvents.eventsData = events.data;
    events.data.reverse();

    if (events.data.length > 0) {
        $.each(events.data, function (i, item) {
            events.htmlList += "<tr data-bind-event='click' data-bind-method='CtrlActionEvents.getEventCounters' data-event-id='" + item.id + "'>";
            events.htmlList += "<td class='name' style=\"text-align: left!important;\">" + AppMain.t(item.id, "EVENTS") + "</td>";
            events.htmlList += "<td class='id' style=\"text-align: left!important;\">" + CtrlActionEvents.eventListIDMap[item.id] + "</td>";
            events.htmlList += "<td class='severity  triangle-topleft-" + CtrlActionEvents.eventListMap[item.id] + "'" +
                    " style=\"text-align: left!important;\">" + AppMain.t(CtrlActionEvents.eventListMap[item.id], "EVENTS") + "</td>";
            events.htmlList += "<td class='date' style=\"text-align: left!important;\">" + moment(item["time-stamp-iso"]).format(AppMain.localization("DATETIME_FORMAT")) + "</td>";
            events.htmlList += "<td class='system-title' style=\"text-align: left!important;\">" + (defined(item["system-title"])
                ? item["system-title"]
                : "---") + "</td>";
            events.htmlList += "<td class='mac' style=\"text-align: left!important;\">" + (defined(item["mac-address"])
                ? item["mac-address"]
                : "---") + "</td>";
            // events.htmlList += "<td class='ip' style=\"text-align: left!important;\">" + (defined(item["ip-address"]) ? item["ip-address"] : "---") + "</td>";
            events.htmlList += "<td class='ip' style=\"text-align: left!important;\">" + (defined(item["ip-address"])
                ? item["ip-address"] + " "
                : "") + (defined(item["info-message"])
                ? item["info-message"]
                : "---") + "</td>";
            events.htmlList += "</tr>";
        });
    } else {
        events.htmlList += "<tr><td colspan='4'><p style='text-align:center'>" + AppMain.t("NO_EVT_FOUND", "EVENTS") + "</p></td></tr>";
    }

    this.view.render("Events", {
        title: AppMain.t("EVENT_LOGS", "EVENTS"),
        events: events,
        thID: AppMain.t("EVENT_NAME", "EVENTS"),
        thIDCol: AppMain.t("EVENT_ID", "EVENTS"),
        thEventInfo: AppMain.t("EVT_INFO", "EVENTS"),
        thMacAddress: AppMain.t("MAC_ADDRESS", "EVENTS"),
        thDeviceTitle: AppMain.t("DEVICE_TITLE", "EVENTS"),
        thSeverity: AppMain.t("SEVERITY", "EVENTS"),
        thTimestamp: AppMain.t("TIMESTAMP", "EVENTS"),
        dateFrom: AppMain.t("DATE_FROM", "EVENTS"),
        dateTo: AppMain.t("DATE_TO", "EVENTS"),
        formApply: AppMain.t("APPLY", "global"),
        formSelectType: AppMain.t("EVT_LOG_TYPE", "EVENTS"),
        totalResults: defined(events.data.length)
            ? AppMain.t("SHOWING_TOTAL", "EVENTS") + "<span id='total-count'>" + events.data.length + "</span>"
            : "",
        formSelectTypeOptions: CtrlActionEvents.getEventLogTypesSelectOptions(),
        labels: {
            btnExport: AppMain.t("EXPORT_EVT", "EVENTS"),
            filter: AppMain.t("FILTER", "global")
        }
    });

    // Init component after view is ready
    this.CEventForm.totalResults = events.data.length;
    this.CEventForm.init();

    this.initSelectForMac();
    const tableOptions = {
        valueNames: ["name", "id", "severity", "ip", "system-title", "mac", "date"]
    };
    this.initTable("eventList", "eventListWrap", tableOptions);
};

CtrlActionEvents.getEventCounters = function (e) {
    "use strict";

    const $this = $(e.target);
    const selectedEvent = $this.attr("data-event-id");

    const cnt = AppMain.ws().exec("GetEventCounter", {
        eventName: selectedEvent
    }).getResponse(false);

    if (defined(cnt.GetEventCounterResponse.EventCount) && !$this.attr("data-opened")) {
        let html = "<tr class='row-details'>";
        html += "<td colspan='2'>" + AppMain.t("COUNT", "EVENTS") + ": " + cnt.GetEventCounterResponse.EventCount.count + "</td>";
        html += "<td colspan='2'>" + AppMain.t("LAST_OCC", "EVENTS") + ": " +
                moment(cnt.GetEventCounterResponse.EventCount["last-accur"]).format(AppMain.localization("DATETIME_FORMAT")) + "</td>";
        html += "<td colspan='3'></td>";
        html += "</tr>";
        $this.after(html);
        $this.attr("data-opened", 1);
    } else {
        if ($this.attr("data-opened") === "1") {
            $this.removeAttr("data-opened");
            $this.next().remove();
        }
    }
};

CtrlActionEvents.exportEventsList = function () {
    "use strict";

    let csv = "";
    if (CtrlActionEvents.eventsData.length > 0) {
        csv = "SEP=,\r\n";
        csv += "\"" + AppMain.t("EVENT_NAME", "EVENTS") + "\",";
        csv += "\"" + AppMain.t("EVENT_ID", "EVENTS") + "\",";
        csv += "\"" + AppMain.t("SEVERITY", "EVENTS") + "\",";
        csv += "\"" + AppMain.t("TIMESTAMP", "EVENTS") + "\",";
        csv += "\"" + AppMain.t("DEVICE_TITLE", "EVENTS") + "\",";
        csv += "\"" + AppMain.t("MAC_ADDRESS", "EVENTS") + "\",";
        csv += "\"" + AppMain.t("EVT_INFO", "EVENTS") + "\"";
        csv += "\r\n";

        $(CtrlActionEvents.eventsData).each(function (i, evt) {
            csv += "\"" + (defined(evt.id)
                ? AppMain.t(evt.id, "EVENTS")
                : "") + "\",";
            csv += "\"" + (defined(evt.id)
                ? CtrlActionEvents.eventListIDMap[evt.id]
                : "") + "\",";
            csv += "\"" + (defined(evt.id)
                ? AppMain.t(CtrlActionEvents.eventListMap[evt.id], "EVENTS")
                : "") + "\",";
            csv += "\"" + (defined(evt["time-stamp-iso"])
                ? evt["time-stamp-iso"]
                : "") + "\",";
            csv += "\"" + (defined(evt["system-title"])
                ? evt["system-title"]
                : "") + "\",";
            csv += "\"" + (defined(evt["mac-address"])
                ? evt["mac-address"]
                : "") + "\",";
            csv += "\"" + (defined(evt["ip-address"])
                ? evt["ip-address"] + " "
                : "") + (defined(evt["info-message"])
                ? evt["info-message"]
                : "---") + "\"";
            csv += "\r\n";
        });

        AppMain.dialog("CSV_CREATED_EVENT_LOG", "success");
        download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_EventLogs_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
    } else {
        AppMain.dialog("CSV_NOT_CREATED_EVENT_LOG", "warning");
    }
};

/**
 * Get event log types.
 * @return Object
 */
CtrlActionEvents.getEventLogTypes = function () {
    "use strict";
    return {
        "EVT-STANDARD": AppMain.t("STANDARD_EVT_LOG", "EVENTS"),
        "EVT-COMMUNICATION-PLC": AppMain.t("PLC_COMM_LOG", "EVENTS"),
        "EVT-COMMUNICATION-WAN": AppMain.t("WAN_COMM_LOG", "EVENTS"),
        "EVT-POWER-FAIL": AppMain.t("POWER_FAIL_EVT_LOG", "EVENTS"),
        "EVT-SECURITY": AppMain.t("SEC_EVT_LOG", "EVENTS"),
        "EVT-CRITICAL": AppMain.t("SERVICE_EVT_LOG", "EVENTS"),
        "EVT-RS485": AppMain.t("RS485_LOG", "EVENTS"),
        "EVT-JOB-STATUS": AppMain.t("JOB_STATUS", "EVENTS"),
        "EVT-METER-STATUS": AppMain.t("METER_STATUS", "EVENTS")
    };
};

/**
 * Get select menu options for event log type.
 * @return String
 */
CtrlActionEvents.getEventLogTypesSelectOptions = function () {
    "use strict";
    let html = "";
    const options = CtrlActionEvents.getEventLogTypes();
    $.each(options, function (type, value) {
        html += "<option value=\"" + type + "\">" + value + "</option>";
    });
    return html;
};

CtrlActionEvents.eventCounter = {};
module.exports.CtrlActionEvents = CtrlActionEvents;