/**
 * @class CtrlActionMonitoringManager Controller action using IControllerAction interface.
 */
/* global AppMain, $, defined, Chart */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionMonitoringManager = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const download = require("./vendor/download.js");
const build = require("../build.info");

CtrlActionMonitoringManager.formId = "MonitoringForm";
CtrlActionMonitoringManager.exec = function () {
    "use strict";
    this.view.setTitle("MONITORING_MANAGER");

    // no call on first page call, user must press apply

    this.translateObj = {
        "cpu-load": AppMain.t("CPU_LOAD", "MONITORING_MANAGER"),
        "volatile-memory-usage": AppMain.t("VOLATILE_MEMORY_USAGE", "MONITORING_MANAGER"),
        "non-volatile-memory-usage": AppMain.t("NON_VOLATILE_MEMORY_USAGE", "MONITORING_MANAGER"),
        "data-memory-usage": AppMain.t("DATA_MEMORY_USAGE", "MONITORING_MANAGER"),
        "cpu-core-temperature": AppMain.t("CPU_CORE_TEMP", "MONITORING_MANAGER"),
        "cpu-board-temperature": AppMain.t("CPU_BOARD_TEMP", "MONITORING_MANAGER"),
        "battery-voltage": AppMain.t("BATTERY_VOLTAGE", "MONITORING_MANAGER"),
        "supercap-charge-level": AppMain.t("SUPERCAP_CHARGE_LEVEL", "MONITORING_MANAGER"),
        "uptime": AppMain.t("UPTIME_IN_SEC", "MONITORING_MANAGER"),
        "bad-crc-count": AppMain.t("BAD_CRC_COUNT", "MONITORING_MANAGER"),
        "csma-fail-count": AppMain.t("CSMA_FAIL_COUNT", "MONITORING_MANAGER"),
        "csma-no-ack-count": AppMain.t("CSMA_NO_ACK_COUNT", "MONITORING_MANAGER"),
        "rx-cmd-packet-count": AppMain.t("RX_CMD_PACKETS", "MONITORING_MANAGER"),
        "rx-data-broadcast-count": AppMain.t("RX_DATA_BROADCAST", "MONITORING_MANAGER"),
        "rx-data-packet-count": AppMain.t("RX_DATA_PACKET", "MONITORING_MANAGER"),
        "send-queue-max-entries-count": AppMain.t("SEND_QUEUE_MAX_ENTRIES", "MONITORING_MANAGER"),
        "send-queue-timeout-count": AppMain.t("SEND_QUEUE_TIMEOUT", "MONITORING_MANAGER"),
        "tx-cmd-packet-count": AppMain.t("TX_CMD_PACKETS", "MONITORING_MANAGER"),
        "tx-data-broadcast-count": AppMain.t("TX_DATA_BROADCAST", "MONITORING_MANAGER"),
        "tx-data-packet-count": AppMain.t("TX_DATA_PACKET", "MONITORING_MANAGER"),
        "rx-bytes-count": AppMain.t("RX_BYTES", "MONITORING_MANAGER"),
        "rx-packets-count": AppMain.t("RX_PACKETS", "MONITORING_MANAGER"),
        "tx-bytes-count": AppMain.t("TX_BYTES", "MONITORING_MANAGER"),
        "tx-packets-count": AppMain.t("TX_PACKETS", "MONITORING_MANAGER"),
        "iloc-rx-data-bytes-count": AppMain.t("ILOC_RX_DATA_BYTES", "MONITORING_MANAGER"),
        "iloc-tx-data-bytes-count": AppMain.t("ILOC_TX_DATA_BYTES", "MONITORING_MANAGER"),
        "multicast-ack-bytes-count": AppMain.t("MULTICAST_ACK_BYTES", "MONITORING_MANAGER"),
        "multicast-ack-packet-count": AppMain.t("MULTICAST_ACK_PACKETS", "MONITORING_MANAGER"),
        "multicast-last-ack-timestamp": AppMain.t("MULTICAST_LAST_ACK_PACKETS", "MONITORING_MANAGER"),
        "multicast-last-no-ack-timestamp": AppMain.t("MULTICAST_LAST_NO_ACK_PACKETS", "MONITORING_MANAGER"),
        "multicast-no-ack-packet-count": AppMain.t("MULTICAST_NO_ACK_PACKETS", "MONITORING_MANAGER"),
        "wan2-rx-data-bytes-count": AppMain.t("WAN2_RX_DATA_BYTES", "MONITORING_MANAGER"),
        "wan2-tx-data-bytes-count": AppMain.t("WAN2_TX_DATA_BYTES", "MONITORING_MANAGER"),
        "wan-esq-ber": AppMain.t("WAN2_ESQ_BER", "MONITORING_MANAGER"),
        "wan-esq-ecno": AppMain.t("WAN2_ESQ_ECNO", "MONITORING_MANAGER"),
        "wan-esq-rscp": AppMain.t("WAN2_ESQ_RSCP", "MONITORING_MANAGER"),
        "wan-esq-rsrp": AppMain.t("WAN2_ESQ_RSRP", "MONITORING_MANAGER"),
        "wan-esq-rsrq": AppMain.t("WAN2_ESQ_RSRQ", "MONITORING_MANAGER"),
        "wan-rx-data-bytes-count": AppMain.t("WAN_RX_DATA_BYTES", "MONITORING_MANAGER"),
        "wan-sq-ber": AppMain.t("WAN_SQ_BER", "MONITORING_MANAGER"),
        "wan-sq-rssi": AppMain.t("WAN_SQ_RSSI", "MONITORING_MANAGER"),
        "wan-tx-data-bytes-count": AppMain.t("WAN_TX_DATA_BYTES", "MONITORING_MANAGER"),
        "wan-esq-rxlev": AppMain.t("WAN2_ESQ_RXLEV", "MONITORING_MANAGER"),
        "active-meters-counter": AppMain.t("ACTIVE_METERS", "MONITORING_MANAGER"),
        "executed-jobs": AppMain.t("EXECUTED_JOBS", "MONITORING_MANAGER"),
        "active-jobs": AppMain.t("ACTIVE_JOBS", "MONITORING_MANAGER"),
        "finished-jobs": AppMain.t("FINISHED_JOBS", "MONITORING_MANAGER"),
        "paused-jobs": AppMain.t("PAUSED_JOBS", "MONITORING_MANAGER"),
        "storage-db-size": AppMain.t("STORAGE_SIZE", "MONITORING_MANAGER")
    };
    this.typeObj = {
        "cpu-load": "INSTANTANEOUS",
        "volatile-memory-usage": "INSTANTANEOUS",
        "non-volatile-memory-usage": "INSTANTANEOUS",
        "data-memory-usage": "INSTANTANEOUS",
        "cpu-core-temperature": "INSTANTANEOUS",
        "cpu-board-temperature": "INSTANTANEOUS",
        "battery-voltage": "INSTANTANEOUS",
        "supercap-charge-level": "INSTANTANEOUS",
        "uptime": "INSTANTANEOUS",
        "bad-crc-count": "COUNTER",
        "csma-fail-count": "COUNTER",
        "csma-no-ack-count": "COUNTER",
        "rx-cmd-packet-count": "COUNTER",
        "rx-data-broadcast-count": "COUNTER",
        "rx-data-packet-count": "COUNTER",
        "send-queue-max-entries-count": "COUNTER",
        "send-queue-timeout-count": "COUNTER",
        "tx-cmd-packet-count": "COUNTER",
        "tx-data-broadcast-count": "COUNTER",
        "tx-data-packet-count": "COUNTER",
        "rx-bytes-count": "COUNTER",
        "rx-packets-count": "COUNTER",
        "tx-bytes-count": "COUNTER",
        "tx-packets-count": "COUNTER",
        "iloc-rx-data-bytes-count": "COUNTER",
        "iloc-tx-data-bytes-count": "COUNTER",
        "multicast-ack-bytes-count": "COUNTER",
        "multicast-ack-packet-count": "COUNTER",
        "multicast-last-ack-timestamp": "COUNTER",
        "multicast-last-no-ack-timestamp": "COUNTER",
        "multicast-no-ack-packet-count": "COUNTER",
        "wan2-rx-data-bytes-count": "COUNTER",
        "wan2-tx-data-bytes-count": "COUNTER",
        "wan-esq-ber": "INSTANTANEOUS",
        "wan-esq-ecno": "INSTANTANEOUS",
        "wan-esq-rscp": "INSTANTANEOUS",
        "wan-esq-rsrp": "INSTANTANEOUS",
        "wan-esq-rsrq": "INSTANTANEOUS",
        "wan-esq-rxlev": "INSTANTANEOUS",
        "wan-rx-data-bytes-count": "COUNTER",
        "wan-sq-ber": "INSTANTANEOUS",
        "wan-sq-rssi": "INSTANTANEOUS",
        "wan-tx-data-bytes-count": "COUNTER",
        "active-meters-counter": "INSTANTANEOUS"
    };

    this.unitsObj = {
        "cpu-load": "%",
        "volatile-memory-usage": "%",
        "non-volatile-memory-usage": "%",
        "data-memory-usage": "%",
        "cpu-core-temperature": "m°C",
        "cpu-board-temperature": "m°C",
        "battery-voltage": "mV",
        "supercap-charge-level": "%",
        "uptime": AppMain.t("SECONDS", "MONITORING_MANAGER"),
        // "csma-fail-count": "COUNTER",
        // "csma-no-ack-count": "COUNTER",
        // "rx-cmd-packet-count": "COUNTER",
        // "rx-data-broadcast-count": "COUNTER",
        // "rx-data-packet-count": "COUNTER",
        // "send-queue-max-entries-count": "COUNTER",
        // "send-queue-timeout-count": "COUNTER",
        // "tx-cmd-packet-count": "COUNTER",
        // "tx-data-broadcast-count": "COUNTER",
        // "tx-data-packet-count": "COUNTER",
        "rx-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        // "rx-packets-count": "COUNTER",
        "tx-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        // "tx-packets-count": "COUNTER",
        "iloc-rx-data-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        "iloc-tx-data-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        "multicast-ack-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        "wan2-rx-data-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        "wan2-tx-data-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        "wan-esq-ber": "%",
        "wan-esq-ecno": "dB",
        "wan-esq-rscp": "dBm",
        "wan-esq-rsrp": "dBm",
        "wan-esq-rsrq": "dB",
        "wan-esq-rxlev": "dBm",
        "wan-rx-data-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER"),
        "wan-sq-ber": "%",
        // "wan-sq-rssi": "Byte",
        "storage-db-size": "MB",
        "wan-tx-data-bytes-count": AppMain.t("BYTES", "MONITORING_MANAGER")
    };

    this.profileTypeSys = AppMain.html.formElementSelect("profile-type",
            {
        "supercap-charge-level": AppMain.t("SUPERCAP_CHARGE_LEVEL", "MONITORING_MANAGER"),
        "battery-voltage": AppMain.t("BATTERY_VOLTAGE", "MONITORING_MANAGER"),
        "cpu-board-temperature": AppMain.t("CPU_BOARD_TEMP_SHORT", "MONITORING_MANAGER"),
        "cpu-core-temperature": AppMain.t("CPU_CORE_TEMP_SHORT", "MONITORING_MANAGER"),
        "cpu-load": AppMain.t("CPU_LOAD", "MONITORING_MANAGER"),
        "data-memory-usage": AppMain.t("DATA_MEMORY_USAGE", "MONITORING_MANAGER"),
        "non-volatile-memory-usage": AppMain.t("NON_VOLATILE_MEMORY_USAGE", "MONITORING_MANAGER"),
        "volatile-memory-usage": AppMain.t("VOLATILE_MEMORY_USAGE", "MONITORING_MANAGER"),
        "uptime": AppMain.t("UPTIME_IN_SEC", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });

    this.profileTypePlc = AppMain.html.formElementSelect("profile-type",
            {
        "rx-data-broadcast-count": AppMain.t("RX_DATA_BROADCAST", "MONITORING_MANAGER"),
        "tx-data-broadcast-count": AppMain.t("TX_DATA_BROADCAST", "MONITORING_MANAGER"),
        "rx-cmd-packet-count": AppMain.t("RX_CMD_PACKETS", "MONITORING_MANAGER"),
        "tx-cmd-packet-count": AppMain.t("TX_CMD_PACKETS", "MONITORING_MANAGER"),
        "bad-crc-count": AppMain.t("BAD_CRC_COUNT", "MONITORING_MANAGER"),
        "csma-fail-count": AppMain.t("CSMA_FAIL_COUNT", "MONITORING_MANAGER"),
        "csma-no-ack-count": AppMain.t("CSMA_NO_ACK_COUNT", "MONITORING_MANAGER"),
        "multicast-ack-bytes-count": AppMain.t("MULTICAST_ACK_BYTES", "MONITORING_MANAGER"),
        "multicast-ack-packet-count": AppMain.t("MULTICAST_ACK_PACKETS", "MONITORING_MANAGER"),
        "multicast-no-ack-packet-count": AppMain.t("MULTICAST_NO_ACK_PACKETS", "MONITORING_MANAGER"),
        "rx-data-packet-count": AppMain.t("RX_DATA_PACKET", "MONITORING_MANAGER"),
        "tx-data-packet-count": AppMain.t("TX_DATA_PACKET", "MONITORING_MANAGER"),
        "send-queue-max-entries-count": AppMain.t("SEND_QUEUE_MAX_ENTRIES", "MONITORING_MANAGER"),
        "send-queue-timeout-count": AppMain.t("SEND_QUEUE_TIMEOUT", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });

    this.profileTypeRS485 = AppMain.html.formElementSelect("profile-type",
            {
        "rx-bytes-count": AppMain.t("RX_BYTES", "MONITORING_MANAGER"),
        "rx-packets-count": AppMain.t("RX_PACKETS", "MONITORING_MANAGER"),
        "tx-bytes-count": AppMain.t("TX_BYTES", "MONITORING_MANAGER"),
        "tx-packets-count": AppMain.t("TX_PACKETS", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });

    this.profileTypeWAN = AppMain.html.formElementSelect("profile-type",
            {
        "wan-sq-ber": AppMain.t("WAN_SQ_BER", "MONITORING_MANAGER"),
        "wan-esq-ber": AppMain.t("WAN2_ESQ_BER", "MONITORING_MANAGER"),
        "wan-esq-ecno": AppMain.t("WAN2_ESQ_ECNO", "MONITORING_MANAGER"),
        "wan-esq-rscp": AppMain.t("WAN2_ESQ_RSCP", "MONITORING_MANAGER"),
        "wan-esq-rsrp": AppMain.t("WAN2_ESQ_RSRP", "MONITORING_MANAGER"),
        "wan-esq-rsrq": AppMain.t("WAN2_ESQ_RSRQ", "MONITORING_MANAGER"),
        "wan-rx-data-bytes-count": AppMain.t("WAN_RX_DATA_BYTES", "MONITORING_MANAGER"),
        "wan-esq-rxlev": AppMain.t("WAN2_ESQ_RXLEV", "MONITORING_MANAGER"),
        "wan-sq-rssi": AppMain.t("WAN_SQ_RSSI", "MONITORING_MANAGER"),
        "wan-tx-data-bytes-count": AppMain.t("WAN_TX_DATA_BYTES", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });
    this.profileTypeWANModem = AppMain.html.formElementSelect("profile-type",
            {
        "wan2-rx-data-bytes-count": AppMain.t("WAN2_RX_DATA_BYTES", "MONITORING_MANAGER"),
        "wan2-tx-data-bytes-count": AppMain.t("WAN2_TX_DATA_BYTES", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });

    this.profileTypeWANLocal = AppMain.html.formElementSelect("profile-type",
            {
        "iloc-rx-data-bytes-count": AppMain.t("ILOC_RX_DATA_BYTES", "MONITORING_MANAGER"),
        "iloc-tx-data-bytes-count": AppMain.t("ILOC_TX_DATA_BYTES", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });
    this.profileTypeApp = AppMain.html.formElementSelect("profile-type",
            {
        "active-jobs": AppMain.t("ACTIVE_JOBS", "MONITORING_MANAGER"),
        "active-meters-counter": AppMain.t("ACTIVE_METERS", "MONITORING_MANAGER"),
        "storage-db-size": AppMain.t("STORAGE_SIZE", "MONITORING_MANAGER"),
        "executed-jobs": AppMain.t("EXECUTED_JOBS", "MONITORING_MANAGER"),
        "finished-jobs": AppMain.t("FINISHED_JOBS", "MONITORING_MANAGER"),
        "paused-jobs": AppMain.t("PAUSED_JOBS", "MONITORING_MANAGER")
    },
            {
        label: AppMain.t("SELECT_PROFILE_TYPE", "MONITORING_MANAGER"),
        elementSelected: "cpu-load"
    });

    this.categoryToColor = {
        "CNT-SYS": "rgb(255, 172, 171)",
        "CNT-WAN": "rgb(181, 199, 230)",
        "CNT-WAN_MODEM": "rgb(199, 223, 182)",
        "CNT-WAN_LOCAL": "rgb(254, 229, 157)",
        "CNT-PLC": "rgb(247, 203, 175)",
        "CNT-RS485": "rgb(253, 156, 253)"
    };

    this.view.render(this.controller.action, {
        title: AppMain.t("TITLE", "MONITORING_MANAGER"),
        elements: {
            profileCategory: AppMain.html.formElementSelect("profile-category",
                    {
                "CNT-APP": AppMain.t("APPLICATION", "MONITORING_MANAGER"),
                "CNT-WAN": AppMain.t("CNT_WAN_MODEM", "MONITORING_MANAGER"),
                "CNT-WAN_MODEM": AppMain.t("CNT_WAN", "MONITORING_MANAGER"),
                "CNT-WAN_LOCAL": AppMain.t("CNT_WAN_LOCAL", "MONITORING_MANAGER"),
                "CNT-PLC": AppMain.t("PLC", "MONITORING_MANAGER"),
                "CNT-RS485": AppMain.t("RS485", "MONITORING_MANAGER"),
                "CNT-SYS": AppMain.t("SYSTEM", "MONITORING_MANAGER")
            },
                    {
                label: AppMain.t("SELECT_PROFILE_CAT", "MONITORING_MANAGER"),
                elementSelected: "CNT-SYS",
                elementAttr: " data-bind-event=\"change\" data-bind-method=\"CtrlActionMonitoringManager.updateProfileType\" "
            }),
            profileTypeSys: this.profileTypeSys
        },
        labels: {
            apply: AppMain.t("APPLY", "global"),
            dateFrom: AppMain.t("DATE_FROM", "MONITORING_MANAGER"),
            dateTo: AppMain.t("DATE_TO", "MONITORING_MANAGER"),
            timestamp: AppMain.t("TIMESTAMP", "MONITORING_MANAGER"),
            value: AppMain.t("VALUE", "MONITORING_MANAGER"),
            btnExport: AppMain.t("EXPORT", "global"),
            chart: AppMain.t("CHART", "MONITORING_MANAGER"),
            table: AppMain.t("TABLE", "MONITORING_MANAGER"),
            view: AppMain.t("VIEW", "MONITORING_MANAGER")
        }
    });

    this.firstTime = true;
    this.selectorFrom = "#dateFrom";
    this.selectorTo = "#dateTo";
    this.contersForExport = [];

    this.initDatepickers();
    this.adjustSelect();
};

CtrlActionMonitoringManager.adjustSelect = function () {
    "use strict";

    setTimeout(function () {
        // mdl-textfield-less-padding-chrome
        const isMacLike = !!navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i);
        if (isMacLike) {
            $(".mdl-textfield-less-padding-chrome .mdl-js-select").css("padding-top", "25px");
        }
    }, 100);
};

CtrlActionMonitoringManager.initDatepickers = function () {
    "use strict";

    $(this.selectorFrom).datetimepicker({
        dayOfWeekStart: 1,
        lang: "sl",
        startDate: moment().add(-1, "days").format(AppMain.localization("DATETIME_FORMAT")),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });

    $(this.selectorTo).datetimepicker({
        dayOfWeekStart: 1,
        lang: "sl",
        startDate: moment().format(AppMain.localization("DATETIME_FORMAT")),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });


    $(this.selectorFrom).val(moment().add(-1, "days").format(AppMain.localization("DATETIME_FORMAT")));
    $(this.selectorTo).val(moment().format(AppMain.localization("DATETIME_FORMAT")));
    AppMain.html.updateElements([".mdl-js-textfield", ".mdl-js-select", ".mdl-js-radio"]);
};

CtrlActionMonitoringManager.drawGraph = function () {
    "use strict";
    const fromD = moment($(this.selectorFrom).val(), AppMain.localization("DATETIME_FORMAT"));
    const toD = moment($(this.selectorTo).val(), AppMain.localization("DATETIME_FORMAT"));
    let duration = moment.duration(toD.diff(fromD));
    let days = duration.asDays();
    if (days < 30) {
        this.drawGraphSetUp();
    } else {
        $.confirm({
            title: AppMain.t("CONFIRM_TITLE", "MONITORING_MANAGER"),
            content: AppMain.t("CONFIRM_CONTENT", "MONITORING_MANAGER"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        return CtrlActionMonitoringManager.drawGraphSetUp();
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

};

CtrlActionMonitoringManager.drawGraphSetUp = function () {
    "use strict";

    $("#view-option").show();

    let profileCategory = $("#profile-category").val();
    const color = defined(this.categoryToColor[profileCategory])
        ? this.categoryToColor[profileCategory]
        : "rgb(255, 172, 171)";

    profileCategory = profileCategory.toLowerCase();
    const cntWan = "CNT-WAN";
    if (profileCategory.indexOf(cntWan.toLowerCase()) !== -1) {
        profileCategory = cntWan.toLowerCase();
    }
    const profileType = $("#profile-type").val();
    const profileTypeTranslate = this.translateObj[profileType];

    const counters = this.getParams();
    this.contersForExport = counters;
    this.setCounters(counters, profileCategory, profileType);

    let chartType = this.typeObj[profileType] === "COUNTER"
        ? "line"
        : "bar";
    if (!this.firstTime) {
        this.chart.destroy();
    }
    this.firstTime = false;

    const units = defined(this.unitsObj[profileType])
        ? " (" + this.unitsObj[profileType] + ")"
        : "";

    let chartData = {
        labels: this.chartLabels,
        datasets: [{
            label: AppMain.t(profileTypeTranslate, "MONITORING_MANAGER") + units,
            backgroundColor: color,
            borderColor: color,
            fill: false,
            data: this.chartDatasets[0].data
        }]
    };

    const ctx = document.getElementById("canvas_graph").getContext("2d");

    this.chart = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: {
            hoverMode: "index",
            stacked: false,
            title: {
                display: true,
                text: AppMain.t(profileTypeTranslate, "MONITORING_MANAGER") + units
            },
            tooltips: {
                mode: "index",
                intersect: false
            },
            responsive: true,
            scales: {
                yAxes: [{
                    type: "linear",
                    stacked: false
                }]
            },
            legend: {
                display: false
            }
        }
    });

    $("#cpu_usage_table table").show();
    $("#cpu_usage_table_body").html(this.bodyHTML);
    $("#valueColumn").html(AppMain.t(profileTypeTranslate, "MONITORING_MANAGER") + units);
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionMonitoringManager.setCounters = function (counters, profileCategory, profileType) {
    "use strict";
    this.chartLabels = [];
    this.chartDatasets = [{data: []}];
    this.bodyHTML = "";
    const self = this;
    counters.forEach(function (val, index) {
        if (this.typeObj[profileType] === "COUNTER" && index === 0) {
            return;
        }
        self.chartLabels.push(moment(val["time-stamp"]).format(AppMain.localization("DATETIME_FORMAT")));
        let value = 0;
        if (self.typeObj[profileType] === "COUNTER") {
            value = Math.max(parseInt(val[profileCategory][profileType]) - parseInt(counters[index - 1][profileCategory][profileType]), 0);
        } else {
            value = parseInt(val[profileCategory][profileType]);
        }
        self.chartDatasets[0].data.push(value);
        self.bodyHTML += "<tr><td style='text-align: left!important;'>" + moment(val["time-stamp"]).format(AppMain.localization("DATETIME_FORMAT")) + "</td>" +
                "<td style='text-align: left!important;'>" + value + "</td></tr>";
    });
};

CtrlActionMonitoringManager.getParams = function () {
    "use strict";

    let category = $("#profile-category").val();
    if (category.indexOf("CNT-WAN") !== -1) {
        category = "CNT-WAN";
    }
    const fromD = moment($(this.selectorFrom).val(), AppMain.localization("DATETIME_FORMAT"));
    const toD = moment($(this.selectorTo).val(), AppMain.localization("DATETIME_FORMAT"));

    const cnt = AppMain.ws().exec("GetCounters", {
        "category": category,
        "time-selector": {
            "from-time": moment(fromD.toISOString()).unix(),
            "to-time": moment(toD.toISOString()).unix()
        }
    }).getResponse(false);

    if (defined(cnt.GetCountersResponse.counter)) {
        return cnt.GetCountersResponse.counter;
    } else {
        return [];
    }
};

CtrlActionMonitoringManager.updateProfileType = function () {
    "use strict";

    const cat = $("#profile-category").val();
    if (cat === "CNT-SYS") {
        $("#profileTypeHtml").html(this.profileTypeSys);
    }
    if (cat === "CNT-PLC") {
        $("#profileTypeHtml").html(this.profileTypePlc);
    }
    if (cat === "CNT-RS485") {
        $("#profileTypeHtml").html(this.profileTypeRS485);
    }
    if (cat === "CNT-WAN") {
        $("#profileTypeHtml").html(this.profileTypeWAN);
    }
    if (cat === "CNT-WAN_LOCAL") {
        $("#profileTypeHtml").html(this.profileTypeWANLocal);
    }
    if (cat === "CNT-WAN_MODEM") {
        $("#profileTypeHtml").html(this.profileTypeWANModem);
    }
    if (cat === "CNT-APP") {
        $("#profileTypeHtml").html(this.profileTypeApp);
    }

    AppMain.html.updateElements([".mdl-js-textfield", ".mdl-js-select"]);
    this.adjustSelect();
};

CtrlActionMonitoringManager.export = function () {
    "use strict";
    let profileCategory = $("#profile-category").val().toLowerCase();
    const cntWan = "CNT-WAN";
    if (profileCategory.indexOf(cntWan.toLowerCase()) !== -1) {
        profileCategory = cntWan.toLowerCase();
    }
    const profileType = $("#profile-type").val();
    const profileTypeTranslate = this.translateObj[profileType];

    if (this.contersForExport.length === 0) {
        this.contersForExport = this.getParams();
    }
    let csv = "SEP=,\r\n";
    csv += "\"" + AppMain.t("TIMESTAMP", "MONITORING_MANAGER") + "\",";
    csv += "\"" + profileTypeTranslate + "\"";
    csv += "\r\n";
    const self = this;
    this.chartLabels.forEach(function (value, index) {
        csv += "\"" + value + "\"" + ", ";
        csv += self.chartDatasets[0].data[index] + "\r\n";
    });

    download("data:text/csv;charset=utf-8;base64," + btoa(csv), build.device + "_" + profileCategory.toUpperCase() +
            "_" + profileType.toUpperCase() + "_" + moment().format("YYYY-MM-DD-HH-mm-ss") + ".csv", "text/csv");
};

CtrlActionMonitoringManager.changeView = function (view) {
    "use strict";

    if (view !== undefined && view.target !== undefined) {
        view.target.MaterialRadio.check();
        view = $("input[name=\"display-type\"]:checked").val();
    }
    if (view === "optionTable") {
        $("#cpu_usage_graph").hide();
        $("#cpu_usage_table").show();
        if (this.contersForExport.length === 0) {
            $("#cpu_usage_table table").hide();
        }
    } else {
        $("#cpu_usage_graph").show();
        $("#cpu_usage_table").hide();
    }
};

module.exports.CtrlActionMonitoringManager = CtrlActionMonitoringManager;