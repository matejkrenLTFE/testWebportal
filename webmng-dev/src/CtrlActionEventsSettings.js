/**
 * @class CtrlActionEventsSettings Controller action using IControllerAction interface.
 */
/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionEventsSettings = Object.create(new modulecontrolleraction.IControllerAction());
const includesevents = require("./includes/events.js");

CtrlActionEventsSettings.initEvents = function () {
    "use strict";
    return defined(includesevents.events)
        ? includesevents.events
        : [];
};

CtrlActionEventsSettings.initHesURL = function (selectedEventList) {
    "use strict";
    return (defined(selectedEventList.GetParametersResponse) && defined(selectedEventList.GetParametersResponse.cntr))
        ? selectedEventList.GetParametersResponse.cntr["alrm-alarm-destination-url"]
        : "";
};

CtrlActionEventsSettings.updateSelectedEventList = function (selectedEventList) {
    "use strict";
    return (defined(selectedEventList.GetParametersResponse) && defined(selectedEventList.GetParametersResponse.cntr)
            && defined(selectedEventList.GetParametersResponse.cntr["forward-to-hes-list"]) &&
            defined(selectedEventList.GetParametersResponse.cntr["forward-to-hes-list"].event))
        ? AppMain.ws().getResponseElementAsArray(selectedEventList.GetParametersResponse.cntr["forward-to-hes-list"].event)
        : [];
};

CtrlActionEventsSettings.exec = function () {
    "use strict";
    this.view.setTitle("ALARM_EVENTS");

    const allEventList = this.initEvents();

    let selectedEventList = AppMain.ws().exec("GetParameters", {"cntr": ""}).getResponse(false);

    const hesUrl = this.initHesURL(selectedEventList);

    selectedEventList = this.updateSelectedEventList(selectedEventList);

    this.view.render(this.controller.action, {
        title: AppMain.t("SETTINGS", "ALARM_EVENTS"),
        params: {
            tbody: this.htmlTableBody(allEventList, selectedEventList, "event"),
            hesUrl: hesUrl
        },
        labels: {
            apply: AppMain.t("APPLY", "global"),
            applyHes: AppMain.t("APPLY", "global"),
            eventName: AppMain.t("EVT_NAME", "ALARM_EVENTS"),
            eventID: AppMain.t("EVENT_ID", "EVENTS"),
            hesURL: AppMain.t("HES_URL", "ALARM_EVENTS"),
            eventDesc: AppMain.t("EVT_DESC", "ALARM_EVENTS"),
            enabled: AppMain.t("ENABLED", "global"),
            instructions: AppMain.t("THIS_SET_PAGE_TO_HES", "ALARM_EVENTS")
        }
    });

    setTimeout(function () {
        $(".alarm-settings-switch input").on("click", function () {
            const elm = $(".alarm-settings-switch input[type='hidden'][name='" + $(this).attr("name") + "']");
            if (elm.val() === "true") {
                elm.val("false");
            } else {
                elm.val("true");
            }
        });
    }, 300);
    AppMain.html.updateAllElements();
};

CtrlActionEventsSettings.htmlTableBody = function (eventList, selectedEventList) {
    "use strict";

    let html = "";
    eventList.forEach(function (elm) {
        let checked = false;

        // Find checked events
        selectedEventList.forEach(function (checkedElm) {
            if (elm.enumeration === checkedElm) {
                checked = true;
            }
        });

        html += "<tr>";
        html += "<td style='width:25%;text-align: left!important;'>" + AppMain.t(elm.enumeration, "EVENTS") + "</td>";
        html += "<td style='width:10%;text-align: left!important;'>" + elm.id + "</td>";
        html += "<td style=\"text-align: left!important;\">" + AppMain.t(elm.enumeration + "_DESC", "EVENTS") + "</td>";
        html += "<td>" + AppMain.html.formElementSwitch(elm.enumeration, elm.enumeration,
                {checked: checked, labelClass: "alarm-settings-switch", inputAttr: {"data-rbac-element": "eventsSettings.settings-apply"}}) + "</td>";
        html += "</tr>";
    });
    return html;
};

CtrlActionEventsSettings.setParams = function () {
    "use strict";
    const data = AppMain.html.getFormData("#EventsSettingsForm");

    let dataArr = [];
    let hesUrl = $("#hes-url").val();
    $.each(data, function (index, value) {
        if (index !== "hes-url" && value !== "false") {
            dataArr.push(index);
        }
    });

    const pJson = {
        "cntr": {
            "alrm-alarm-destination-url": hesUrl,
            "forward-to-hes-list": {}
        }
    };
    if (dataArr.length > 0) {
        pJson.cntr["forward-to-hes-list"].event = dataArr;
    }
    const response = AppMain.ws().exec("SetParameters", pJson).getResponse(false);

    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else {
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    }
    AppMain.html.updateElements([".mdl-button"]);
};

module.exports.CtrlActionEventsSettings = CtrlActionEventsSettings;