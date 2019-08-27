/**
 * @class CtrlActionSystemSettingsExport Controller action using IControllerAction interface.
 */

/* global AppMain, $, vkbeautify, DOMParser, defined, dmp */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemSettingsExport = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");
const X2JS = require("xml-json-parser");
const Json2Xml = new X2JS();

CtrlActionSystemSettingsExport.exec = function () {
    "use strict";

    this.view.setTitle("SYS_SETTINGS_EXP_IMP");

    const params = AppMain.ws().exec("GetParameters", undefined).getResponse(false);
    dmp(params);
    let inputs = "";
    if (defined(params.GetParametersResponse)) {
        $.each(params.GetParametersResponse, function (category) {
            inputs += "-- " + category;
        });
    }
    this.params = "";

    this.view.render(this.controller.action, {
        title: AppMain.t("SYS_SETTINGS_EXP_IMP", "SYS_SETTINGS_EXP_IMP"),
        labels: {
            btnUpdate: AppMain.t("UPDATE", "SYS_SETTINGS_EXP_IMP"),
            cancel: AppMain.t("CANCEL", "global"),
            importFile: AppMain.t("IMPORT_FILE", "global"),
            btnExportParams: AppMain.t("EXPORT_PARAMS", "SYS_SETTINGS_EXP_IMP"),
            exportSettings: AppMain.t("EXPORT_SETTINGS", "SYS_SETTINGS_EXP_IMP"),
            importSettings: AppMain.t("IMPORT_SETTINGS", "SYS_SETTINGS_EXP_IMP"),
            uploadFile: AppMain.t("UPLOAD_FILE", "SYS_SETTINGS_EXP_IMP"),
            exportFactoryDefaults: AppMain.t("CREATE_DEFAULT_FAC_SET_FILE", "SYS_SETTINGS_EXP_IMP"),
            catIloc: AppMain.t("LOCAL_ETHERNET", "SYS_SETTINGS_EXP_IMP"),
            catIPlc: AppMain.t("PLC", "SYS_SETTINGS_EXP_IMP"),
            catWan1: AppMain.t("MODEM", "SYS_SETTINGS_EXP_IMP"),
            catWan2: AppMain.t("ETHERNET", "SYS_SETTINGS_EXP_IMP"),
            catRs485: AppMain.t("RS485", "SYS_SETTINGS_EXP_IMP"),
            catCntr: AppMain.t("SYSTEM", "SYS_SETTINGS_EXP_IMP"),
            catDcmng: AppMain.t("SYSTEM", "SYS_SETTINGS_EXP_IMP"),
            app: AppMain.t("APPLICATION", "SYS_SETTINGS_EXP_IMP"),
            gwpd: AppMain.t("GWPD", "SYS_SETTINGS_EXP_IMP"),
            macd: AppMain.t("MACD", "SYS_SETTINGS_EXP_IMP"),
            csmd: AppMain.t("CSMD", "SYS_SETTINGS_EXP_IMP")
        }
    });

    let inputElement = document.getElementById("file");
    inputElement.addEventListener("change", function () {
        if (!AppMain.user.getRBACpermissionElement("settings_import_export", "import")) {
            return;
        }
        let uploadElement = this;
        let reader = new FileReader();
        reader.onload = function (e) {
            CtrlActionSystemSettingsExport.params = e.target.result;
        };

        reader.readAsText(uploadElement.files[0]);
        $(".select-file").hide();
        $("#file-name").html(uploadElement.files[0].name);
        $(".file-selected").show();
    }, false);

    // Select all parameters handler
    AppMain.html.formCheckboxSelectAll("SystemSettingsExport", "selectAllCheckbox");
};

CtrlActionSystemSettingsExport.importFile = function () {
    "use strict";

    if (!AppMain.user.getRBACpermissionElement("settings_import_export", "import")) {
        return;
    }
    const setFactoryDefaults = $("#create-factory-file").is(":checked");
    let paramPom = "";
    if (setFactoryDefaults) {
        paramPom += "<create-factory-file>true</create-factory-file>";
    }

    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(this.params, "text/xml");
    let childNodes = xmlDoc.childNodes;
    if (childNodes.length === 1 && childNodes[0].nodeName === "parameters") {
        paramPom += childNodes[0].innerHTML;
    } else {
        paramPom += this.params;
    }
    CtrlActionSystemSettingsExport.setParams(paramPom);
};

