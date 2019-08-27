/**
 * @class CtrlActionWANEthernet Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionWANEthernet = Object.create(new modulecontrolleraction.IControllerAction());
const moment = require("moment");
const build = require("../build.info");
const download = require("./vendor/download.js");

CtrlActionWANEthernet.formId = "WANEthernetForm";
CtrlActionWANEthernet.exec = function () {
    "use strict";

    this.view.setTitle("WAN_ETHERNET");

    let params = AppMain.ws().exec("GetParameters", {"wan2": ""}).getResponse(false);
    params = defined(params.GetParametersResponse.wan2)
        ? params.GetParametersResponse.wan2
        : {};

    this.view.render(this.controller.action, {
        title: AppMain.t("WAN2", "WAN_ETHERNET"),
        params: params,
        elements: {
            enable: AppMain.html.formElementSwitch("enable", "true", {
                checked: params.enable === "true",
                labelClass: "switchEnable",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionWANEthernet.useInterface"
                }
            }),
            ipConfigIpv6: AppMain.html.formElementSwitch("ip-config-ipv6", "true", {
                checked: params["ip-config-ipv6"] === "true",
                labelClass: "ipConfigIpv6"
            }),
            dhcp: AppMain.html.formElementSwitch("ip-config-client-dhcp", "true", {
                checked: params["ip-config-client-dhcp"] === "true",
                labelClass: "ipConfigClientDhcp",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionWANEthernet.useDHCP",
                    "data-rbac-element": "wan2.dhcp"
                }
            })
        },
        labels: {
            "apply": AppMain.t("APPLY", "global"),
            "exportParams": AppMain.t("EXP_PARAMS", "global"),
            "importParams": AppMain.t("IMP_PARAMS", "global"),
            "connectionType": AppMain.t("CONN_TYPE", "WAN_ETHERNET"),
            "ethernetMode": AppMain.t("ETHERNET_MODE", "WAN_ETHERNET"),
            "ethernetSpeed": AppMain.t("ETHERNET_SPEED", "WAN_ETHERNET"),
            "enable": AppMain.t("ENABLED", "global"),
            "ipConfigIp": AppMain.t("IP_ADDRESS", "WAN_ETHERNET"),
            "ipConfigGateway": AppMain.t("GATEWAY", "WAN_ETHERNET"),
            "ipConfigIpv6Addr": AppMain.t("IP_ADDRESS", "WAN_ETHERNET"),
            "Ipv6netmask": AppMain.t("MASK", "WAN_ETHERNET"),
            "ipConfigDns1": AppMain.t("DNS1", "WAN_ETHERNET"),
            "ipConfigDns2": AppMain.t("DNS2", "WAN_ETHERNET"),
            "netmask": AppMain.t("MASK", "WAN_ETHERNET"),
            "groupTitleIPv4": AppMain.t("IPv4", "WAN_ETHERNET"),
            "groupTitleIPv6": AppMain.t("IPv6", "WAN_ETHERNET"),
            "dhcpServer": AppMain.t("DHCP", "WAN_ETHERNET")
        }
    });

    // Show interface as: enabled/disabled
    CtrlActionWANEthernet.enableInterface(params.enable === "true", params["ip-config-client-dhcp"] === "true");
    AppMain.html.updateElements([".mdl-textfield"]);
    setTimeout(function () {
        $(".just-number").on("input", function () {
            const nonNumReg = /[^0-9]/g;
            $(this).val($(this).val().replace(nonNumReg, ""));
            const v = parseInt($(this).val(), 10);
            if (v > 128) {
                $(this).val("128");
            }
        });
    }, 100);
};

/**
 * Form element callback: enable/disable interface.
 */
