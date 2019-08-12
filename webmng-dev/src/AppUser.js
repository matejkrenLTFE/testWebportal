/**
 * Component for application user session.
 * @author LTFE
 */
module.exports.AppUser = function() 
{
    /**
     * Cached user data.
     * @return  {Object}
     */
    let _userData = null;

    /**
     * Get user data.
     */
    this.getUserData = function(name) {
        if (_userData===null)
            _userData = JSON.parse(localStorage.getItem("userData"));
        
        if (_userData===null)
            return null;

        if (!defined(name))
            return _userData;

        return defined(_userData[name]) ? _userData[name] : null;
    };

    /**
     * Set user session data object.
     */
    this.setUserData = function(data) {
        localStorage.setItem("userData", JSON.stringify(data) );
    };

    /**
     * Check if user is logged-in.
     * @return {Boolean}
     */
    this.loggedIn = function() {
        return !!this.getUserData("username");
    };

    this.logout = function() {
        localStorage.clear();        
        sessionStorage.clear();
        window.location = AppMain.getUrl("base") + "/logout";
    };

    /**
     * Get RBAC map for current user.
     */
    this.getRBACMap = function() {
        return AppMain.user.getUserData("role");
    };

    /**
     * Get RBAC permission for current user for given category and param.
     */
    this.getRBACpermissionElement = function(category, param) {
        const rbac = this.getRBACMap();
        return !(defined(rbac[category]) && defined(rbac[category][param])
            && (rbac[category][param].toLowerCase() === "h" || rbac[category][param].toLowerCase() === "r"));
    }
};