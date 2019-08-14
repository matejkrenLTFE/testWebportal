/**
 * @class CtrlActionEventsSettings Controller action using IControllerAction interface.
 */
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionEventsSettings = Object.create(new modulecontrolleraction.IControllerAction);
const includeEvents = require("./includes/events.js");

CtrlActionEventsSettings.exec = function () {
    this.view.setTitle("ALARM_EVENTS");

    const allEventList = defined(includeEvents.events) ? includeEvents.events : [];
    let selectedEventList = AppMain.ws().exec("GetParameters", {"cntr": ""}).getResponse(false);

    const hesUrl = defined(selectedEventList.GetParametersResponse.cntr) ?
        selectedEventList.GetParametersResponse.cntr["alrm-alarm-destination-url"] : "";
    selectedEventList = (defined(selectedEventList.GetParametersResponse) && defined(selectedEventList.GetParametersResponse.cntr)
        && defined(selectedEventList.GetParametersResponse.cntr["forward-to-hes-list"]) &&
        defined(selectedEventList.GetParametersResponse.cntr["forward-to-hes-list"]["event"])) ?
        AppMain.ws().getResponseElementAsArray(selectedEventList["GetParametersResponse"]["cntr"]["forward-to-hes-list"]["event"]) : [];

    this.view.render(this.controller.action, {
        title: AppMain.t("SETTINGS", "ALARM_EVENTS"),
        params: {
            tbody: this._htmlTableBody(allEventList, selectedEventList, "event"),
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
        $(".alarm-settings-switch input").on("click",function () {
            const elm = $(".alarm-settings-switch input[type='hidden'][name='" + $(this).attr("name") +"']");
            if(elm.val() === "true"){
                elm.val("false");
            }else{
                elm.val("true")
            }
        })
    },300);
    AppMain.html.updateAllElements();
};

CtrlActionEventsSettings._htmlTableBody = function (eventList, selectedEventList) {
    let html = "";
    eventList.forEach(function (i) {
        let checked = false;

        // Find checked events
        selectedEventList.forEach(function (j) {
            if (eventList[i].enumeration === selectedEventList[j])
                checked = true;
        });

        html += "<tr>";
        html += "<td style='width:25%;text-align: left!important;'>" + AppMain.t(eventList[i].enumeration, "EVENTS") + "</td>";
        html += "<td style='width:10%;text-align: left!important;'>" + eventList[i].id + "</td>";
        html += "<td style=\"text-align: left!important;\">" + AppMain.t(eventList[i].enumeration + "_DESC", "EVENTS") + "</td>";
        html += "<td>" + AppMain.html.formElementSwitch(eventList[i].enumeration, eventList[i].enumeration,
            {checked: checked, labelClass: "alarm-settings-switch", inputAttr: {"data-rbac-element": "eventsSettings.settings-apply"}}) + "</td>";
        html += "</tr>";
    });
    return html;
};

CtrlActionEventsSettings.setParams = function () {
    const data = AppMain.html.getFormData("#EventsSettingsForm");

    let dataArr = [];
    let hesUrl = $("#hes-url").val();
    data.forEach(function (i) {
        if (i !== "hes-url" && data[i] !== "false")
            dataArr.push(i);
    });

    const pJson = {
        "cntr" : {
            "alrm-alarm-destination-url": hesUrl,
            "forward-to-hes-list": {}
        }
    };
    if(dataArr.length > 0){
        pJson.cntr["forward-to-hes-list"]["event"] = dataArr;
    }
    const response = AppMain.ws().exec("SetParameters", pJson).getResponse(false);

    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    AppMain.html.updateElements([".mdl-button"]);
};

module.exports.CtrlActionEventsSettings = CtrlActionEventsSettings;