CtrlActionWANEthernet.useInterface = function () {
    "use strict";

    // Show interface: enabled/disabled
    const switchButton = document.querySelector(".mdl-js-switch").MaterialSwitch;
    let enabled = $("[name='enable']").val() === "true";
    if (enabled === true) {
        $.confirm({
            title: AppMain.t("WAN2", "WAN_ETHERNET"),
            content: AppMain.t("CONFIRM_PROMPT", "global"),
            useBootstrap: false,
            theme: "material",
            buttons: {
                confirm: {
                    text: AppMain.t("OK", "global"),
                    action: function () {
                        CtrlActionWANEthernet.enableInterface(!enabled, $("[name='ip-config-client-dhcp']").val() === "true");
                        if (enabled) {
                            switchButton.off();
                        } else {
                            switchButton.on();
                        }
                        CtrlActionWANEthernet.setParams();
                        return true;
                    }
                },
                cancel: {
                    text: AppMain.t("CANCEL", "global"),
                    action: function () {
                        switchButton.on(); //IE fix
                        return true;
                    }
                }
            }
        });
    } else {
        CtrlActionWANEthernet.enableInterface(!enabled, $("[name='ip-config-client-dhcp']").val() === "true");
        if (enabled) {
            switchButton.off();
        } else {
            switchButton.on();
        }
        CtrlActionWANEthernet.setParams();
    }
};

/**
 * Form element callback: enable/disable DHCP.
 */
CtrlActionWANEthernet.useDHCP = function () {
    "use strict";

    // Show interface: enabled/disabled
    const switchButton = document.querySelector(".ipConfigClientDhcp").MaterialSwitch;

    let enabled = $("[name='ip-config-client-dhcp']").val() === "true";

    CtrlActionWANEthernet.enableInterface($("[name='enable']").val() === "true", !enabled);
    if (enabled) {
        switchButton.off();
    } else {
        switchButton.on();
    }

    const response = AppMain.ws().exec("SetParameters", {
        "wan2": {
            "ip-config-client-dhcp": $("[name='ip-config-client-dhcp']").val()
        }
    }).getResponse(false);
    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("Successfully updated!", "success");
    } else {
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    }

    // CtrlActionWANEthernet.setParams();
};

/**
 * Show interface as enabled/disabled (grayed out).
 * @param {Boolean} enabled
 * @param {Boolean} useDHCP
 */
CtrlActionWANEthernet.enableInterface = function (enabled, useDHCP) {
    "use strict";

    if (!enabled) {
        $("[name='enable']").val(false);
        $("#" + CtrlActionWANEthernet.formId).css({"color": "rgb(150, 150, 150)"});
        $(".dhcp-enabled").css({"color": "rgb(150, 150, 150)"});
        $("tr#FormActions > td").hide();
        $("input[type='text'], input[type='password']").attr("disabled", "disabled");
        $("input[type='checkbox']").each(function (i, elm) {
            if (elm.id !== "enable") {
                $(elm).attr("disabled", "disabled");
            }
        });
        $("label.mdl-switch").addClass("is-disabled");
        AppMain.html.updateElements([".mdl-js-switch"]);
    } else {
        $("[name='enable']").val(true);
        $("[name='ip-config-client-dhcp']").val(useDHCP);
        $("#" + CtrlActionWANEthernet.formId).css({"color": "#000"});
        $("tr#FormActions > td").show();
        if (AppMain.user.getRBACpermissionElement("wan2", "dhcp")) {
            $("input[type='checkbox']").removeAttr("disabled");
            $("label.mdl-switch").removeClass("is-disabled");
        }
        if (useDHCP) {
            $("input[type='text'], input[type='password']").attr("disabled", "disabled");
            $(".is-disabled").removeClass("is-disabled");
            $(".dhcp-enabled").css({"color": "rgb(150, 150, 150)"});
        } else {
            if (AppMain.user.getRBACpermissionElement("wan2", "ip-config-ip")) {
                $("input[type='text'][name='ip-config-ip']").removeAttr("disabled");
            }
            if (AppMain.user.getRBACpermissionElement("wan2", "ip-config-net-mask")) {
                $("input[type='text'][name='ip-config-net-mask']").removeAttr("disabled");
            }
            if (AppMain.user.getRBACpermissionElement("wan2", "ip-config-dns1")) {
                $("input[type='text'][name='ip-config-dns1']").removeAttr("disabled");
            }
            if (AppMain.user.getRBACpermissionElement("wan2", "ip-config-dns2")) {
                $("input[type='text'][name='ip-config-dns2']").removeAttr("disabled");
            }
            if (AppMain.user.getRBACpermissionElement("wan2", "ip-config-ipv6-addr")) {
                $("input[type='text'][name='ip-config-ipv6-addr']").removeAttr("disabled");
            }
            // $( "input[type='text'], input[type='password']" ).removeAttr("disabled");
            $(".dhcp-enabled").css({"color": "#000"});
        }
        setTimeout(function () {
            AppMain.html.updateElements([".mdl-js-switch", ".mdl-textfield"]);
        }, 3000);
    }
    if (AppMain.user.getRBACpermissionElement("wan2", "ip-config-ipv6-addr")) {
        $("input[type='text'][name='ip-config-ipv6-addr']").removeAttr("disabled");
    }
};

