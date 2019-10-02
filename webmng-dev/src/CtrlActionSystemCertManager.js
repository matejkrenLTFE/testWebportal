/**
 * @class CtrlActionSystemCertManager Controller action using IControllerAction interface.
 */

/* global AppMain, $, atob, defined, dmp, componentHandler */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemCertManager = Object.create(new modulecontrolleraction.IControllerAction());
const download = require("./vendor/download.js");

CtrlActionSystemCertManager.exec = function () {
    "use strict";

    this.view.setTitle("SYS_CER_MNG");

    let resp = AppMain.ws().exec("GetCertificates", {}).getResponse(false);

    let certs = [];
    if (defined(resp.GetCertificatesResponse.certificate)) {
        if (Object.prototype.toString.call(resp.GetCertificatesResponse.certificate) === "[object Array]") {
            certs = resp.GetCertificatesResponse.certificate;
        }
        if (defined(resp.GetCertificatesResponse.certificate.id)) {
            certs = [resp.GetCertificatesResponse.certificate];
        }
    }

    this.view.render(this.controller.action, {
        title: AppMain.t("CERTIFICATES", "SYS_CER_MNG"),
        certList: this.htmlCertList(certs),
        labels: {
            gateway: AppMain.t("GW_CERTIFICATES", "SYS_CER_MNG"),
            importGatewayCertificate: AppMain.t("IMPORT_CERT", "SYS_CER_MNG"),
            generateSelfSignedCertificate: AppMain.t("GENERATE_SELF_SIGNED_CERT", "SYS_CER_MNG"),
            btnGenerateSelfSignedCert: AppMain.t("GENERATE_SELF_SIGNED_CERT", "SYS_CER_MNG"),
            btnImportCert: AppMain.t("Import IMPORT_CERT", "SYS_CER_MNG"),
            btnGenerateCert: AppMain.t("GENERATE", "SYS_CER_MNG"),
            btnImport: AppMain.t("IMPORT", "global"),
            btnClose: AppMain.t("CLOSE", "global"),
            btnClose2: AppMain.t("CLOSE", "global"),
            thCertLabel: AppMain.t("LABEL", "SYS_CER_MNG"),
            thCertId: AppMain.t("CERT_NICK", "SYS_CER_MNG"),
            thCertType: AppMain.t("TYPE", "SYS_CER_MNG")
        },
        elements: {
            type: AppMain.html.formElementSelect("type", {
                "APP-SERVER": "APP-SERVER",
                "IP-SEC-SERVER": "IP-SEC-SERVER",
                "IP-SEC-CLIENT": "IP-SEC-CLIENT",
                "VPN-SERVER": "VPN-SERVER",
                "VPN-CLIENT": "VPN-CLIENT",
                "HES-CLIENT": "HES-CLIENT",
                "ROOT-CA": "ROOT-CA",
                "SUB-CA": "SUB-CA",
                "FW-SIGNATURE": "FW-SIGNATURE"
            }, {
                label: AppMain.t("SELECT_CERT_TYPE", "SYS_CER_MNG")
            }),
            nick: AppMain.html.formTextInput("cert-nick", AppMain.t("CERT_NICK", "SYS_CER_MNG")),
            userRoleName: AppMain.html.formTextInput("cert-user-role-name", AppMain.t("USER_ROLE_NAME", "SYS_CER_MNG")),
            generateSelfSignedCertName: AppMain.html.formTextInput("cert-generate-name", AppMain.t("CERT_LABEL", "SYS_CER_MNG")),
            generateSelfSignedCertKeyType: AppMain.html.formElementSelect("cert-generate-key-type", {
                "APP-SERVER": "APP-SERVER",
                "PARTITION": "PARTITION",
                "IP-SEC-SERVER": "IP-SEC-SERVER",
                "VPN-SERVER": "VPN-SERVER"
            }, {
                label: AppMain.t("SELECT_CERT_KEY_TYPE", "SYS_CER_MNG")
            }),
            generateSelfSignedCertParameters: AppMain.html.formElementSelect("cert-generate-parameters", {
                "ECDSA-NIST-256": "ECDSA-NIST-256",
                "ECDSA-NIST-384": "ECDSA-NIST-384",
                "RSA-1024": "RSA-1024",
                "RSA-2048": "RSA-2048",
                "RSA-4096": "RSA-4096"
            }, {
                label: AppMain.t("SELECT_CERT_PARAMS", "SYS_CER_MNG")
            }),
            generateSelfSignedCertSubject: AppMain.html.formTextInput("cert-subject", AppMain.t("CERT_SUBJECT", "SYS_CER_MNG")),
            generateSelfSignedCertEmail: AppMain.html.formEmailInput("cert-email", AppMain.t("CERT_EMAIL", "SYS_CER_MNG")),
            generateSelfSignedCertValidity: AppMain.html.formNumberInput("cert-validity", AppMain.t("VAL_DAYS", "SYS_CER_MNG"))
        }
    });

    // CtrlActionSystemCertManager.uploadCertHandler("upload-cert");
};

CtrlActionSystemCertManager.showForm = function (e) {
    "use strict";

    const id = $(e.target).data("form-id");
    $(".tr-form").addClass("hidden");
    $("#" + id).removeClass("hidden");
    componentHandler.upgradeDom(); //fix for input elements not being initialized
};

