/**
 * @class CtrlActionSystemUsersRole Controller action using IControllerAction interface.
 */
// var moment = require("moment");
var modulecontrolleraction = require("./IControllerAction");
var moduleapprbac = require("./AppRBAC");
var CtrlActionSystemUsersRole = Object.create(new modulecontrolleraction.IControllerAction);
var X2JS = require("xml-json-parser");

CtrlActionSystemUsersRole.exec = function() {
    this.view.setTitle("SYS_USER_ROLE_MNG");
    var Json2Xml = new X2JS();
    var selectedRole = this.getSelectedRole();
    var selectedRolePermissions = {};

    // Read user roles from DB
    var roles = AppMain.ws().exec("GetUserData", {operation: "ROLE"}).getResponse();
    roles = defined(roles.GetUserDataResponse.role) ? roles.GetUserDataResponse.role : {};
    var rolesList={};

    for(i in roles) {
        rolesList[roles[i]["user-role-name"]] = roles[i]["user-role-name"];
        if (roles[i]["user-role-name"]===selectedRole) {  
            selectedRolePermissions = Json2Xml.xml_str2json( "<role>" + roles[i]["user-role"] + "</role>" );
            selectedRolePermissions = defined(selectedRolePermissions.role) ? selectedRolePermissions.role : null;

            if (selectedRolePermissions)            
                selectedRolePermissions["access-level"] = roles[i]["access-level"];
        }
    }
    

    this.view.render(this.controller.action, {
        _title: AppMain.t("USER_ROLE_MNG", "SYS_USER_ROLE_MNG"),
        html: {
            tableBody: CtrlActionSystemUsersRole._htmlRoleTable(selectedRolePermissions),
            selectRole: AppMain.html.formElementSelect("role", rolesList, {
                    label: AppMain.t("SELECT_USER_ROLE_MNG", "SYS_USER_ROLE_MNG"),
                    elementAttr: " data-bind-event='change' data-bind-method='CtrlActionSystemUsersRole.__changeRole' ",
                    elementSelected: selectedRole
                }
            ),
            inputRole: AppMain.html.formTextInput("roleName", AppMain.t("ROLE_NAME", "SYS_USER_ROLE_MNG"), {
                wrapperAttr: " style='width:70%;' "
            }),
            inputRoleDesc: AppMain.html.formTextInput("roleDesc", AppMain.t("ROLE_DESC", "SYS_USER_ROLE_MNG"), {
                wrapperAttr: " style='width:40%;' "
            })
        },
        label: {
            th1: AppMain.t("PERMISSION_NAME", "SYS_USER_ROLE_MNG"),
            th2: AppMain.t("FULL_CONTROL", "SYS_USER_ROLE_MNG"),
            th3: AppMain.t("READ_ONLY", "SYS_USER_ROLE_MNG"),
            th4: AppMain.t("DISABLED", "SYS_USER_ROLE_MNG"),
            btnSave: AppMain.t("UPDATE_ROLE", "SYS_USER_ROLE_MNG"),
            btnRemove: AppMain.t("REMOVE_ROLE", "SYS_USER_ROLE_MNG"),
            btnAddRole: AppMain.t("ADD_ROLE", "SYS_USER_ROLE_MNG"),
            addNewRole: AppMain.t("ADD_NEW_ROLE", "SYS_USER_ROLE_MNG"),
            updateRole: AppMain.t("UPDATE_ROLE", "SYS_USER_ROLE_MNG")
        }
    });

    this.mode = "update";
    this.changeMode(this.mode);

    AppMain.html.updateElements([".mdl-js-select", ".mdl-textfield__input", ".mdl-radio"]);
};

CtrlActionSystemUsersRole.changeMode = function(mode) {
    if(mode=== undefined || mode.target !== undefined){
        mode.target.MaterialRadio.check();
        mode = $("#SystemUsersRoleForm input[name=\"mode\"]:checked").val();
    }
    if(mode === "update"){
        if(AppMain.user.getRBACpermissionElement("users_roles", "actions")){
            $(".update-option").show();
        }
        $(".add-option").hide();
    }else{
        $(".update-option").hide();
        if(AppMain.user.getRBACpermissionElement("users_roles", "actions")){
            $(".add-option").show();
        }
    }
    return true;
};

/**
 * Binded method callback.
 */
