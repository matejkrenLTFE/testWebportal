/**
 * @class CtrlActionSystemUpgrade Controller action using IControllerAction interface.
 */
const modulecontrolleraction = require("./IControllerAction");
let CtrlActionSystemUpgrade = Object.create(new modulecontrolleraction.IControllerAction);

CtrlActionSystemUpgrade.exec = function() {
    this.view.setTitle("SYS_FIRMWARE");
    const _this = this;

    this.view.render(this.controller.action, {
        title: AppMain.t("FIRMWARE_UPGRADE", "SYS_FIRMWARE"),
        labels: {
            btnUpgrade: AppMain.t("UPGRADE", "SYS_FIRMWARE"),
            instructions: AppMain.t("INSTRUCTIONS", "SYS_FIRMWARE"),
            cancel: AppMain.t("CANCEL", "global")
        }
    });

    const inputElement = document.getElementById("file");
    inputElement.addEventListener("change", function() {
        if(!AppMain.user.getRBACpermissionElement("firmware_upgrade", "upgrade")){
            return;
        }
        let uploadElement = this;
        let transferBytes=0;
        let transferBegin=false;
        let transferEnd=false;
        let transferChunkCounter = 0;
        // var progress = document.querySelector('#fileUploadProgress');
        let progressSpinner = $('#fileUploadProgressSpinner');
        let transferPercentChunk = 1;
        let transferChunks = (uploadElement.files[0].size / (256*1024) < 2) ? Math.floor(uploadElement.files[0].size / (256*1024)) : uploadElement.files[0].size / (256*1024);


        let reader = new FileReader();
        reader.onload = function(e) {};

        CtrlActionSystemUpgrade.readFileChunks(uploadElement.files[0], function(dataChunk, file) {
            transferBegin = transferBytes === 0;
            transferBytes += 256*1024;
            transferEnd = (transferBytes >= file.size);
            transferChunkCounter++;
            
            dmp("reading...");
            dmp(file);

            // Show progress bar
            if (transferBegin){
                // $("#fileUploadProgress").removeClass("hidden");
                progressSpinner.removeClass("hidden");
                progressSpinner.addClass("is-active");
                AppMain.html.updateAllElements();
            }


            dmp("ProgressBarData");
            dmp({
                transferBegin: transferBegin,
                transferBytes: transferBytes,
                transferEnd: transferEnd,
                transferPercentChunk: transferPercentChunk,
                transferChunks: transferChunks
            });

            AppMain.ws().exec("FileTransfer", {
                "file-name": file.name,
                data64: window.btoa(dataChunk),
                "end-of-file": transferEnd,
                "start-file": transferBegin,
                "direction": "UPLOAD"
            }).getResponse(false);

            if (transferEnd) {
                dmp("file-sizes ---");
                dmp(file);
                progressSpinner.removeClass("is-active");
                progressSpinner.addClass("hidden");
                inputElement.value = "";
                AppMain.dialog("SUCC_FILE_UPLOAD", "success", [file.name]);
                AppMain.dialog("RUN_FIRMWARE_UPGRADE_WARNING", "warning");

                $(".select-file").hide();
                $("#file-name").html(file.name);
                $(".file-selected").show();

                _this.controller.setRequestParam("uploadFilename", file.name);
            }            
        });

    }, false);

    AppMain.html.updateElements([".mdl-js-progress", ".mdl-button"]);
};

CtrlActionSystemUpgrade.__upgrade = function() {
    if(!AppMain.user.getRBACpermissionElement("firmware_upgrade", "upgrade")){
        return;
    }
    $.confirm({
        title: AppMain.t("FIRMWARE_UPGRADE", "SYS_FIRMWARE"),
        content: AppMain.t("CONFIRM_UPGRADE_PROMPT", "global"),
        useBootstrap: false,
        theme: "material",
        buttons: {
            confirm:{
                text: AppMain.t("OK", "global"),
                action: function () {
                    const filename = AppMain.getAppComponent("controller").getRequestParam("uploadFilename");
                    if (defined(filename)) {
                        const resp = AppMain.ws().exec("Upgrade", {
                            StartUpgrade: filename
                        }).getResponse(false);
                        const respCode = parseInt(resp.UpgradeResponse.toString());

                        if(isNaN(respCode) || respCode >= 0){
                            $(".warning .close").click();
                            AppMain.dialog("UPGRADE_STARTED", "success");
                            CtrlActionSystemUpgrade.controller.userLogout();
                        }else{
                            $(".warning .close").click();
                            AppMain.dialog("UPGRADE_ERROR", "error");
                            CtrlActionSystemUpgrade.upgradeCancel();
                        }
                    }
                    return true;
                }
            } ,
            cancel: {
                text: AppMain.t("CANCEL", "global"),
                action:
                    function () {
                        return true;
                    }
            }
        }
    });

    AppMain.html.updateElements([".mdl-button"]);
};

CtrlActionSystemUpgrade.readFileChunks = function (file, callback) {
    var fileSize   = file.size;
    var chunkSize  =  256 * 1024; // bytes
    var offset     = 0;
    var self       = this; // we need a reference to the current object
    var chunkReaderBlock = null;

    var readEventHandler = function(evt) {
        if (evt.target.error == null) {
            offset += evt.target.result.length;
            callback(evt.target.result, file); // callback for handling read chunk
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (offset >= fileSize) {
            console.log("Done reading file");
            return;
        }

        // of to the next chunk
        chunkReaderBlock(offset, chunkSize, file);
    };

    chunkReaderBlock = function(_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = readEventHandler;
        //r.readAsText(blob);
        r.readAsBinaryString(blob);
    };

    // now let's start the read with the first block
    chunkReaderBlock(offset, chunkSize, file);
};

CtrlActionSystemUpgrade.upgradeCancel = function () {
    $(".select-file").show();
    $("#file-name").html("");
    $("#file").val("");
    $(".file-selected").hide();
    AppMain.html.updateElements([".mdl-button"]);
};

module.exports.CtrlActionSystemUpgrade = CtrlActionSystemUpgrade;
