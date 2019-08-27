/**
 * @class CtrlActionSystemFirewallManager Controller action using IControllerAction interface.
 */

/* global AppMain, $, dmp, defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
const XMLElement = require("./AppXMLelement");
let CtrlActionSystemFirewallManager = Object.create(new modulecontrolleraction.IControllerAction());

CtrlActionSystemFirewallManager.exec = function () {
    "use strict";

    this.view.setTitle("SYS_FW_MNG");

    let params = AppMain.ws().exec("GetParameters", {"dcmng": ""}).getResponse(false);
    params = defined(params.GetParametersResponse.dcmng)
        ? params.GetParametersResponse.dcmng
        : {};

    this.settings = {
        enabled: params["firewall-status"] === "true",
        rules: defined(params["firewall-rules"])
            ? params["firewall-rules"].rule
            : []
    };

    $.each(this.settings.rules, function (index, rule) {
        if (rule["id-number"] === undefined) {
            rule["id-number"] = index + 1;
        }
        rule["id-number"] = parseInt(rule["id-number"]);
    });

    this.view.render(this.controller.action, {
        title: AppMain.t("FW", "SYS_FW_MNG"),
        elements: {
            enable: AppMain.html.formElementSwitch("enable", "true", {
                checked: this.settings.enabled === true,
                labelClass: "switchEnable",
                inputAttr: {
                    "data-bind-event": "click",
                    "data-bind-method": "CtrlActionSystemFirewallManager.enableFirewall",
                    "data-rbac-element": "firewall.enable"
                }
            })
        },
        tableHtml: this.buildTableHtml(),
        settings: this.settings,
        formSelectProtocolTypeOptions: this.getFwProtocolSelectOptions(),
        formSelectDirectionTypeOptions: this.getFwDirectionSelectOptions(),
        formSelectInterfaceTypeOptions: this.getFwInterfaceSelectOptions(),
        labels: {
            "firewallRules": AppMain.t("FW_RULES", "SYS_FW_MNG"),
            "addFirewallRule": AppMain.t("ADD_FW_RULE", "SYS_FW_MNG"),
            "btnAddFWRule": AppMain.t("ADD_RULE", "SYS_FW_MNG"),
            "ruleID": AppMain.t("ID_NMB", "SYS_FW_MNG"),
            "rulePort": AppMain.t("PORT", "SYS_FW_MNG"),
            "ruleProtocol": AppMain.t("PROTOCOL", "SYS_FW_MNG"),
            "ruleDirection": AppMain.t("DIRECTION", "SYS_FW_MNG"),
            "ruleInterface": AppMain.t("INTERFACE", "SYS_FW_MNG"),
            "ruleInterface1": AppMain.t("INTERFACE", "SYS_FW_MNG"),
            "ruleDescription": AppMain.t("DESC", "SYS_FW_MNG"),
            "ruleDescription1": AppMain.t("DESC", "SYS_FW_MNG"),
            "rulePort1": AppMain.t("PORT", "SYS_FW_MNG"),
            "ruleProtocol1": AppMain.t("PROTOCOL", "SYS_FW_MNG"),
            "ruleDirection1": AppMain.t("DIRECTION", "SYS_FW_MNG"),
            "btnApplyPermanently": AppMain.t("APPLY_RULES", "SYS_FW_MNG")
        }
    });
};

/**
 * Form element callback: enable/disable firewall.
 */
CtrlActionSystemFirewallManager.enableFirewall = function () {
    "use strict";

    // Show interface: enabled/disabled
    const switchButton = document.querySelector(".mdl-js-switch").MaterialSwitch;
    const enableVal = $("[name='enable']");
    const enabled = enableVal.val() === "true";

    if (enabled) {
        switchButton.off();
    } else {
        switchButton.on();
    }
    enableVal.val(!enabled);
    this.enableFirewallRest(!enabled);
};

/**
 * rest call for enable/disable firewall
 */
CtrlActionSystemFirewallManager.enableFirewallRest = function (enabled) {
    "use strict";

    let client = AppMain.ws();
    client.xmlSetElement("dcmng");
    client.xmlSetParam("firewall-status", enabled);
    let p = client.xmlGetStructure();
    const response = client.exec("SetParameters", p).getResponse(false);

    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED_FW", "success");
    } else {
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    }
};