CtrlActionSystemCertManager.closeForm = function () {
    "use strict";

    $(".tr-form").addClass("hidden");
};

CtrlActionSystemCertManager.getValidity = function () {
    "use strict";

    let validity = $("input[name='cert-validity']").val();
    validity = parseInt(validity, 10);
    if (isNaN(validity)) {
        validity = 0;
    }
    return validity;
};

CtrlActionSystemCertManager.generateCert = function () {
    "use strict";

    let keyType = $("input[name='cert-generate-key-type']").val();
    let parameters = $("input[name='cert-generate-parameters']").val();
    let subject = $("input[name='cert-subject']").val();
    let email = $("input[name='cert-email']").val();
    let validity = this.getValidity();

    let result = AppMain.ws().exec("CreateSelfSignCertificate", {
        "key-type": keyType,
        "key-parameters": parameters,
        "cert-subject": subject,
        "cert-email": email,
        "validity-days": validity
    }).getResponse(false);

    if (result.CreateSelfSignCertificateResponse && result.CreateSelfSignCertificateResponse["cert-nick"]) {
        AppMain.dialog("SELF_SIGNED_CERT_GEN", "success");
    } else {
        let messageId = result.Fault.Reason.Text.toString();
        let message = AppMain.getAppMessage(messageId);
        if (message) {
            // Translate application message
            message = AppMain.t(message, undefined);
        } else {
            message = messageId;
        }
        AppMain.dialog(message, "error");
    }


    CtrlActionSystemCertManager.exec();
    AppMain.html.updateElements([".mdl-js-select", ".mdl-js-textfield"]);
};

CtrlActionSystemCertManager.htmlCertList = function (certs) {
    "use strict";

    let html = "";
    certs.forEach(function (cert) {
        html += "<tr>";
        html += "<td>" + cert["cert-nick"] + "</td>";
        html += "<td></td>";
        html += "<td></td>";
        html += "<td colspan=\"2\">";
        html += "<a data-rbac-element=\"cert-manager.button-remove-cert\" href=\"\" data-cert-id=\"" + cert["cert-nick"] + "\" " +
                "data-bind-method=\"CtrlActionSystemCertManager.remove\" data-bind-event=\"click\">" + AppMain.t("REMOVE", "global") + "</a> | ";
        html += "<a data-rbac-element=\"cert-manager.button-export-cert\" href=\"\" data-cert-id=\"" + cert["cert-nick"] + "\" " +
                "data-bind-method=\"CtrlActionSystemCertManager.export\" data-bind-event=\"click\">" + AppMain.t("EXPORT", "global") + "</a></td>";
        html += "</tr>";
    });
    return html;
};

CtrlActionSystemCertManager.importCert = function () {
    "use strict";

    let files = document.getElementById("upload-cert").files;
    if (!files.length) {
        AppMain.dialog("PLEASE_SEL_FILE", "error");
        return;
    }
    let file = files[0];

    let reader = new FileReader();
    reader.onload = function (e) { // to be changed
        let data = btoa(e.target.result);
        // dmp(data);
        let nick = $("input[name='cert-nick']").val();
        let type = $("select[name='type']").val();
        let userRoleName = $("select[name='cert-user-role-name']").val();

        let result = AppMain.ws().exec("ImportCertificate", {
            "cert-nick": nick,
            "cert-type": type,
            "data": data,
            "user-role-name": userRoleName
        }).getResponse(false);

        if (result.ImportCertificateResponse.toString() === "OK") {
            AppMain.dialog("CERT_SUCC_UPLOADED", "success", [nick]);
        } else {
            AppMain.dialog("CERT_ERROR_UPLOAD", "error");
        }

        CtrlActionSystemCertManager.exec();
    };
    reader.readAsText(file);
};

/**
 * Export certificate into a file.
 */
CtrlActionSystemCertManager.export = function (e) {
    "use strict";

    let certId = $(e.target).data("cert-id");
    if (certId) {
        let cert = AppMain.ws().exec("ExportCertificate", {"cert-nick": certId}).getResponse(false);
        if (defined(cert.ExportCertificateResponse) && defined(cert.ExportCertificateResponse["cert-nick"])) {
            cert = cert.ExportCertificateResponse;
            const data = atob(cert.data);
            download("data:text/plain;charset=utf-8;base64," + btoa(data), cert["cert-nick"], "text/plain");
        }
    }
};

/**
 * Remove certificate.
 */
CtrlActionSystemCertManager.remove = function (e) {
    "use strict";

    const certId = $(e.target).data("cert-id");
    if (certId) {
        const resp = AppMain.ws().exec("DeleteCertificate", {"cert-nick": certId}).getResponse(false);
        dmp(resp);
        AppMain.dialog("CERT_SUCC_REMOVED", "success", [certId]);
    }
    this.exec();
};

CtrlActionSystemCertManager.onAfterExecute = function () {
    "use strict";

    dmp("CtrlActionSystemCertManager.onAfterExecute");
    // Bind certificate uploader handler
    //CtrlActionSystemCertManager.uploadCertHandler();
};

CtrlActionSystemCertManager.onBeforeExecute = function () {
    "use strict";

    dmp("CtrlActionSystemCertManager.onBeforeExecute");
};

CtrlActionSystemCertManager.init = function () {
    "use strict";

    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);
};

module.exports.CtrlActionSystemCertManager = CtrlActionSystemCertManager;