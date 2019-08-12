/**
 * @class CtrlActionSystemFirewallManager Controller action using IControllerAction interface.
 */
var modulecontrolleraction = require("./IControllerAction");
var XMLElement = require("./AppXMLelement");
var CtrlActionSystemFirewallManager = Object.create(new modulecontrolleraction.IControllerAction);

CtrlActionSystemFirewallManager.exec = function(e) {
    this.view.setTitle("SYS_FW_MNG");

    /* there rest will be
    *  waiting for backend
    *  rest for getFirewall rules/settings*/

    var params = AppMain.ws().exec("GetParameters", {"dcmng":""}).getResponse();
    params = defined(params.GetParametersResponse.dcmng) ? params.GetParametersResponse.dcmng : {};

    this.settings ={
        enabled: params["firewall-status"] === "true",
        rules:  defined(params["firewall-rules"]) ? params["firewall-rules"].rule : []
    };

    $.each(this.settings.rules, function(index, rule){
        if(rule["id-number"] === undefined){
            rule["id-number"] = index + 1;
        }
        rule["id-number"] = parseInt(rule["id-number"]);
    });

    this.view.render(this.controller.action, {
        _title: AppMain.t("FW", "SYS_FW_MNG"),
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
CtrlActionSystemFirewallManager.enableFirewall = function() {
    // Show interface: enabled/disabled
    var switchButton = document.querySelector('.mdl-js-switch').MaterialSwitch;
    var enableVal = $("[name='enable']");
    var enabled = enableVal.val() === "true";

    (enabled) ? switchButton.off() : switchButton.on();
    enableVal.val(!enabled);
    this.enableFirewallRest(!enabled);
};

/**
 * rest call for enable/disable firewall
 */
CtrlActionSystemFirewallManager.enableFirewallRest = function (enabled) {
    var client = AppMain.ws();
    client.xmlSetElement("dcmng");
    client.xmlSetParam("firewall-status", enabled);
    var p = client.xmlGetStructure();
    var response = client.exec("SetParameters", p).getResponse();

    if(defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK")
        AppMain.dialog( "SUCC_UPDATED_FW", "success" );
    else
        AppMain.dialog( "Error occurred: " + response.SetParametersResponse.toString(), "error" );
};


/**
 * function builds table html, depending on firewall rules list
 */
CtrlActionSystemFirewallManager.buildTableHtml = function() {
    var html = "";
    var i=1;
    $.each(this.settings.rules, function(index, rule){

        html += "<tr>";
        html += "<td><i class='material-icons cursor-pointer' data-rbac=\"firewall.remove\" " +
            "title='"+ AppMain.t("REMOVE_RULE", "SYS_FW_MNG") + "' " +
            "data-bind-event='click' data-node-ruleId='" + rule["id-number"] + "'" +
            "data-bind-method='CtrlActionSystemFirewallManager.removeFirewallRule'>clear</i> </td>";
        html += "<td>"+rule["id-number"]+"</td>";
        html += "<td>"+rule["Port"]+"</td>";
        html += "<td>"+rule["Protocol"]+"</td>";
        html += "<td>"+rule["Direction"]+"</td>";
        html += "<td>"+rule["Interface"]+"</td>";
        html += "<td>"+rule["Description"]+"</td>";
        html += "<td>" + AppMain.html.formElementSwitch("rule" + rule["id-number"], "rule" + rule["id-number"],
            {checked: rule["Enabled"]==="true", inputAttr:{"data-rbac-element":"firewall.apply"}}) + "</td>";
        html += "</tr>";
        i++;
    });

    return html;
};

/**
 * function show add rule dialog
 */
CtrlActionSystemFirewallManager.showHideAddDialog = function() {
    $(".add-rule-dialog").toggle(500);
};

/**
 * Form element callback for rule adding
 */
CtrlActionSystemFirewallManager.addFirewallRule = function() {
    var rulePort = $("[name='rulePortNumber']").val();
    var ruleProtocol = $("[name='ruleProtocol']").val();
    var ruleDirection = $("[name='ruleDirection']").val();
    var ruleInterface = $("[name='ruleInterface']").val();
    var ruleDescription = $("[name='ruleDescription']").val();
    if(rulePort !== "" && ruleProtocol !== "" && ruleDirection !== ""){
        var ind = this.settings.rules.length > 0? this.settings.rules[this.settings.rules.length-1]["id-number"] + 1:1;
        this.settings.rules.push({"id-number": ind, "Port": rulePort, "Protocol": ruleProtocol, "Direction": ruleDirection,
        "Interface": ruleInterface, "Description":ruleDescription, "Enabled": "false"});
        this.updateTableHtml();
        AppMain.dialog( 'SUCC_RULE_ADDED', "warning" );
        CtrlActionSystemFirewallManager.showHideAddDialog();
    }else{
        if(rulePort === "")
            AppMain.dialog( "PLEASE_ENTER", "warning" ,[AppMain.t("RULE_PORT", "SYS_FW_MNG")]);
        if(ruleProtocol === "")
            AppMain.dialog( "PLEASE_ENTER", "warning" ,[AppMain.t("RULE_PROTOCOL", "SYS_FW_MNG")]);
        if(ruleDirection === "")
            AppMain.dialog( "PLEASE_ENTER", "warning" ,[AppMain.t("RULE_DIR", "SYS_FW_MNG")]);
    }
};

/**
 * Form element callback for rule adding
 */
CtrlActionSystemFirewallManager.removeFirewallRule = function(e) {
    var $this = $(e.target);
    var ruleId = $this.attr("data-node-ruleId");
    ruleId = parseInt(ruleId);
    if(!isNaN(ruleId)){
        for(var i = 0; i < this.settings.rules.length; i++){
            if (this.settings.rules[i]["id-number"] === ruleId){
                this.settings.rules.splice(i,1);
                this.updateTableHtml();
                return;
            }
        }
    }
};

CtrlActionSystemFirewallManager.exportParams = function(e) {
    var data = AppMain.html.getFormData("#FWForm");
    var client = AppMain.ws();
    client.xmlSetElement("dcmng");
    client.xmlSetElement("firewall-rules");

    $.each(this.settings.rules, function(index, rule){
        var value = data["rule" + rule["id-number"]] === "rule" + rule["id-number"];
        var xmlElement = new XMLElement.AppXMLelement();
        xmlElement.xmlSetParam("id-number", rule["id-number"]);
        xmlElement.xmlSetParam("Port", rule["Port"]);
        xmlElement.xmlSetParam("Protocol", rule["Protocol"]);
        xmlElement.xmlSetParam("Direction", rule["Direction"]);
        xmlElement.xmlSetParam("Enabled", value);
        xmlElement.xmlSetParam("Interface", rule["Interface"]);
        xmlElement.xmlSetParam("Description", rule["Description"]);
        client.xmlSetParam("rule", xmlElement.xmlGetStructure());
    });
    var p = client.xmlGetStructure();
    var response = client.exec("SetParameters", p).getResponse();

    dmp("<---[RESP]--->");
    dmp(response);

    //AppMain.dialogBar();

    if(defined(response.SetParametersResponse) && response.SetParametersResponse.toString() === "OK")
        AppMain.dialog( "SUCC_UPDATED", "success" );
    else
        AppMain.dialog( "Error occurred: " + response.SetParametersResponse.toString(), "error" );
};

/**
 * Get select menu options for FW protocol type.
 * @return String
 */
CtrlActionSystemFirewallManager.getFwProtocolSelectOptions = function() {
    var html = "";
    var options = this.getProtocolTypes();
    for (var type in options)
        html += '<option value="' + type + '">' + options[type] + '</option>';
    return html;
};

/**
 * Get select menu options for FW protocol type.
 * @return String
 */
CtrlActionSystemFirewallManager.getFwDirectionSelectOptions = function() {
    var html = "";
    var options = this.getDirectionTypes();
    for (var type in options)
        html += '<option value="' + type + '">' + options[type] + '</option>';
    return html;
};

/**
 * Get select menu options for FW protocol type.
 * @return String
 */
CtrlActionSystemFirewallManager.getFwInterfaceSelectOptions = function() {
    var html = "";
    var options = this.getInterfaceTypes();
    for (var type in options)
        html += '<option value="' + type + '">' + options[type] + '</option>';
    return html;
};

/**
 * Get protocol types.
 * @return Object
 */
CtrlActionSystemFirewallManager.getProtocolTypes = function() {
    return {
        "TCP": AppMain.t("TCP", "SYS_FW_MNG"),
        "UDP": AppMain.t("UDP", "SYS_FW_MNG"),
        "TCP-AND-UDP": AppMain.t("TCP and UDP")
    };
};

/**
 * Get protocol types.
 * @return Object
 */
CtrlActionSystemFirewallManager.getInterfaceTypes = function() {
    return {
        "WAN": AppMain.t("WAN", "SYS_FW_MNG"),
        "LAN": AppMain.t("LAN", "SYS_FW_MNG")
    };
};

/**
 * Get protocol types.
 * @return Object
 */
CtrlActionSystemFirewallManager.getDirectionTypes = function() {
    return {
        "INPUT": AppMain.t("INPUT", "SYS_FW_MNG"),
        "OUTPUT": AppMain.t("OUTPUT", "SYS_FW_MNG")/*,
        "ANY": AppMain.t("ANY")*/
    };
};

/**
 * Update table html content
 */
CtrlActionSystemFirewallManager.updateTableHtml = function() {
    var view = AppMain.getAppComponent("view");
    $("#fwRulesBody").html(this.materializeMyHTML(view.recheckRBAC(this.buildTableHtml())));
    view.rebindElementEvents();
};

CtrlActionSystemFirewallManager.materializeMyHTML = function(str){

    var html = $.parseHTML(str);

    $('*', $(html)).each(function () {

        componentHandler.upgradeElement(this);

    });

    return html;

};

module.exports.CtrlActionSystemFirewallManager = CtrlActionSystemFirewallManager;