CtrlActionSystemUsersRole.__changeRole = function(event) {
    var $element = $(event.target);
    this.controller.setRequestParam("selectedRole", $element.val());
    this.exec();
};

CtrlActionSystemUsersRole.selectedRole = null;
CtrlActionSystemUsersRole.__selectRBACColumn = function(e) {
    var target = $(e.target).val();

    if(target === "0"){
        $("input.fullControl").prop("checked", true);
    }else{
        if(target === "1"){
            $("input.read").prop("checked", true);
        }else{
            if(target === "2"){
                $("input.disabled").prop("checked", true);
            }
        }
    }
};

CtrlActionSystemUsersRole._htmlRoleTable = function(rolePermissions) {
    var AppRBAC = new moduleapprbac.AppRBAC();
    var tableBody = "";
    var rbac = AppRBAC.getDefaultRBACMap();        
    
    var rbacPermissions = rolePermissions;

    tableBody += "<tr>";
    tableBody += "<td></td>";
    tableBody += "<td><input value='0' name='columnSelect' data-bind-event='click' data-bind-method='SystemUsersRole.__selectRBACColumn' type='radio' /></td>";
    tableBody += "<td><input value='1' name='columnSelect' data-bind-event='click' data-bind-method='SystemUsersRole.__selectRBACColumn' type='radio' /></td>";
    tableBody += "<td><input value='2' name='columnSelect' data-bind-event='click' data-bind-method='SystemUsersRole.__selectRBACColumn' type='radio' /></td>";
    tableBody += "</tr>";

    for (category in rbac) {
        tableBody += "<tr>";
        tableBody += "<td style='background-color:#eee' class='mdl-cell--left'><b>" + AppRBAC.getRBACNameTranslation(category.toUpperCase()) + "</b></td>";
        tableBody += "<td style='background-color:#eee' ></td>";
        tableBody += "<td style='background-color:#eee'></td>";
        tableBody += "<td style='background-color:#eee'></td>";
        tableBody += "</tr>";

        for (item in rbac[category]) {
            var permission = {};
            if (defined(rbacPermissions[category])) {
                permission = {
                    fullControl: (!defined(rbacPermissions[category][rbac[category][item]]) ||
                        rbacPermissions[category][rbac[category][item]] === "*") ? "checked" : "",
                    read: defined(rbacPermissions[category][rbac[category][item]]) &&
                        rbacPermissions[category][rbac[category][item]] === "r" ? "checked" : "",
                    disabled: defined(rbacPermissions[category][rbac[category][item]]) &&
                        rbacPermissions[category][rbac[category][item]] === "h" ? "checked" : ""
                };
            }
            else {
                permission = {fullControl: "checked", read: "", disabled: ""};
            }

            tableBody += "<tr>";
            tableBody += "<td>" + AppRBAC.getRBACNameTranslation(category + "." + rbac[category][item]) + "</td>";
                tableBody += "<td class='inputField_0'><input value='*' class='fullControl' type='radio' name='" + category + "__" + rbac[category][item] + "' " + permission.fullControl + " /></td>";
                tableBody += "<td class='inputField_1'><input value='r' class='read' type='radio' name='" + category + "__" + rbac[category][item] + "' " + permission.read + " /></td>";
                tableBody += "<td class='inputField_2'><input value='h' class='disabled' type='radio' name='" + category + "__" + rbac[category][item] + "' " + permission.disabled + " /></td>";
            tableBody += "</tr>";
        }
    }

    // Webservice access level config
    tableBody += "<tr>";
    tableBody += "<td style='background-color:#eee' class='mdl-cell--left'><b>WEB SERVICE</b></td><td style='background-color:#eee' ></td><td style='background-color:#eee'></td><td style='background-color:#eee'></td>";
    tableBody += "</tr>";

    var accessLevelSelect = AppMain.html.formElementSelect("access-level", [
        " --- ",
        AppMain.t("FULL_ACC", "SYS_USER_ROLE_MNG"),
        AppMain.t("SERVICE_ACC", "SYS_USER_ROLE_MNG"),
        AppMain.t("READ_ONLY_ACC", "SYS_USER_ROLE_MNG")
    ], {
        label: AppMain.t("SELECT_ACC_LEVEL", "SYS_USER_ROLE_MNG"),
        elementSelected: rolePermissions["access-level"]
    });

    tableBody += "<tr>";
    tableBody += "<td>Access level</td>";
    tableBody += "<td></td>";
    tableBody += "<td></td>";
    tableBody += "<td>" + accessLevelSelect + "</td>";
    tableBody += "</tr>";

    return tableBody;
};

