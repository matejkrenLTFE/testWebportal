window.$ = window.jQuery = require("jquery");
// Load vendor dependencies


require("jquery-datetimepicker");
require("./vendor/jquery-stupid-table.min.js");
require("chart.js");
require("material-design-lite");
require("./vendor/mdl-select.js");
require("jquery-confirm");
require("style-loader!./assets/material.light_blue-red.min.css");
require("style-loader!./../node_modules/jquery-datetimepicker/jquery.datetimepicker.css");
require("style-loader!./../node_modules/jquery-confirm/dist/jquery-confirm.min.css");
require("style-loader!./assets/main.css");
require("./vendor/pretify");


// Load main module
require("./AppMain");

// Application bootstrap
// AppMain must be global singelton instance.
window["AppMain"] = new AppMain({
	environment: "prod", // dev|prod
    httpsEnabled: true,
	supportedLocale: [],
    authBasic:true,
	authType: "basic" // basic | certificate
});
window["AppMain"].run();