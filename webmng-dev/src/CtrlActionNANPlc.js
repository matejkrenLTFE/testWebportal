/**
 * @class CtrlActionNANPlc Controller action using IControllerAction interface.
 */
var modulecontrolleraction = require("./IControllerAction");
var CtrlActionNANPlc = Object.create(new modulecontrolleraction.IControllerAction);
var moment = require("moment");
var build = require("../build.info");

CtrlActionNANPlc.formId = "NANPlcForm";
CtrlActionNANPlc.exec = function() {

    this.view.setTitle("NAN_PLC");

    let params = AppMain.ws().exec("GetParameters", {"plc":""}).getResponse();
    params = defined(params.GetParametersResponse.plc) ? params.GetParametersResponse.plc : {};

    this.view.render(this.controller.action, {
        title: AppMain.t("PLC", "NAN_PLC"),
        params: params,
        elements: {
            band: AppMain.html.formElementSelect("band", { "CENELEC_A":"CENELEC_A", "FCC":"FCC" }, {
                label: AppMain.t("SELECT_BAND", "NAN_PLC"),
                elementSelected: params["band"],
                elementAttr: 'data-rbac-element="plc.band"'
            },undefined,"textfield-short-145 text-align-right")
        },
        labels: {
            "panId" : AppMain.t("PAN_ID", "NAN_PLC"),
            "macAddress" : AppMain.t("MAC_ADDRESS", "NAN_PLC"),
            "band" : AppMain.t("FREQ_BAND", "NAN_PLC"),
            "macToneMask" : AppMain.t("MAC_TONE_MASK", "NAN_PLC"),
            "psk" : AppMain.t("PSK", "NAN_PLC"),
            "powerBackOff" : AppMain.t("PLC_POWER_BACK_OFF", "NAN_PLC"),
            "useWhiteList" : AppMain.t("USE_WHITE_LIST", "NAN_PLC"),
            "apply": AppMain.t("APPLY", "global"),
            "btnExportParams": AppMain.t("EXP_PARAMS", "global"),
            "plcModemRestartTooltip": AppMain.t("PLC_MODEM_RESTART", "NAN_PLC")
        }
    }, true); 

};


CtrlActionNANPlc.setParams = function(e) {
    dmp("setParams");
    var form = $("#"+ CtrlActionNANPlc.formId);
    var data = form.serialize();
    data = form.deserialize(data);
    dmp("FormData");
    dmp(data);
    
    var response = AppMain.ws().exec("SetParameters", {"plc": data }).getResponse();
    if(defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK")
        AppMain.dialog( "SUCC_UPDATED", "success" );
    else
        AppMain.dialog( "Error occurred: " + response.SetParametersResponse.toString(), "error" );
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionNANPlc.exportParams = function(e) {
    var response = AppMain.ws().exec("GetParameters", {"plc": "" }).getResponse();
    dmp("EXPORT PARAMS");
    dmp(response);

    if (defined(response.GetParametersResponse.plc)) {
        var xml="<plc>\n";
        for (elm in response.GetParametersResponse.plc) {

            dmp( response.GetParametersResponse.plc[elm] );
            //dmp( response.GetParametersResponse.plc[elm][Object.keys(response.GetParametersResponse.plc[elm])[0]] );
            //dmp(response.GetParametersResponse.plc[elm] instanceof Array);
            
            //if (typeof response.GetParametersResponse.plc[elm] === "object" && response.GetParametersResponse.plc[elm] instanceof Array) {
            if (typeof response.GetParametersResponse.plc[elm] === "object") {
                var key = Object.keys(response.GetParametersResponse.plc[elm])[0];
                if (response.GetParametersResponse.plc[elm][key] instanceof Array) {
                    for(value in response.GetParametersResponse.plc[elm]) {
                        xml += "<" + elm + ">";
                        for (param in response.GetParametersResponse.plc[elm][value]) {
                            xml += "<" + value + ">";
                            xml += response.GetParametersResponse.plc[elm][value][param];
                            xml += "</" + value + ">\n";
                        }
                        xml += "</" + elm + ">\n";
                    }   
                }
                else {
                    xml += "<" + elm + ">";
                    var key = Object.keys(response.GetParametersResponse.plc[elm])[0];
                    xml += "<" + key + ">" + response.GetParametersResponse.plc[elm][key] + "</" + key + ">\n";
                    xml += "</" + elm + ">\n";
                }
                dmp("OBJECT-LOOP");
                dmp(response.GetParametersResponse.plc[elm]);
                dmp(xml);
            }
            else
                xml += "<" + elm + ">" + response.GetParametersResponse.plc[elm] + "</" + elm + ">\n";

        }
        //return;
        xml += "</plc>";
        //return;
        const userRoleName = AppMain.user.getUserData("user-role-name");
        if(userRoleName !== "Factory"){
            //comment some lines
            //mac-address
            xml = xml.replace("<mac-address>","<!--mac-address>");
            xml = xml.replace("</mac-address>","<mac-address-->");
        }
        var download = require("./vendor/download.js");
        var dateStr = moment(new Date()).format( AppMain.localization("EXPORT_DATETIME_FORMAT") );
        download("data:application/xml;charset=utf-8;base64," + btoa(xml), build.device + "_Parameters_PLC_" + dateStr + ".xml", "application/xml");
    }
};

CtrlActionNANPlc.plcModemRestart = function(e) {

    let html = AppMain.t("PLEASE_SELECT", "NAN_PLC") + "<br/><br/>";
    html += AppMain.html.formElementSelect("modem-reset-type", { "NETWORK-PRESERVATION": AppMain.t("NETWORK_PRESERVATION", "NAN_PLC"),
        "NETWORK-RESET": AppMain.t("NETWORK_RESET", "NAN_PLC") }, {
        elementSelected: "NETWORK_PRESERVATION"
    }, "330px") + "<br/><br/>";
    html += AppMain.t("CONFIRM_PLC_MODEM_RESET", "global");

    $.confirm({
        title: AppMain.t("PLC_MODEM_RESTART", "NAN_PLC"),
        content: html,
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm:{
                text: AppMain.t("OK", "global"),
                action: function () {
                    return CtrlActionNANPlc.runPLCModemReset($("#modem-reset-type").val());
                }
            } ,
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {return true;}
            }
        }
    });
};

CtrlActionNANPlc.runPLCModemReset = function(resetType){
    /*const resp = */AppMain.ws().exec("ExecuteAction", {"PlcModemReset": resetType}).getResponse();
    return true;
};

module.exports.CtrlActionNANPlc = CtrlActionNANPlc;