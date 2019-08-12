/**
 * Events indicator component
 * @class ComAlarmsEventsIndicator View component
 */
const modulecomponent = require("./IComponent");
let ComAlarmsEventsIndicator = Object.create(new modulecomponent.IComponent);

ComAlarmsEventsIndicator.init = function () {
    ComAlarmsEventsIndicator.socketHost = defined(AppMain.socketEventsHost) ? AppMain.socketEventsHost : window.location.host;
    this.render();
};

ComAlarmsEventsIndicator.socketHost = null;
/**
 * Main render method.
 */
ComAlarmsEventsIndicator.render = function () {
    const _this = this;
    const eventsTotal = this.events.length;
    const eventsList = "";

    AppMain.view.renderSection("Default#AlarmsEventsBar", "#SectionAlarmsEvents", {
        eventsList: eventsList,
        eventsTotal: eventsTotal,
        eventsAlarmClass: eventsTotal > 0 ? "mdl-color--red" : "mdl-color--transparent"
    }, undefined);

    ComAlarmsEventsIndicator.renderEventListHTML(_this)
};

ComAlarmsEventsIndicator.events = [];

ComAlarmsEventsIndicator.getSocketUrl = function () {
    return (AppMain.httpsEnabled === true) ? "wss://" + ComAlarmsEventsIndicator.socketHost + ":8081" : "ws://" + ComAlarmsEventsIndicator.socketHost + ":8081";
};

/**
 * Clear component internal events storage.
 */
ComAlarmsEventsIndicator.clearEvents = function () {
    ComAlarmsEventsIndicator.events = [];
};

/**
 * Add event object to the event list stack.
 * Object properties:
 * - id: event id
 * - clear: set to true if event can be cleared.
 */
ComAlarmsEventsIndicator.addEvent = function (eventObject) {
    ComAlarmsEventsIndicator.events[ComAlarmsEventsIndicator.events.length] = eventObject;
};

ComAlarmsEventsIndicator.renderEventListHTML = function (_this) {
    // Clear list on new socket message arrives.
    let eventsList = "";

    const eventsTotal = _this.events.length;
    let bindClearEvent = false;
    for (let i = 0; i < eventsTotal; i++) {
        eventsList += "<li data-evt-index='" + i + "' data-evt-id='" + _this.events[i].id + "' class='mdl-menu__item notification' style='width:325px;'>" + (i + 1) + ". " + _this.events[i].id;
        if (defined(_this.events[i].clear)) {
            eventsList += "&nbsp;&nbsp; <a class='mdl-button mdl-js-button mdl-button--raised ComAlarmsEventsIndicator_clearEvent' " +
                "data-event-index='" + i + "' data-rbac=\"mainmenu.clear-alarms-flag\" data-event-action='clear' data-event-id='" + _this.events[i].id + "'>" +
                AppMain.t("CLEAR", "HEADER") + "</a>";
            bindClearEvent = true;
        } else
            eventsList += "&nbsp;&nbsp; <a class='mdl-button mdl-js-button mdl-button--raised ComAlarmsEventsIndicator_removeEvent' " +
                "data-event-index='" + i + "' data-event-action='remove' data-event-id='" + _this.events[i].id + "'>" +
                AppMain.t("REMOVE", "HEADER") + "</a>";
        eventsList += "</li>";
    }

    AppMain.view.renderSection("Default#AlarmsEventsBar", "#SectionAlarmsEvents", {
        eventsList: eventsList,
        eventsTotal: eventsTotal,
        eventsAlarmClass: eventsTotal > 0 ? "mdl-color--red" : "mdl-color--transparent",
        eventsUlClass: eventsTotal === 0 ? "no-ul-border" : ""
    }, undefined);
    componentHandler.upgradeDom('MaterialMenu', 'mdl-menu');

    $(".notificatioMenuList").delegate("li > a", "click", function (e) {
        const button = e.currentTarget;
        const eventId = button.getAttribute("data-event-id");

        switch (button.getAttribute("data-event-action")) {
            case "clear":
                let eventObj = {};
                eventObj[eventId] = 1;
                AppMain.ws().exec("EventAlarms", {"ClearAlarmFlags": eventObj}).getResponse(false);
                AppMain.dialog("EVENT_CLEARED", "success", [eventId]);
                break;
            default:
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