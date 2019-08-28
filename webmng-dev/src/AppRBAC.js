/**
 * Component for creating dynamic HTML elements.
 * @author LTFE
 */

/* global  AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

module.exports.AppRBAC = function () {
    "use strict";

    /**
     * Webservice access levels
     */
    this.WS_ACCESS_LEVEL_FULL = 1;

    this.processViewTemplate = function (content) {
        const rbac = AppMain.user.getRBACMap();
        // Hide param wrapper altogether
        const $content = $("<span>" + content + "</span>");

        const rbacWrapperSelectors = $content.find("[data-rbac]");
        $.each(rbacWrapperSelectors, function (i, elm) {
            const $element = $(elm);
            const rbacSelector = $element.attr("data-rbac").split(".");
            if (rbacSelector.length > 1) {
                const rbacCategory = rbacSelector[0];
                const rbacParam = rbacSelector[1];
                if (defined(rbac[rbacCategory]) && defined(rbac[rbacCategory][rbacParam]) && rbac[rbacCategory][rbacParam].toLowerCase() === "h") {
                    const rbacSelectorReplace = "data-rbac=\"" + rbacCategory + "." + rbacParam + "\"";
                    content = content.replace(new RegExp(`${rbacSelectorReplace}`, "gi"), rbacSelectorReplace + " style=\"display:none;\" ");
                }
            }
        });

        // Hide/disable RBAC elements
        const rbacElementSelectors = $content.find("[data-rbac-element]");
        $.each(rbacElementSelectors, function (i, elm) {
            const $element = $(elm);
            const rbacSelector = $element.attr("data-rbac-element").split(".");
            if (rbacSelector.length > 1) {
                const rbacCategory = rbacSelector[0];
                const rbacParam = rbacSelector[1];
                if (defined(rbac[rbacCategory]) && defined(rbac[rbacCategory][rbacParam])
                        && (rbac[`${rbacCategory}`][`${rbacParam}`].toLowerCase() === "r" || rbac[`${rbacCategory}`][`${rbacParam}`].toLowerCase() === "h")) {
                    const rbacSelectorReplace = "data-rbac-element=\"" + rbacCategory + "." + rbacParam + "\"";
                    content = content.replace(new RegExp(`${rbacSelectorReplace}`, "gi"), rbacSelectorReplace + " disabled ");
                }
            }
        });
        return content;
    };

    this.getDefaultRBACMap = function () {
        return {
            mainmenu: ["dashboard", "nodes", "plc-neighbor", "plc-routing", "white-list", "network-topology", "events", "eventsRS485", "events-settings", "wan", "wan-modem", "wan-ethernet",
                    "nan", "plc", "rs485", "lan", "local-ethernet", "monitoring-diagnostics", "plc-diagnostics", "monitoring-manager", "system",
                    "system-settings", "system-settings-export", "system-users",
                    "system-upgrade", "system-reboot", /*"user-role", "system-cert-manager", "system-firewall-manager",*/
                    "system-information", "task-manager", "groups-table", "logout", "clear-alarms-flag"],
            info: ["general-box", "device-type", "serial-number", "hostname", "software-version",
                    "system-info-box", "battery-level", "supercap-level", "internal-temp", "cpu-temp", "cpu-load", "data-memory-usage",
                    "time-box", "uptime", "current-time", "timezone", "alarms-box"],
            nodes: ["actions", "refresh-list", "export-list", "ping", "kickoff"],
            whiteList: ["actions", "refresh", "export-list", "delete", "add", "useWhiteList"],
            plcNeighbor: ["actions", "refresh", "export-list"],
            monitoringDiagnostics: ["actions", "export"],
            plcRouting: ["actions", "refresh", "export-list"],
            events: ["export"],
            eventsSettings: ["settings-apply"],
            wan1: ["enable", "gsm-status", "gsm-signal-level", "network", "ip", "apn", "user-name", "password", "modem-type",
                    "version", "imei", "card-id", "heartbeat", "heartbeatIP", "heartbeatBackUpIP", "heartbeatPeriod", "heartbeatTimeout",
                    "heartbeatMaxRetry", "actions", "button-export", "button-apply"],
            wan2: ["enable", "dhcp", "ip-config-ip", "netmask", "ip-config-gateway", "ip-config-dns1", "ip-config-dns2", "ip-config-ipv6-addr",
                    "ipv6-netmask", "actions", "button-export", "button-apply"],
            plc: ["mac-address", "pan-id", "band", "actions", "button-export", "button-apply"],
            rs485: ["baudrate", "data-bits", "parity", "stop-bits", "timeout", "actions", "button-export", "button-apply"],
            lan: ["enable", "dhcp", "ip-config-ip", "ip-config-net-mask", "ip-config-gateway", "actions", "button-export", "button-apply"],
            plcDiagnostics: ["actions"],
            settings: ["hostname", "ntp-server", "ntp-sync-interval", "reboot", "actions", "button-apply", "button-sync-time", "push-retries", "push-timeout"],
            "firmware_upgrade": ["upgrade"],
            "settings_import_export": ["import", "export", "export_local_ethernet", "export_modem", "export_ethernet", "export_plc",
                    "export_rs485", "export_system", "export_application", "export_gwpd", "export_macd", "export_csmd", "factory_defaults"],
            users: ["actions", "button-add-user", "button-remove-user", "button-change-password"],
            /*users_roles: ["actions"],
            certificate: ["actions", "import", "generate"],*/
            "system_info": ["linux-version", "firmware-library-version", "application-package", "image-version", "webservice", "apache-version",
                    "production-date", "webportal-version", "G3PLC-modem-version"],
            taskManager: ["refresh", "add", "delete", "edit", "export"],
            groupsTable: ["refresh", "add", "delete", "export", "edit", "push-dest"]
            /*firewall: ["enable", "add", "remove", "apply"]*/
        };
    };

    /**
     * Map special mainmenu controller actions.
     * @param {String} actionName Action name without #.
     */
    this.getCtrlActionRBACName = function (actionName) {
        const map = {
            "WANModem": "wan-modem",
            "Nodes": "nodes",
            "WhiteList": "white-list",
            "WANEthernet": "wan-ethernet",
            "Events": "events",
            "EventsSettings": "events-settings",
            "LANEthernet": "local-ethernet",
            "NANPlc": "plc",
            "NANRs": "rs485",
            "Default": "dashboard",
            "SystemSettings": "system-settings",
            "SystemUsers": "system-users",
            "SystemSettingsExport": "system-settings-export",
            "SystemUpgrade": "system-upgrade",
            "SystemUsersRole": "user-role",
            "SystemCertManager": "system-cert-manager",
            "SystemFirewallManager": "system-firewall-manager",
            "SystemInformation": "system-information"
        };
        return (defined(map[actionName]))
            ? map[actionName]
            : actionName.toLowerCase();
    };

    /**
     * Check if user role has permission to execute controller action.
     * @param {String} actionName Action name without #.
     * @return {Boolean}
     */
    this.hasExecCtrlActionPermission = function (actionName) {
        let allowExecute = true;
        const ctrlActionName = AppMain.rbac.getCtrlActionRBACName(actionName);
        const userRoleData = AppMain.user.getUserData("role");

        if (userRoleData) {
            $.each(userRoleData.mainmenu, function (index, value) {
                if (index === ctrlActionName && value === "h") {
                    allowExecute = false;
                }
            });
        }

        return allowExecute;
    };

    /**
     * Translate RBAC name
     * @param {String} rBACitem program RBAC name.
     * @return {String}
     */
    this.getRBACNameTranslation = function (rBACitem) {
        return AppMain.t(rBACitem, "RBAC");
    };
};
