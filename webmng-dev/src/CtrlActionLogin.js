/**
 * @class CtrlActionLogin Controller action using IControllerAction interface.
 */
var modulecontrolleraction = require("./IControllerAction");
var CtrlActionLogin = Object.create(new modulecontrolleraction.IControllerAction);

CtrlActionLogin.exec = function() {    
    this.view.setTitle("Login");
    //this.view.renderSectionStatic("Default#LoginForm", "#SectionLoginForm");
    dmp("Called: CtrlActionLogin.exec");

    this.view.render(this.controller.action, {
        labels: {
            title: AppMain.t("LOGIN", "LOGIN"),
            username: AppMain.t("USERNAME", "LOGIN"),
            password: AppMain.t("PASSWORD", "LOGIN"),
            login: AppMain.t("LOGIN", "LOGIN"),
        }
    });

    // Set login form action
    $("#LoginForm").prop("action", AppMain.getUrl("app") + "/index.html" );
}
CtrlActionLogin.onBeforeExecute = function() {
    // Redirect logged-in user back to Dashboard
    if (AppMain.user.loggedIn()){
        AppMain.user.logout();
        // setTimeout(function() { AppMain.redirect("#Default"); }, 2000);
    }
        
    switch (AppMain.getConfigParams("authType")) {            
        case AppMain.AUTH_TYPE_CERT:
            AppMain.dialog("CHECKING_CERTIFICATE");
            // Fetch user data from certificate
            var userData = AppMain.ws().exec("GetUserData", {                
                "operation": "CERTIFICATE"
            }).getResponse();

            if (defined(userData.GetUserDataResponse) && defined(userData.GetUserDataResponse.user) && defined(userData.GetUserDataResponse.role)) {
                var user = userData.GetUserDataResponse.user;
                user.role = "";
                user["access-level"] = userData.GetUserDataResponse.role["access-level"];
                dmp("USER_DATA");
                dmp( userData );
                CtrlActionLogin.controller.userLogin(user);
            }
            else
                AppMain.dialog("CERT_AUTH_FAILED", "error");
        break;            
        default:
            // Show standard login form
            $("#LoginFormFields").show();
    }        


}
CtrlActionLogin.init = function() {
    this.controller.attachEvent("onBeforeExecute", this.onBeforeExecute);
    this.controller.attachEvent("onAfterExecute", this.onAfterExecute);    
}
module.exports.CtrlActionLogin = CtrlActionLogin;