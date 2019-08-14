/**
 * @class CtrlActionLANEthernet Controller action using IControllerAction interface.
 */
const build = require("../build.info");
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionLANEthernet = Object.create(new modulecontrolleraction.IControllerAction);
const moment = require("moment");
const download = require("./vendor/download.js");

CtrlActionLANEthernet.formId = "LANEthernetForm";
CtrlActionLANEthernet.exec = function() {
    this.view.setTitle("LAN_LOCAL_ETHERNET");

    let params = AppMain.ws().exec("GetParameters", {"iloc":""}).getResponse(false);
    params = defined(params.GetParametersResponse.iloc) ? params.GetParametersResponse.iloc : {};

    
    this.view.render(this.controller.action, {
        _title: AppMain.t("LOCAL_ETH", "LAN_LOCAL_ETHERNET"),
        elements: {
            enable: AppMain.html.formElementSwitch("enable", "true", {
                checked: params.enable === "true",
                labelClass: "switchEnable",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionLANEthernet.__useInterface",
                    "data-rbac-element": "lan.enable"
                }
            }),
            /*ipConfigIpv6: AppMain.html.formElementSwitch("ip-config-ipv6", "true", {
                checked: params["ip-config-ipv6"] === "true",
                labelClass: "ipConfigIpv6"
            }),*/
            ipConfigClientDhcp: AppMain.html.formElementSwitch("dhcp-server", params["dhcp-server"], {
                checked: params["dhcp-server"] === "true",
                labelClass: "ipConfigClientDhcp",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionLANEthernet.__useDHCP",
                    "data-rbac-element": "lan.dhcp"
                }
            })
        },
        params: params,
        labels: {
            "apply": AppMain.t("APPLY", "global"),
            "ipConfigPoolSize": AppMain.t("IP_CONFIG_POOL_SIZE", "LAN_LOCAL_ETHERNET"),
            "enable": AppMain.t("ENABLED", "global"),
            "ipConfigIp": AppMain.t("IP_ADDRESS", "LAN_LOCAL_ETHERNET"),
            "ipConfigGateway": AppMain.t("DEFAULT_GATEWAY", "LAN_LOCAL_ETHERNET"),
            "ipConfigIpv6": AppMain.t("IP_CONFIG_V6", "LAN_LOCAL_ETHERNET"),
            "ipConfigClientDhcp": AppMain.t("DHCP", "LAN_LOCAL_ETHERNET"),
            "ipConfigNetMask": AppMain.t("SUBNET_MASK", "LAN_LOCAL_ETHERNET"),
            "btnExportParams": AppMain.t("EXP_PARAMS", "global")
        }       
    });
    //AppMain.dialog("Section <b>" + this.controller.action + "</b> is not yet supported!", "error");
    // Show interface as: enabled/disabled
    let enabled = params.enable === "true";
    CtrlActionLANEthernet.enableInterface(enabled);
    AppMain.html.updateElements([".mdl-textfield"]);
};

/**
 * Form element callback: enable/disable interface.
 */
CtrlActionLANEthernet.__useInterface = function() {
    // Show interface: enabled/disabled
    let switchButton = document.querySelector('.mdl-js-switch').MaterialSwitch;
    let enabled = $("[name='enable']").val() === "true";

    if(!enabled === false){
        $.confirm({
            title: AppMain.t("LOCAL_ETH", "LAN_LOCAL_ETHERNET"),
            content: AppMain.t("CONFIRM_PROMPT", "global"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm:{
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        CtrlActionLANEthernet.enableInterface(!enabled);
                        (enabled) ? switchButton.off() : switchButton.on();
                        CtrlActionLANEthernet.setParams();
                        return true;
                    }
                } ,
                cancel: {
                    text: AppMain.t("CANCEL", "global"),
                    action:
                        function () {
                            switchButton.on(); //IE fix
                            return true;
                        }
                }
            }
        });
    }else{
        CtrlActionLANEthernet.enableInterface(!enabled);
        (enabled) ? switchButton.off() : switchButton.on();
        CtrlActionLANEthernet.setParams();
    }
};
/**
 * Form element callback: enable/disable dhcp.
 */
