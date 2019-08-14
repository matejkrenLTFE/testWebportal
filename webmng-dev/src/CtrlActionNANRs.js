/**
 * @class CtrlActionNANRs Controller action using IControllerAction interface.
 */
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionNANRs = Object.create(new modulecontrolleraction.IControllerAction);
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionNANRs.exec = function() {
    this.view.setTitle("NAN_RS485");

    let params = AppMain.ws().exec("GetParameters", {"rs485":""}).getResponse(false);
    params = defined(params.GetParametersResponse.rs485) ? params.GetParametersResponse.rs485 : {};

    dmp(params);    

    this.view.render(this.controller.action, {
        title: AppMain.t("RS485", "NAN_RS485"),
        params: params,
        labels: {
            baudrate: AppMain.t("BAUD_RATE", "NAN_RS485"),
            dataBits: AppMain.t("DATA_BITS", "NAN_RS485"),
            parity: AppMain.t("PARITY", "NAN_RS485"),
            stopBits: AppMain.t("STOP_BITS", "NAN_RS485"),
            timeout: AppMain.t("TIMEOUT", "NAN_RS485"),
            btnExportParams: AppMain.t("EXP_PARAMS", "global"),
            btnApply: AppMain.t("APPLY", "global")
        }, 
        elements: {
            baudrate: AppMain.html.formElementSelect("baudrate", {"300":"300 bit/s", "600":"600 bit/s", "1200":"1200 bit/s",
                "2400":"2400 bit/s", "4800":"4800 bit/s", "9600":"9600 bit/s", "19200":"19200 bit/s", "38400":"38400 bit/s",
                "57600":"57600 bit/s", "115200":"115200 bit/s" }, {
                label: "",
                elementSelected: params["baudrate"],
                elementAttr: 'data-rbac-element="rs485.baudrate"'
            },undefined,"textfield-short-145 text-align-right"),
            dataBits: AppMain.html.formElementSelect("data-bits", {"7":7, "8":8}, {
                label: "",
                elementSelected: params["data-bits"],
                elementAttr: 'data-rbac-element="rs485.data-bits"'
            },undefined,"textfield-short-145 text-align-right"),
            parity: AppMain.html.formElementSelect("parity", { "PARITY-NONE": AppMain.t("NONE_PARITY", "NAN_RS485"),
                "PARITY-ODD": AppMain.t("ODD_PARITY", "NAN_RS485"), "PARITY-EVEN": AppMain.t("EVEN_PARITY", "NAN_RS485") }, {
                label: "",
                elementSelected: params["parity"],
                elementAttr: 'data-rbac-element="rs485.parity"'
            },undefined,"textfield-short-145 text-align-right"),
            stopBit: AppMain.html.formElementSelect("stop-bits", {"1":1, "2":2}, {
                label: "",
                elementSelected: params["stop-bits"],
                elementAttr: 'data-rbac-element="rs485.stop-bits"'
            },undefined,"textfield-short-145 text-align-right")
        }
    });
};

CtrlActionNANRs.setParams = function() {
    let form = $("#NANRsForm");
    let data = form.serialize();
    data = form.deserialize(data);
    
    let response = AppMain.ws().exec("SetParameters", {"rs485": data }).getResponse(false);
    if(defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK")
        AppMain.dialog( "SUCC_UPDATED", "success" );
    else
        AppMain.dialog( "Error occurred: " + response.SetParametersResponse.toString(), "error" );
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionNANRs.exportParams = function() {
    let response = AppMain.ws().exec("GetParameters", {"rs485": "" }).getResponse(false);

    if (defined(response.GetParametersResponse.rs485)) {
        let xml="<rs485>\n";
        response.GetParametersResponse.rs485.forEach(function (elm) {
            xml += "<" + elm + ">" + response.GetParametersResponse.rs485[elm] + "</" + elm + ">\n";
        });

        xml += "</rs485>";

        const dateStr = moment(new Date()).format( AppMain.localization("EXPORT_DATETIME_FORMAT") );
        download("data:application/xml;charset=utf-8;base64," + btoa(xml), build.device + "_Parameters_RS485_" + dateStr + ".xml", "application/xml");
    }
};

module.exports.CtrlActionNANRs = CtrlActionNANRs;