/**
 * @class CtrlActionSystemReboot Controller action using IControllerAction interface.
 */
var modulecontrolleraction = require("./IControllerAction");
var CtrlActionSystemReboot = Object.create(new modulecontrolleraction.IControllerAction);

CtrlActionSystemReboot.exec = function(e) {
    this.view.setTitle("SYS_REBOOT");
    
    this.view.render(this.controller.action, {
        _title: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
        labels: {
            btnReboot: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
            lbReboot: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
            rebootType: AppMain.t("SYS_REBOOT_TYPE", "SYS_SETTINGS"),
            rebootTypeSavedParams: AppMain.t("REBOOT_SAVED_PARAMS", "SYS_SETTINGS"),
            rebootTypeDefaultParams: AppMain.t("REBOOT_DEFAULT_PARAMS", "SYS_SETTINGS")
        }
    });
};


CtrlActionSystemReboot.systemReboot = function(e) {
    if(!AppMain.user.getRBACpermissionElement("settings", "reboot")){
        return;
    }
    $.confirm({
        title: AppMain.t("SYS_REBOOT", "SYS_SETTINGS"),
        content: AppMain.t("CONFIRM_REBOOT_PROMPT", "global"),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm:{
                text: AppMain.t("OK", "global"),
                action: function () {
                            CtrlActionSystemReboot.reboot();
                            CtrlActionSystemReboot.controller.userLogout();
                            return true;
                        }
            } ,
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {
                        return true;
                    }
            }
        }
    });

    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionSystemReboot.reboot = function() {
    var data = AppMain.html.getFormData("#SystemSettingsForm");
    if (defined(data.rebootType)) {
        AppMain.dialog("SYS_REBOOT_WARNING", "warning");
        AppMain.ws().exec("ExecuteAction", {"Reboot": data.rebootType});

        // Waiting for WS to boot-up

        var interval = setInterval(function(){
            $.get(AppMain.getUrl("base") + "/soap/").success(function(resp){
                dmp("Success");
                dmp(resp);
                killTimeout();
                //window.location = AppMain.getUrl("app") + "#SystemSettings";
            }).error(function(response){
                dmp("Error occurred ... WS down! --> " + response.status);
                dmp(response);
                if (response.status===405) {
                    window.location = AppMain.getUrl("app") + "#SystemSettings";
                }
            });
        }, 4000);
        function killTimeout() {
            clearTimeout(interval);
        }
    }
};

module.exports.CtrlActionSystemReboot = CtrlActionSystemReboot;