CtrlActionLANEthernet.__useDHCP = function() {
    // Show interface: enabled/disabled
    const switchButton = document.querySelector('.ipConfigClientDhcp').MaterialSwitch;
    const dhcp = $("[name='dhcp-server']");
    const enabled = dhcp.val() === "true";
    if(enabled === true){
        switchButton.on(); //IE fix
    }
    (enabled) ? switchButton.off() : switchButton.on();
    dhcp.val(!enabled);
    CtrlActionLANEthernet.setParams();
};

/**
 * Show interface as enabled/disabled (grayed out).
 * @param {Boolean} enabled
 */
CtrlActionLANEthernet.enableInterface = function(enabled) {
    if (!enabled) {
        $("[name='enable']").val(false);
        $( "#" + CtrlActionLANEthernet.formId ).css({"color": "#e5e5e5"});
        $( "tr#FormActions > td").hide();
        $( "input[type='text'], input[type='password']" ).attr("disabled", "disabled");
        $("input[type='checkbox']").each(function(i, elm){
            if (elm.id !== "enable")
                $(elm).attr("disabled", "disabled");            
        });
        $("label.mdl-switch").addClass("is-disabled");
        AppMain.html.updateElements([".mdl-js-switch"]);
    }
    else {                
        $("[name='enable']").val(true);
        $( "#" + CtrlActionLANEthernet.formId ).css({"color": "#000"});
        $( "tr#FormActions > td").show();
        //tukaj še pride RBAC preverjanje
        if(AppMain.user.getRBACpermissionElement("lan", "ip-config-ip")){
            $( "input[type='text'][name='ip-config-ip']" ).removeAttr("disabled");
        }
        if(AppMain.user.getRBACpermissionElement("lan", "ip-config-net-mask")){
            $( "input[type='text'][name='ip-config-net-mask']" ).removeAttr("disabled");
        }
        if(AppMain.user.getRBACpermissionElement("lan", "ip-config-gateway")){
            $( "input[type='text'][name='ip-config-gateway']" ).removeAttr("disabled");
        }
        $("input[type='checkbox'][name='dhcp-server']").removeAttr("disabled");
        $("label.mdl-switch[for='dhcp-server']").removeClass("is-disabled");

        AppMain.html.updateElements([".mdl-js-switch"]);
    }
};

CtrlActionLANEthernet.setParams = function() {
    let ipStr = $("[name='ip-config-ip']").val();
    let maskStr = $("[name='ip-config-net-mask']").val();
    let gwStr = $("[name='ip-config-gateway']").val();
    let re = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$";
    if(ipStr.match(re) && maskStr.match(re) && gwStr.match(re)){
        // dmp("setParams");
        let form = $("#" + CtrlActionLANEthernet.formId);
        let data = form.serialize();
        data = form.deserialize(data);
        // dmp("FormData");
        // dmp(data);

        let response = AppMain.ws().exec("SetParameters", {"iloc": data }).getResponse(false);
        if(defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK")
            AppMain.dialog( "SUCC_UPDATED", "success" );
        else
            AppMain.dialog( "Error occurred: " + response.SetParametersResponse.toString(), "error" );
    }else{
        if(!ipStr.match(re))
            AppMain.dialog("PLEASE_ENTER_CORR", "warning",[AppMain.t("IP_ADDRESS", "LAN_LOCAL_ETHERNET")]);
        if(!maskStr.match(re))
            AppMain.dialog("PLEASE_ENTER_CORR", "warning",[AppMain.t("SUBNET_MASK", "LAN_LOCAL_ETHERNET")]);
        if(!gwStr.match(re))
            AppMain.dialog("PLEASE_ENTER_CORR", "warning",[AppMain.t("DEFAULT_GATEWAY", "LAN_LOCAL_ETHERNET")]);
    }
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionLANEthernet.exportParams = function() {
    let response = AppMain.ws().exec("GetParameters", {"iloc": "" }).getResponse(false);
    if (defined(response.GetParametersResponse.iloc)) {
        let xml="<iloc>\n";
        response.GetParametersResponse.iloc.forEach(function (elm) {
            xml += "<" + elm + ">" + response.GetParametersResponse.iloc[elm] + "</" + elm + ">\n";
        });

        xml += "</iloc>";


        const dateStr = moment(new Date()).format( AppMain.localization("EXPORT_DATETIME_FORMAT") );
        download("data:application/xml;charset=utf-8;base64," + btoa(xml), build.device + "_Parameters_LocalEthernet_"+ dateStr + ".xml", "application/xml");
    }
};

module.exports.CtrlActionLANEthernet = CtrlActionLANEthernet;