/**
 * function builds table html, depending on firewall rules list
 */
CtrlActionSystemFirewallManager.buildTableHtml = function () {
    "use strict";

    let html = "";
    let i = 1;
    $.each(this.settings.rules, function (index, rule) {

        html += "<tr>";
        html += "<td><i class='material-icons cursor-pointer' data-rbac=\"firewall.remove\" " +
                "title='" + AppMain.t("REMOVE_RULE", "SYS_FW_MNG") + "' " +
                "data-bind-event='click' data-node-ruleId='" + rule["id-number"] + "'" +
                " data-bind-method='CtrlActionSystemFirewallManager.removeFirewallRule'>clear</i> </td>";
        html += "<td>" + rule["id-number"] + "</td>";
        html += "<td>" + rule.Port + "</td>";
        html += "<td>" + rule.Protocol + "</td>";
        html += "<td>" + rule.Direction + "</td>";
        html += "<td>" + rule.Interface + "</td>";
        html += "<td>" + rule.Description + "</td>";
        html += "<td>" + AppMain.html.formElementSwitch("rule" + rule["id-number"], "rule" + rule["id-number"],
                {checked: rule.Enabled === "true", inputAttr: {"data-rbac-element": "firewall.apply"}}) + "</td>";
        html += "</tr>";
        i += 1;
    });

    return html;
};

/**
 * function show add rule dialog
 */
CtrlActionSystemFirewallManager.showHideAddDialog = function () {
    "use strict";

    $(".add-rule-dialog").toggle(500);
};

/**
 * Form element callback for rule adding
 */
CtrlActionSystemFirewallManager.addFirewallRule = function () {
    "use strict";

    let rulePort = $("[name='rulePortNumber']").val();
    let ruleProtocol = $("[name='ruleProtocol']").val();
    let ruleDirection = $("[name='ruleDirection']").val();
    let ruleInterface = $("[name='ruleInterface']").val();
    let ruleDescription = $("[name='ruleDescription']").val();
    if (rulePort !== "" && ruleProtocol !== "" && ruleDirection !== "") {
        let ind = this.settings.rules.length > 0
            ? this.settings.rules[this.settings.rules.length - 1]["id-number"] + 1
            : 1;
        this.settings.rules.push({
            "id-number": ind,
            "Port": rulePort,
            "Protocol": ruleProtocol,
            "Direction": ruleDirection,
            "Interface": ruleInterface,
            "Description": ruleDescription,
            "Enabled": "false"
        });
        this.updateTableHtml();
        AppMain.dialog("SUCC_RULE_ADDED", "warning");
        CtrlActionSystemFirewallManager.showHideAddDialog();
    } else {
        if (rulePort === "") {
            AppMain.dialog("PLEASE_ENTER", "warning", [AppMain.t("RULE_PORT", "SYS_FW_MNG")]);
        }
        if (ruleProtocol === "") {
            AppMain.dialog("PLEASE_ENTER", "warning", [AppMain.t("RULE_PROTOCOL", "SYS_FW_MNG")]);
        }
        if (ruleDirection === "") {
            AppMain.dialog("PLEASE_ENTER", "warning", [AppMain.t("RULE_DIR", "SYS_FW_MNG")]);
        }
    }
};

/**
 * Form element callback for rule adding
 */
CtrlActionSystemFirewallManager.removeFirewallRule = function (e) {
    "use strict";

    let $this = $(e.target);
    let ruleId = $this.attr("data-node-ruleId");
    ruleId = parseInt(ruleId);
    if (!Number.isNaN(ruleId)) {
        const self = this;
        this.settings.rules.forEach(function (item, i) {
            if (item["id-number"] === ruleId) {
                self.settings.rules.splice(i, 1);
                this.updateTableHtml();
            }
        });
    }
};

