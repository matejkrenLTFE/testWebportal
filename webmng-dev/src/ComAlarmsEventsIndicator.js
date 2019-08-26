/**
 * Events indicator component
 * @class ComAlarmsEventsIndicator View component
 */

/* global AppMain, $, defined, window */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecomponent = require("./IComponent");
let ComAlarmsEventsIndicator = Object.create(new modulecomponent.IComponent());

ComAlarmsEventsIndicator.init = function () {
    "use strict";
    ComAlarmsEventsIndicator.socketHost = defined(AppMain.socketEventsHost)
        ? AppMain.socketEventsHost
        : window.location.host;
    this.render();
};

ComAlarmsEventsIndicator.socketHost = null;
/**
 * Main render method.
 */
ComAlarmsEventsIndicator.render = function () {
    "use strict";
    const _this = this;
    const eventsTotal = this.events.length;
    const eventsList = "";

    AppMain.view.renderSection("Default#AlarmsEventsBar", "#SectionAlarmsEvents", {
        eventsList: eventsList,
        eventsTotal: eventsTotal,
        eventsAlarmClass: eventsTotal > 0
            ? "mdl-color--red"
            : "mdl-color--transparent"
    }, undefined);

    ComAlarmsEventsIndicator.renderEventListHTML(_this);
};

ComAlarmsEventsIndicator.events = [];

ComAlarmsEventsIndicator.getSocketUrl = function () {
    "use strict";
    return (AppMain.httpsEnabled === true)
        ? "wss://" + ComAlarmsEventsIndicator.socketHost + ":8081"
        : "ws://" + ComAlarmsEventsIndicator.socketHost + ":8081";
};

/**
 * Clear component internal events storage.
 */
ComAlarmsEventsIndicator.clearEvents = function () {
    "use strict";
    ComAlarmsEventsIndicator.events = [];
};

/**
 * Add event object to the event list stack.
 * Object properties:
 * - id: event id
 * - clear: set to true if event can be cleared.
 */
ComAlarmsEventsIndicator.addEvent = function (eventObject) {
    "use strict";
    ComAlarmsEventsIndicator.events[ComAlarmsEventsIndicator.events.length] = eventObject;
};

ComAlarmsEventsIndicator.renderEventListHTML = function (_this) {
    "use strict";
    // Clear list on new socket message arrives.
    let eventsList = "";
    const eventsTotal = _this.events.length;
    _this.events.forEach(function (item, i) {
        eventsList += "<li data-evt-index='" + i + "' data-evt-id='" + item.id + "' class='mdl-menu__item notification' style='width:325px;'>" + (i + 1) + ". " + item.id;
        if (defined(item.clear)) {
            eventsList += "&nbsp;&nbsp; <a class='mdl-button mdl-js-button mdl-button--raised ComAlarmsEventsIndicator_clearEvent' " +
                    "data-event-index='" + i + "' data-rbac=\"mainmenu.clear-alarms-flag\" data-event-action='clear' data-event-id='" + item.id + "'>" +
                    AppMain.t("CLEAR", "HEADER") + "</a>";
        } else {
            eventsList += "&nbsp;&nbsp; <a class='mdl-button mdl-js-button mdl-button--raised ComAlarmsEventsIndicator_removeEvent' " +
                    "data-event-index='" + i + "' data-event-action='remove' data-event-id='" + item.id + "'>" +
                    AppMain.t("REMOVE", "HEADER") + "</a>";
        }
        eventsList += "</li>";
    });


    AppMain.view.renderSection("Default#AlarmsEventsBar", "#SectionAlarmsEvents", {
        eventsList: eventsList,
        eventsTotal: eventsTotal,
        eventsAlarmClass: eventsTotal > 0
            ? "mdl-color--red"
            : "mdl-color--transparent",
        eventsUlClass: eventsTotal === 0
            ? "no-ul-border"
            : ""
    }, undefined);
    componentHandler.upgradeDom("MaterialMenu", "mdl-menu");

    $(".notificatioMenuList").delegate("li > a", "click", function (e) {
        const button = e.currentTarget;
        const eventId = button.getAttribute("data-event-id");

        if (button.getAttribute("data-event-action") === "clear") {
            let eventObj = {};
            eventObj[eventId] = 1;
            AppMain.ws().exec("EventAlarms", {"ClearAlarmFlags": eventObj}).getResponse(false);
            AppMain.dialog("EVENT_CLEARED", "success", [eventId]);
        } else {
            AppMain.dialog("EVENT_REMOVED", "success", [button.getAttribute("data-event-id")]);
        }

        _this.events.splice(button.getAttribute("data-event-index"), 1);
        $(this).parent().remove();
        const nCounter = $(".notificationCounter");
        nCounter.html(_this.events.length);
        if (_this.events.length === 0) {
            nCounter.removeClass("mdl-color--red");
            nCounter.addClass("mdl-color--transparent");
        }
    });
};
/**
 * @param WebSocket
 */
ComAlarmsEventsIndicator.socketClient = null;
module.exports.ComAlarmsEventsIndicator = ComAlarmsEventsIndicator;