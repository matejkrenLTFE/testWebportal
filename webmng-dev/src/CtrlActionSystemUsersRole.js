/**
 * @class CtrlActionSystemUsersRole Controller action using IControllerAction interface.
 */

/* global AppMain, $, defined, dmp */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
const moduleapprbac = require("./AppRBAC");
let CtrlActionSystemUsersRole = Object.create(new modulecontrolleraction.IControllerAction());
const X2JS = require("xml-json-parser");
const Json2Xml = new X2JS();

CtrlActionSystemUsersRole.exec = function () {
    "use strict";

    this.view.setTitle("SYS_USER_ROLE_MNG");
    let selectedRole = this.getSelectedRole();
    let selectedRolePermissions = {};

    // Read user roles from DB
    let roles = AppMain.ws().exec("GetUserData", {operation: "ROLE"}).getResponse(false);
    roles = defined(roles.GetUserDataResponse.role)
        ? roles.GetUserDataResponse.role
        : {};
    let rolesList = {};

    roles.forEach(function (role) {
        rolesList[role["user-role-name"]] = role["user-role-name"];
        if (role["user-role-name"] === selectedRole) {
            selectedRolePermissions = Json2Xml.xml_str2json("<role>" + role["user-role"] + "</role>");
            selectedRolePermissions = defined(selectedRolePermissions.role)
                ? selectedRolePermissions.role
                : null;

            if (selectedRolePermissions) {
                selectedRolePermissions["access-level"] = role["access-level"];
            }
        }
    });

    this.view.render(this.controller.action, {
        title: AppMain.t("USER_ROLE_MNG", "SYS_USER_ROLE_MNG"),
        html: {
            tableBody: CtrlActionSystemUsersRole.htmlRoleTable(selectedRolePermissions),
            selectRole: AppMain.html.formElementSelect("role", rolesList, {
                label: AppMain.t("SELECT_USER_ROLE_MNG", "SYS_USER_ROLE_MNG"),
                elementAttr: " data-bind-event='change' data-bind-method='CtrlActionSystemUsersRole.changeRole' ",
                elementSelected: selectedRole
            }),
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

CtrlActionSystemUsersRole.changeMode = function (mode) {
    "use strict";

    if (mode === undefined || mode.target !== undefined) {
        mode.target.MaterialRadio.check();
        mode = $("#SystemUsersRoleForm input[name=\"mode\"]:checked").val();
    }
    if (mode === "update") {
        if (AppMain.user.getRBACpermissionElement("users_roles", "actions")) {
            $(".update-option").show();
        }
        $(".add-option").hide();
    } else {
        $(".update-option").hide();
        if (AppMain.user.getRBACpermissionElement("users_roles", "actions")) {
            $(".add-option").show();
        }
    }
    return true;
};

/**
 * Binded method callback.
 */
CtrlActionSystemUsersRole.changeRole = function (event) {
    "use strict";

    const $element = $(event.target);
    this.controller.setRequestParam("selectedRole", $element.val());
    this.exec();
};

CtrlActionSystemUsersRole.selectedRole = null;
CtrlActionSystemUsersRole.selectRBACColumn = function (e) {
    "use strict";

    const target = $(e.target).val();
    if (target === "0") {
        $("input.fullControl").prop("checked", true);
    } else {
        if (target === "1") {
            $("input.read").prop("checked", true);
        } else {
            if (target === "2") {
                $("input.disabled").prop("checked", true);
            }
        }
    }
};

CtrlActionSystemUsersRole.htmlRoleTable = function (rolePermissions) {
    "use strict";

    const AppRBAC = new moduleapprbac.AppRBAC();
    let tableBody = "";
    let rbac = AppRBAC.getDefaultRBACMap();
    let rbacPermissions = rolePermissions;

    tableBody += "<tr>";
    tableBody += "<td></td>";
    tableBody += "<td><input value='0' name='columnSelect' data-bind-event='click' data-bind-method='SystemUsersRole.selectRBACColumn' type='radio' /></td>";
    tableBody += "<td><input value='1' name='columnSelect' data-bind-event='click' data-bind-method='SystemUsersRole.selectRBACColumn' type='radio' /></td>";
    tableBody += "<td><input value='2' name='columnSelect' data-bind-event='click' data-bind-method='SystemUsersRole.selectRBACColumn' type='radio' /></td>";
    tableBody += "</tr>";

    $.each(rbac, function (category, value) {
        tableBody += "<tr>";
        tableBody += "<td style='background-color:#eee' class='mdl-cell--left'><b>" + AppRBAC.getRBACNameTranslation(category.toUpperCase()) + "</b></td>";
        tableBody += "<td style='background-color:#eee' ></td>";
        tableBody += "<td style='background-color:#eee'></td>";
        tableBody += "<td style='background-color:#eee'></td>";
        tableBody += "</tr>";

        value.forEach(function (valueRbac) {
            let permission = {};
            if (defined(rbacPermissions[category])) {
                permission = {
                    fullControl: (!defined(rbacPermissions[category][valueRbac]) || rbacPermissions[category][valueRbac] === "*")
                        ? "checked"
                        : "",
                    read: (defined(rbacPermissions[category][valueRbac]) && rbacPermissions[category][valueRbac] === "r")
                        ? "checked"
                        : "",
                    disabled: (defined(rbacPermissions[category][valueRbac]) && rbacPermissions[category][valueRbac] === "h")
                        ? "checked"
                        : ""
                };
            } else {
                permission = {fullControl: "checked", read: "", disabled: ""};
            }

            tableBody += "<tr>";
            tableBody += "<td>" + AppRBAC.getRBACNameTranslation(category + "." + valueRbac) + "</td>";
            tableBody += "<td class='inputField_0'><input value='*' class='fullControl' type='radio' name='" + category + "__" + valueRbac + "' " + permission.fullControl + " /></td>";
            tableBody += "<td class='inputField_1'><input value='r' class='read' type='radio' name='" + category + "__" + valueRbac + "' " + permission.read + " /></td>";
            tableBody += "<td class='inputField_2'><input value='h' class='disabled' type='radio' name='" + category + "__" + valueRbac + "' " + permission.disabled + " /></td>";
            tableBody += "</tr>";
        });
    });

    // Webservice access level config
    tableBody += "<tr>";
    tableBody += "<td style='background-color:#eee' class='mdl-cell--left'><b>WEB SERVICE</b></td><td style='background-color:#eee' ></td><td style='background-color:#eee'></td><td style='background-color:#eee'></td>";
    tableBody += "</tr>";

    let accessLevelSelect = AppMain.html.formElementSelect("access-level", [
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

CtrlActionSystemUsersRole.getFormData = function () {
    "use strict";

    const form = $("#SystemUsersRoleForm");
    let formData = form.serialize();
    return form.deserialize(formData);
};

CtrlActionSystemUsersRole.readRolePermissionTable = function () {
    "use strict";

    let formData = CtrlActionSystemUsersRole.getFormData();
    let rolePermissions = {};

    $.each(formData, function (item, value) {
        if (item.indexOf("__") > 0) {
            let permission = item.split("__");
            if (!defined(rolePermissions[permission[0]])) {
                rolePermissions[permission[0]] = {};
            }

            rolePermissions[permission[0]][permission[1]] = value;
        }
    });
    return rolePermissions;
};

CtrlActionSystemUsersRole.addNewRole = function () {
    "use strict";

    const form = $("#SystemUsersRoleForm");
    let formData = form.serialize();
    formData = form.deserialize(formData);
    let rolePermissions = CtrlActionSystemUsersRole.readRolePermissionTable();

    if (defined(formData.roleName) && formData.roleName !== "") {
        let xmlPermissions = Json2Xml.json2xml_str(rolePermissions);

        AppMain.ws().exec("SetUserData", {
            operation: "ADD-ROLE",
            "user-role-name": formData.roleName,
            //"role-description": formData.roleDesc,
            "user-role": xmlPermissions,
            "access-level": AppMain.rbac.WS_ACCESS_LEVEL_FULL
        }).getResponse(false);

        this.controller.setRequestParam("selectedRole", formData.roleName);
        this.exec();
        AppMain.dialog("SUCC_ROLE_ADDED", "success", [formData.roleName]);

    } else {
        AppMain.dialog("PLEASE_ENTER_ROLE_NAME", "warning");
    }
};

CtrlActionSystemUsersRole.save = function () {
    "use strict";

    let formData = CtrlActionSystemUsersRole.getFormData();
    dmp("__FORM_DATA__");
    dmp(formData);

    if (defined(formData.role)) {
        let rolePermissions = CtrlActionSystemUsersRole.readRolePermissionTable();
        AppMain.ws().exec("SetUserData", {
            "operation": "DELETE-ROLE",
            "user-role-name": formData.role
        }).getResponse(false);
        let xmlPermissions = Json2Xml.json2xml_str(rolePermissions);

        const response = AppMain.ws().exec("SetUserData", {
            "operation": "ADD-ROLE",
            "user-role-name": formData.role,
            "user-role": xmlPermissions,
            "access-level": formData["access-level"]
        }).getResponse(false);

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

CtrlActionSystemUsersRole.getSelectedRole = function () {
    "use strict";

    return this.controller.getRequestParam("selectedRole") || "admin";
};

CtrlActionSystemUsersRole.remove = function () {
    "use strict";

    let roleName = this.getSelectedRole();
    AppMain.ws().exec("SetUserData", {
        "operation": "DELETE-ROLE",
        "user-role-name": roleName
    }).getResponse(false);

    this.exec();
    AppMain.dialog("SUCC_ROLE_REMOVED", "success", [roleName]);
    // go to top of the page to see dialog
    this.goToTop();
};

CtrlActionSystemUsersRole.goToTop = function () {
    "use strict";

    $(".mdl-layout__content").animate({scrollTop: 0}, "slow");
};

CtrlActionSystemUsersRole.onAfterExecute = function () {
    "use strict";

    dmp("CtrlActionSystemUsersRole.onAfterExecute");
};

CtrlActionSystemUsersRole.onBeforeExecute = function () {
    "use strict";

    dmp("CtrlActionSystemUsersRole.onBeforeExecute");
};

CtrlActionSystemUsersRole.init = function () {
    "use strict";

    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

module.exports.CtrlActionSystemUsersRole = CtrlActionSystemUsersRole;