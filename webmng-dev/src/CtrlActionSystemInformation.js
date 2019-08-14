/**
 * @class CtrlActionSystemInformation Controller action using IControllerAction interface.
 */
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemInformation = Object.create(new modulecontrolleraction.IControllerAction);
//var fs = require("fs");

CtrlActionSystemInformation.exec = function() {    
    this.view.setTitle("SYS_INFO");

     let generalInfo = {
        system: {},
        wan: {},
        PLC:{}
    };

    let info = AppMain.ws().getResponseCache("GetInfos", undefined);
    // Prepare params
    $.each(info.GetInfosResponse.info, function(i, obj){	
        if (typeof generalInfo[obj.category] !== "undefined")		
            generalInfo[obj.category][obj.name] = (!obj.value) ? "---" : obj.value;
    });
    //this.view.renderSection("default.dashboard#SectionSecondaryMenu", ".page-title", {}, true);
    dmp(generalInfo);
    this.view.render(this.controller.action, {
        title: AppMain.t("SYS_INFO", "SYS_INFO"),
        paramsSys: generalInfo.system,
        paramsPlc: generalInfo.PLC,
        paramsWan: generalInfo.wan,
        labels: {
            linuxVersion: AppMain.t("LINUX_VER", "SYS_INFO"),
            fwLibraryVersion: AppMain.t("FIRMWARE_LIBRARY_VER", "SYS_INFO"),
            applicationPackage: AppMain.t("APP_PACK", "SYS_INFO"),
            webservice: AppMain.t("WEBSERVICE", "SYS_INFO"),
            apacheVersion: AppMain.t("APACHE_VER", "SYS_INFO"),
            productionDate: AppMain.t("PRODUCTION_DATE", "SYS_INFO"),
            webPortal: AppMain.t("WEBPORTAL_VER", "SYS_INFO"),
            imageVersion: AppMain.t("IMG_VER", "SYS_INFO"),
            U_Boot: AppMain.t("U_BOOT", "SYS_INFO"),
            plcInfo: AppMain.t("G3PLC_MOD_VER", "SYS_INFO"),
            modemType: AppMain.t("MODEM_TYPE", "SYS_SETTINGS"),
            version: AppMain.t("VERSION", "SYS_SETTINGS")
        }
    });
};

module.exports.CtrlActionSystemInformation = CtrlActionSystemInformation;