CtrlActionWANEthernet.setParams = function () {
    "use strict";

    const dhcpEnabled = $("[name='ip-config-client-dhcp']").val() === "true";
    const ipStr = $("[name='ip-config-ip']").val();
    const maskStr = $("[name='ip-config-net-mask']").val();
    const dns1Str = $("[name='ip-config-dns1']").val();
    const dns2Str = $("[name='ip-config-dns2']").val();
    const ipV6 = $("[name='ip-config-ipv6-addr']").val();
    const re = "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$";
    const reIpV6 = "(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:)" +
            "{1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]" +
            "{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}" +
            "%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|" +
            "([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))";
    if (dhcpEnabled || (ipStr.match(re) && maskStr.match(re) && dns1Str.match(re) && dns2Str.match(re) && (ipV6.match(reIpV6)
            || ipV6 === "---" || ipV6 === ""))) {

        const form = $("#" + CtrlActionWANEthernet.formId);
        let data = form.serialize();
        data = form.deserialize(data);
        data["ip-config-ipv6"] = (defined(data["ip-config-ipv6-addr"]) && data["ip-config-ipv6-addr"] !== "");

        const response = AppMain.ws().exec("SetParameters", {"wan2": data}).getResponse(false);
        if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
            AppMain.dialog("Successfully updated!", "success");
        } else {
            AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
        }
    } else {
        if (!ipStr.match(re)) {
            AppMain.dialog("Please enter correct IP address.", "warning");
        }
        if (!maskStr.match(re)) {
            AppMain.dialog("Please enter correct Subnet mask.", "warning");
        }
        if (!dns1Str.match(re)) {
            AppMain.dialog("Please enter correct DNS server 1.", "warning");
        }
        if (!dns2Str.match(re)) {
            AppMain.dialog("Please enter correct DNS server 2.", "warning");
        }
        if (!(ipV6.match(reIpV6) || ipV6 === "---" || ipV6 === "")) {
            AppMain.dialog("Please enter correct IPv6 IP address.", "warning");
        }
    }
    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionWANEthernet.exportParams = function () {
    "use strict";

    const response = AppMain.ws().exec("GetParameters", {"wan2": ""}).getResponse(false);

    if (defined(response.GetParametersResponse.wan2)) {
        let xml = "<wan2>\n";
        $.each(response.GetParametersResponse.wan2, function (elm, value) {
            xml += "<" + elm + ">" + value + "</" + elm + ">\n";
        });

        xml += "</wan2>";

        const dateStr = moment(new Date()).format(AppMain.localization("EXPORT_DATETIME_FORMAT"));
        download("data:application/xml;charset=utf-8;base64," + btoa(xml), build.device + "_Parameters_Ethernet_" + dateStr + ".xml", "application/xml");
    }
};

module.exports.CtrlActionWANEthernet = CtrlActionWANEthernet;