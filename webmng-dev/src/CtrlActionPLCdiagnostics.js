/**
 * @class CtrlActionPLCdiagnostics Controller action using IControllerAction interface.
 */
var modulecontrolleraction = require("./IControllerAction");
var CtrlActionPLCdiagnostics = Object.create(new modulecontrolleraction.IControllerAction);

CtrlActionPLCdiagnostics.formId = "PLCdiagnosticsForm";
CtrlActionPLCdiagnostics.exec = function(e) {
    this.view.setTitle("PLC_DIAGNOSTICS");

    this.view.render(this.controller.action, {
        title: AppMain.t("TITLE", "PLC_DIAGNOSTICS"),
        elements: {},
        labels: {
            "apply": AppMain.t("APPLY", "global"),
            "networkSniffer": AppMain.t("NETWORK_SNIFFER", "PLC_DIAGNOSTICS"),
            "serverIP": AppMain.t("SERVER_IP", "PLC_DIAGNOSTICS"),
            "serverPort": AppMain.t("SERVER_PORT", "PLC_DIAGNOSTICS"),
            "snifferMask": AppMain.t("SNIFFER_MASK", "PLC_DIAGNOSTICS"),
            "timestamp": AppMain.t("TIMESTAMP", "PLC_DIAGNOSTICS"),
            "timestampWith": AppMain.t("TIMESTAMP_WITH", "PLC_DIAGNOSTICS"),
            "timestampWithout": AppMain.t("TIMESTAMP_WITHOUT", "PLC_DIAGNOSTICS")
        }
    });
};

CtrlActionPLCdiagnostics.setParams = function(e) {
    const form = $( "#" + CtrlActionPLCdiagnostics.formId );
    let data = form.serialize();
    data = form.deserialize(data);
    if(!defined(data["time-stamp"])){
        data["time-stamp"] = "0"
    }

    const response = AppMain.ws().exec("PlcSnifferSet", data).getResponse();
    if(defined(response.PlcSnifferSetResponse) && response.PlcSnifferSetResponse.toString() === "OK")
        AppMain.dialog( "SUCC_UPDATED", "success" );
    else
        AppMain.dialog( "Error occurred: " + response.SetParametersResponse.toString(), "error" );
    AppMain.html.updateElements([".mdl-button"]);
};

module.exports.CtrlActionPLCdiagnostics = CtrlActionPLCdiagnostics;