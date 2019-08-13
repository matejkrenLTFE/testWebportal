
const List = require("list.js");

/**
 * @class IControllerAction Action component interface
 */
module.exports.IControllerAction = function(){
    this.view = AppMain.getAppComponent("view");

    this.controller = AppMain.getAppComponent("controller");

    /**
     * @method Main method to execute controller action. All classes
     * extending IControllerAction must implement this method.
     */
    this.exec = null;
    this.isSearchOpened = false;
    this.tableOptions = {};

    /**
     * filter function
     */
    this.filter = function(){
        const TS = $("#table-search");
        const search = $("input.search");
        if(!this.isSearchOpened){
            let w = this.calculateRemainingWidth();
            if(w > 0){
                w = w + "px";
                TS.show().animate({width: w}, {duration: 500});
            }else{
                TS.addClass("table-search-absolute");
                TS.show().animate({width: "150px"}, {duration: 500});
            }
            search.focus();
            this.isSearchOpened = true;
        }else{
            this.closeFilter();
        }
    };

    /**
     * close filter function
     */
    this.closeFilter = function(){
        const TS = $("#table-search");
        const search = $("input.search");
        TS.animate({width: "0px"}, {duration: 500});
        setTimeout(function () {
            TS.removeClass("table-search-absolute");
        },490);
        this.isSearchOpened = false;
        search.val("");
        this.documentTable.search();
        $("#filter_icon").removeClass("clear");
    };

    /**
     * helper function for calculating remaining filter space
     */
    this.calculateRemainingWidth = function(){
        let avWidth = $("#title-row").width() - $("#title-row .mdl-card__title-text").width() - 16
            - $("#title-row .mdl-cell-icons").width();
        if(!$( "#table-search.table-search-absolute" ).length){
            avWidth += $("#table-search").width();
        }
        if(avWidth > 160){
            return 150;
        }
        if(avWidth > 70) {
            return (avWidth - 10);
        }else{
            return 0;
        }
    };

    this.initTable = function (tableID, tableWrapper, tableOptions) {
        this.tableOptions = tableOptions;
        // Table sorting
        $("table#" + tableID).stupidtable();
        // When sorting close all opened event details
        $("th[data-sort]").on("click", function(){
            $("tr[data-opened]").each(function(i, elm){
                const $element = $(elm);
                $element.removeAttr("data-opened");
                $element.next().remove();
            });
            //node list special
            $("table tr td[data-opened]").removeAttr("data-opened");
            $("table tr.nodeListShowDetails.id_MAC_R_EXT").remove();
            $("table tr.nodeListShowDetails.id_TITLE_R_EXT").remove();
            $("table tr.row-details").remove();
        });

        let $this = this;
        setTimeout(function () {
            $this.documentTable = new List(tableWrapper, $this.tableOptions);

            const inputSearch = $("input.search");
            inputSearch.on("keyup", function(e) {
                if (e.keyCode === 27) {
                    $(e.currentTarget).val("");
                    $this.documentTable.search("");
                }
                if($(e.currentTarget).val() === ""){
                    $(e.currentTarget).removeClass("is-active");
                    $("#filter_icon").removeClass("clear");
                }else{
                    $(e.currentTarget).addClass("is-active");
                    $("#filter_icon").addClass("clear");
                }
                $this.documentTable.search($(e.currentTarget).val());
                $("#total-count").html($this.documentTable.matchingItems.length);
            });

            inputSearch.on("focusout", function(e) {
                if($this.isSearchOpened){
                    setTimeout(function () {
                        if($(e.currentTarget).val() === ""){
                            $this.closeFilter();
                        }
                    },100);
                }
            });

            $(window).on("load resize ", function() {
                if($this.isSearchOpened){
                    const TS = $("#table-search");
                    let w = $this.calculateRemainingWidth();
                    if(w > 0){
                        w = w + "px";
                        TS.animate({width: w}, {duration: 0});
                        TS.removeClass("table-search-absolute");
                    }else{
                        TS.addClass("table-search-absolute");
                        TS.animate({width: "150px"}, {duration: 0});
                    }
                }
            }).resize();
        },500);
    };
    
    this.initSelectForMac = function () {
        setTimeout(function () {
            // mdl-textfield-less-padding-chrome
            const isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i);
            if(isMacLike){
                $(".mdl-textfield-less-padding-chrome .mdl-js-select").css("padding-top","25px");
            }
        },100);
    };

    this.initSelectAll = function (classID) {
        $("." + classID).on("click", function(e){
            e.stopPropagation();
            const selectNode =  $(".selectNode");
            if (e.target.checked===true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            }
            else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });
    };
    this.initSelectAllForGroup = function (classID) {
        $("." + classID).on("click", function(e){
            e.stopPropagation();
            const selectNode =  $(".selectGroup");
            if (e.target.checked===true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            }
            else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });
    };
    this.initSelectAllForJob = function (classID) {
        $("." + classID).on("click", function(e){
            e.stopPropagation();
            const selectNode =  $(".selectJob");
            if (e.target.checked===true) {
                selectNode.attr("checked", "checked");
                selectNode.prop("checked", true);
            }
            else {
                selectNode.removeAttr("checked");
                selectNode.prop("checked", false);
            }
        });
    };
};