CtrlActionSystemSettingsExport.importCancel = function () {
    "use strict";

    $(".select-file").show();
    $("#file-name").html("");
    $("#file").val("");
    $(".file-selected").hide();
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionSystemSettingsExport.setParams = function (params) {
    "use strict";

    const result = AppMain.ws().exec("SetParameters", params).getResponse(false);
    if (defined(result.SetParametersResponse) && result.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPLOAD_PARAMS_SET", "success");
    } else {
        AppMain.dialog("ERR_UPLOAD_PARAMS_SET", "error");
    }
    document.getElementById("SystemSettingsExport").reset();
    AppMain.html.updateAllElements();
};

CtrlActionSystemSettingsExport.exportParams = function () {
    "use strict";

    const expNameMap = {
        "iloc": AppMain.t("LOCAL_ETHERNET", "SYS_SETTINGS_EXP_IMP"),
        "wan1": AppMain.t("MODEM", "SYS_SETTINGS_EXP_IMP"),
        "wan2": AppMain.t("ETHERNET", "SYS_SETTINGS_EXP_IMP"),
        "plc": AppMain.t("PLC", "SYS_SETTINGS_EXP_IMP"),
        "rs485": "RS485",
        "dcmng": AppMain.t("SYSTEM", "SYS_SETTINGS_EXP_IMP"),
        "app": AppMain.t("APPLICATION", "SYS_SETTINGS_EXP_IMP"),
        "gwpd": AppMain.t("GWPD_SHORT", "SYS_SETTINGS_EXP_IMP"),
        "macd": AppMain.t("MACD_SHORT", "SYS_SETTINGS_EXP_IMP"),
        "csmd": AppMain.t("CSMD", "SYS_SETTINGS_EXP_IMP")
    };

    const params = AppMain.ws().exec("GetParameters", {}).getResponse(false);

    const form = $("#SystemSettingsExport");
    let formData = form.serialize();
    formData = form.deserialize(formData);

    if (defined(params.GetParametersResponse) && Object.keys(formData).length > 0) {
        let xml = "";
        let exportCategories = [];

        // DCMNG & CTRDM are considered the same parameters group
        // if ether is selected enable both.
        /*eslint-disable camelcase*/
        if (defined(formData.export_dcmng) || defined(formData.export_cntr)) {
            formData.export_dcmng = "on";
            formData.export_cntr = "on";
        }
        /*eslint-enable camelcase*/
        $.each(params.GetParametersResponse, function (cat, value) {
            if (defined(formData["export_" + cat])) {
                exportCategories[exportCategories.length] = defined(expNameMap[cat])
                    ? expNameMap[cat]
                    : cat;
                xml += "<" + cat + ">\n";
                xml += Json2Xml.json2xml_str(value).replace(new RegExp("&#x2F;", "g"), "/");
                xml += "</" + cat + ">\n";
            }
        });

        if (xml) {
            xml = "<parameters>\n" + xml + "</parameters>";
            const userRoleName = AppMain.user.getUserData("user-role-name");
            if (userRoleName !== "Factory") {
                //comment some lines
                //factory-number
                xml = xml.replace("<factory-number>", "<!--factory-number>");
                xml = xml.replace("</factory-number>", "<factory-number-->");
                //device-type
                xml = xml.replace("<device-type>", "<!--device-type>");
                xml = xml.replace("</device-type>", "<device-type-->");
                //device-type
                xml = xml.replace("<production-date>", "<!--production-date>");
                xml = xml.replace("</production-date>", "<production-date-->");
                //mac-address
                xml = xml.replace("<mac-address>", "<!--mac-address>");
                xml = xml.replace("</mac-address>", "<mac-address-->");
            }
            xml = vkbeautify.xml(xml, 2);
            //AC750_Parameters_iloc_YYYY-MM-DD-HH-MM-SS
            const dateStr = moment(new Date()).format(AppMain.localization("EXPORT_DATETIME_FORMAT"));
            const filename = build.device + "_Parameters_" + exportCategories.join("_").replace("_cntr", "") + "_" + dateStr + ".xml";
            download("data:application/xml;charset=utf-8;base64," + btoa(xml), filename, "application/xml");
        }
    } else {
        AppMain.dialog("SELECT_PARAMETERS_TO_EXPORT", "warning");
    }


    AppMain.html.updateElements([".mdl-button"]);

};

module.exports.CtrlActionSystemSettingsExport = CtrlActionSystemSettingsExport;