CtrlActionSystemUsersRole._getFormData = function() {
    var form = $('#SystemUsersRoleForm');
    var formData = form.serialize();
    return form.deserialize(formData);    
};

CtrlActionSystemUsersRole.readRolePermissionTable = function() {    
    var formData = CtrlActionSystemUsersRole._getFormData();    
    var rolePermissions = {};

    for (item in formData) {        
        if (item.indexOf("__") > 0) {
            var permission = item.split("__");
            if (!defined(rolePermissions[ permission[0] ])) 
                rolePermissions[ permission[0] ] = {};

            rolePermissions[ permission[0] ][ permission[1] ] = formData[item];
        }
    }
    return rolePermissions;
};

CtrlActionSystemUsersRole.__addNewRole = function() {    
    var form = $('#SystemUsersRoleForm');
    var formData = form.serialize();
    formData = form.deserialize(formData);    
    var rolePermissions = CtrlActionSystemUsersRole.readRolePermissionTable();

    if (defined(formData.roleName) && formData.roleName != "") {
        var Json2Xml = new X2JS();
        var xmlPermissions = Json2Xml.json2xml_str(rolePermissions);

        var response = AppMain.ws().exec("SetUserData", {
            operation: "ADD-ROLE",
            "user-role-name": formData.roleName,
            //"role-description": formData.roleDesc,
            "user-role": xmlPermissions,
            "access-level": AppMain.rbac.WS_ACCESS_LEVEL_FULL
        }).getResponse();

        this.controller.setRequestParam("selectedRole", formData.roleName);
        this.exec();
        AppMain.dialog("SUCC_ROLE_ADDED", "success", [formData.roleName]);

    } else {
        AppMain.dialog("PLEASE_ENTER_ROLE_NAME", "warning");
    }
};

CtrlActionSystemUsersRole.__save = function() {
    var formData = CtrlActionSystemUsersRole._getFormData();
    dmp("__FORM_DATA__");
    dmp(formData);

    if (defined(formData.role)) {
        var rolePermissions = CtrlActionSystemUsersRole.readRolePermissionTable();
        var response = AppMain.ws().exec("SetUserData", {
            "operation": "DELETE-ROLE",
            "user-role-name": formData.role
        }).getResponse();

        var Json2Xml = new X2JS();
        var xmlPermissions = Json2Xml.json2xml_str(rolePermissions);

        var response = AppMain.ws().exec("SetUserData", {
            "operation": "ADD-ROLE",
            "user-role-name": formData.role,            
            "user-role": xmlPermissions,
            "access-level": formData["access-level"]
        }).getResponse();

        this.exec();
        AppMain.dialog("SUCC_ROLE_UPDATED", "success");

        dmp("RESPONSE2: ");
        dmp(response);
        dmp(rolePermissions);
        // go to top of the page to see dialog
        this.goToTop();
        location.reload();
    }
};

CtrlActionSystemUsersRole.getSelectedRole = function() {
    return this.controller.getRequestParam("selectedRole") || "admin";
};

CtrlActionSystemUsersRole.__remove = function() {
    
    var roleName = this.getSelectedRole();
    var response = AppMain.ws().exec("SetUserData", {
        "operation": "DELETE-ROLE",
        "user-role-name": roleName
    }).getResponse();

    this.exec();
    AppMain.dialog("SUCC_ROLE_REMOVED", "success", [roleName]);
    // go to top of the page to see dialog
    this.goToTop();
};

CtrlActionSystemUsersRole.goToTop = function() {
    $(".mdl-layout__content").animate({ scrollTop: 0 }, "slow");
};

CtrlActionSystemUsersRole.onAfterExecute = function() {
    dmp("CtrlActionSystemUsersRole.onAfterExecute");
};

CtrlActionSystemUsersRole.onBeforeExecute = function() {
    dmp("CtrlActionSystemUsersRole.onBeforeExecute");
};

CtrlActionSystemUsersRole.init = function() {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);    
};

module.exports.CtrlActionSystemUsersRole = CtrlActionSystemUsersRole;