CtrlActionSystemFirewallManager.exportParams = function () {
    "use strict";

    let data = AppMain.html.getFormData("#FWForm");
    let client = AppMain.ws();
    client.xmlSetElement("dcmng");
    client.xmlSetElement("firewall-rules");

    $.each(this.settings.rules, function (index, rule) {
        let value = data["rule" + rule["id-number"]] === "rule" + rule["id-number"];
        let xmlElement = new XMLElement.AppXMLelement();
        xmlElement.xmlSetParam("id-number", rule["id-number"]);
        xmlElement.xmlSetParam("Port", rule.Port);
        xmlElement.xmlSetParam("Protocol", rule.Protocol);
        xmlElement.xmlSetParam("Direction", rule.Direction);
        xmlElement.xmlSetParam("Enabled", value);
        xmlElement.xmlSetParam("Interface", rule.Interface);
        xmlElement.xmlSetParam("Description", rule.Description);
        client.xmlSetParam("rule", xmlElement.xmlGetStructure());
    });
    let p = client.xmlGetStructure();
    const response = client.exec("SetParameters", p).getResponse(false);

    dmp("<---[RESP]--->");
    dmp(response);

    //AppMain.dialogBar();

    if (defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK") {
        AppMain.dialog("SUCC_UPDATED", "success");
    } else {
        AppMain.dialog("Error occurred: " + response.SetParametersResponse.toString(), "error");
    }
};

/**
 * Get select menu options for FW protocol type.
 * @return String
 */
CtrlActionSystemFirewallManager.getFwProtocolSelectOptions = function () {
    "use strict";

    let html = "";
    let options = this.getProtocolTypes();
    $.each(options, function (index, value) {
        html += "<option value=\"" + index + "\">" + value + "</option>";
    });
    return html;
};

/**
 * Get select menu options for FW protocol type.
 * @return String
 */
CtrlActionSystemFirewallManager.getFwDirectionSelectOptions = function () {
    "use strict";

    let html = "";
    let options = this.getDirectionTypes();
    $.each(options, function (index, value) {
        html += "<option value=\"" + index + "\">" + value + "</option>";
    });
    return html;
};

/**
 * Get select menu options for FW protocol type.
 * @return String
 */
CtrlActionSystemFirewallManager.getFwInterfaceSelectOptions = function () {
    "use strict";

    let html = "";
    let options = this.getInterfaceTypes();
    $.each(options, function (index, value) {
        html += "<option value=\"" + index + "\">" + value + "</option>";
    });
    return html;
};

/**
 * Get protocol types.
 * @return Object
 */
CtrlActionSystemFirewallManager.getProtocolTypes = function () {
    "use strict";

    return {
        "TCP": AppMain.t("TCP", "SYS_FW_MNG"),
        "UDP": AppMain.t("UDP", "SYS_FW_MNG"),
        "TCP-AND-UDP": AppMain.t("TCP and UDP", undefined)
    };
};

/**
 * Get protocol types.
 * @return Object
 */
CtrlActionSystemFirewallManager.getInterfaceTypes = function () {
    "use strict";

    return {
        "WAN": AppMain.t("WAN", "SYS_FW_MNG"),
        "LAN": AppMain.t("LAN", "SYS_FW_MNG")
    };
};

/**
 * Get protocol types.
 * @return Object
 */
CtrlActionSystemFirewallManager.getDirectionTypes = function () {
    "use strict";

    return {
        "INPUT": AppMain.t("INPUT", "SYS_FW_MNG"),
        "OUTPUT": AppMain.t("OUTPUT", "SYS_FW_MNG")/*,
        "ANY": AppMain.t("ANY")*/
    };
};

/**
 * Update table html content
 */
CtrlActionSystemFirewallManager.updateTableHtml = function () {
    "use strict";

    const view = AppMain.getAppComponent("view");
    $("#fwRulesBody").html(this.materializeMyHTML(view.recheckRBAC(this.buildTableHtml())));
    view.rebindElementEvents();
};

CtrlActionSystemFirewallManager.materializeMyHTML = function (str) {
    "use strict";

    let html = $.parseHTML(str);

    $("*", $(html)).each(function () {

        componentHandler.upgradeElement(this);

    });

    return html;

};

module.exports.CtrlActionSystemFirewallManager = CtrlActionSystemFirewallManager;