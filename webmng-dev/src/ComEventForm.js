/**
 * Event log component
 * @class ComEventForm Form component
 */
const modulecomponent = require("./IComponent");
let ComEventForm = Object.create(new modulecomponent.IComponent);
const moment = require("moment");

ComEventForm.totalResults=0;
ComEventForm.init = function(config) 
{        
    let _this = this;

    // Set default config
    config = config || {
        selectorFrom: "#dateFrom",
        selectorTo: "#dateTo",
        selectorEventType: "#eventType",
        eventType: "EVT-STANDARD"
    };
    
    // Set default data
    if (this.data("dateFrom")===null && this.data("dateFrom")===null) {
        this.initData({
            "dateFrom": moment().format( AppMain.localization("DATE_FORMAT") + " 00:00:00" ),
            "dateTo": "---",
            "eventType": "EVT-STANDARD"
        });
    }

    //2017-03-30T06:10:03Z
    $(config.selectorFrom).datetimepicker({
        dayOfWeekStart : 1,
        lang:'sl',
        startDate: moment().format("Y/M/D"),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });
    
    $(config.selectorTo).datetimepicker({
        dayOfWeekStart : 1,
        lang:'sl',			
        startDate: moment().format("Y/M/D"),
        defaultDate: new Date(),
        format: AppMain.localization("DATETIME_FORMAT_DATETIMEPICKER")
    });        

    // Set component data when value changes    
    $(config.selectorFrom).on("change", function(){
        _this.data( "dateFrom", $(this).val() );
    });
    $(config.selectorTo).on("change", function(){
        if($(this).val() === "" ||
            $(this).val() === moment(new Date(0, 0, 0, 0, 0, 0, 0)).format(AppMain.localization("DATETIME_FORMAT"))){
            $(this).val("---");
        }
        _this.data( "dateTo", $(this).val() );
    });
    $(config.selectorEventType).on("change", function(){           
        _this.data( "eventType", $(this).val() );
    });
    
    // Set default values
    $(config.selectorFrom).val( this.data("dateFrom") );
    $(config.selectorTo).val( this.data("dateTo") );
    $(config.selectorEventType).val( this.data("eventType") );

    AppMain.html.updateElements([".mdl-js-textfield", ".mdl-js-select"]);

    // Show/hide total event results header
    const eLtR = $("#eventListTotalResults");
    (this.totalResults > 0) ? eLtR.removeClass("hidden") : eLtR.addClass("hidden");
};
module.exports.ComEventForm = ComEventForm;