/**
 * @class CtrlActionSystemReboot Controller action using IControllerAction interface.
 */

/* global AppMain, $, dmp, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemReboot = Object.create(new modulecontrolleraction.IControllerAction());

CtrlActionSystemReboot.exec = function () {
    "use strict";

    this.view.setTitle("SYS_REBOOT");

    this.view.render(this.controller.action, {
        title: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
        labels: {
            btnReboot: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
            lbReboot: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
            rebootType: AppMain.t("SYS_REBOOT_TYPE", "SYS_SETTINGS"),
            rebootTypeSavedParams: AppMain.t("REBOOT_SAVED_PARAMS", "SYS_SETTINGS"),
            rebootTypeDefaultParams: AppMain.t("REBOOT_DEFAULT_PARAMS", "SYS_SETTINGS")
        }
    });
};


CtrlActionSystemReboot.systemReboot = function () {
    "use strict";

    if (!AppMain.user.getRBACpermissionElement("settings", "reboot")) {
        return;
    }
    $.confirm({
        title: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
        content: AppMain.t("CONFIRM_REBOOT_PROMPT", "global"),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm: {
                text: AppMain.t("OK", "global"),
                action: function () {
                    CtrlActionSystemReboot.reboot();
                    CtrlActionSystemReboot.controller.userLogout();
                    return true;
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

    AppMain.html.updateElements([".mdl-button"]);
};


CtrlActionSystemReboot.reboot = function () {
    "use strict";

    let data = AppMain.html.getFormData("#SystemSettingsForm");
    if (defined(data.rebootType)) {
        AppMain.dialog("SYS_REBOOT_WARNING", "warning");
        AppMain.ws().exec("ExecuteAction", {"Reboot": data.rebootType});

        // Waiting for WS to boot-up
        let interval;
        interval = setInterval(function () {
            $.get(AppMain.getUrl("base") + "/soap/").success(function (resp) {
                dmp("Success");
                dmp(resp);
                clearTimeout(interval);
                //window.location = AppMain.getUrl("app") + "#SystemSettings";
            }).error(function (response) {
                dmp("Error occurred ... WS down! --> " + response.status);
                dmp(response);
                if (response.status === 405) {
                    window.location = AppMain.getUrl("app") + "#SystemSettings";
                }
            });
        }, 4000);
    }
};

module.exports.CtrlActionSystemReboot = CtrlActionSystemReboot;