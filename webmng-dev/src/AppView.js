/**
 * AppView component
 * @author LTFE
 * @module src/AppView
 */

/* global  AppMain, defined, dmp */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const modulerbac = require("./AppRBAC.js");

/**
 * Application view component.
 * This component is the main workhorse for rendering view templates into app canvas and partials into view sections.
 * By default view template files reside in /views/ directory (can be configured trough AppView.includeUrl option).<br>
 *
 * --- THEORY OF OPERATION ---
 *
 *
 * @class AppView
 *
 * Event list:
 * - beforeAppendToCanvas
 *
 */
module.exports.AppView = function () {
    "use strict";

    /**
     * Canvas selector (e.g. #main) where app view will be rendered.
     */
    this.canvas = null;

    /**
     * Render empty template - replace placeholder vars with AppView.emptyValuePlaceholder
     * @type {Boolean}
     */
    this.renderEmptyTemplate = false;

    /**
     * Empty vars will be replaced by AppView.emptyValuePlaceholder
     * If var has no value it will be replace by empty value when last replace runs in _processTemplate.
     * @type {Boolean}
     */
    this.replaceEmptyVars = false;

    /**
     * AppController instance.
     * @type {AppController}
     */
    this.controller = null;

    this.emptyValuePlaceholder = "---";

    /**
     * Canvas for dialog view messages.
     */
    this.canvasDialog = ".dialog-section";

    /**
     * Loaded view templates cache.
     */
    this.cachePom = {};

    /**
     * Include template from file or grab from current current HTML <script type="template/text">
     */
    this.include = true;

    /**
     * Path where view files reside, relevant when AppView.include=true
     */
    this.includeUrl = "/views/";

    /**
     * Resolve section name selector from view template name.
     * @param {String} viewName
     * @return {String} Selector name.
     */
    function _resolveViewNameSectionSelector(viewName) {
        if (viewName.indexOf("#") > 0) {
            const _viewName = viewName.split("#");
            return defined(_viewName[1])
                ? _viewName[1]
                : null;
        }
        return null;
    }

    /**
     * Resolve template view name and strip any section selector.
     * @param {String} viewName
     * @return {String} Template view name without section selector.
     */
    function _resolveViewName(viewName) {
        if (viewName.indexOf("#") > 0) {
            const _viewName = viewName.split("#");
            if (defined(_viewName[0])) {
                viewName = _viewName[0];
            } else {
                throw "Error reading view template name";
            }
            return viewName;
        }
        return viewName;
    }

    /**
     * Load view template from HTML or include view file from server.
     * If AppView.include=true view template will be loaded from the server.
     *
     * @param {AppView} _this Self instance.
     * @param {String} viewName View name which can also include custom section selector. E.g.: dashboard#listNodes
     * @return {String} View template ready for processing.
     */
    const _loadViewTemplate = function (_this, viewName) {
        let html = "";
        viewName = _resolveViewName(viewName);

        AppMain.log("Load template file: " + AppMain.getUrl("app") + _this.includeUrl + viewName + ".html");

        // Return view template from cache
        if (_this.cached(viewName, false)) {
            html = _this.cachePom["_" + viewName];
        } else {
            if (_this.include === true) {
                // Request credentials
                // var credentials = sessionStorage.getItem("authDigest");
                const requestData = {
                    url: AppMain.getUrl("app") + _this.includeUrl + viewName + ".html",
                    async: false
                };

                $.ajax(requestData).done(function (resp) {
                    AppMain.log("Include view file " + viewName);
                    html = resp;
                }).fail(function (e) {
                    dmp(e);
                    throw "Error loading view file " + AppMain.getUrl("app") + _this.includeUrl + viewName + ".html";
                });
            } else {
                html = $("#view" + viewName).html();
            }
            html = html.trim();
            _this.cachePom["_" + viewName] = html;
        }
        return html;
    };

    /**
     * View template processor which replace variables with provided placeholder data.
     * @param {AppView} _this Self reference.
     * @param {String} viewContent View template.
     * @param {Object} placeholderData
     * @return {String} Processed view template.
     */
    const _processTemplate = function (_this, viewContent, placeholderData) {
        //dmp("_processTemplate-BEFORE");
        //dmp(viewContent);
        $.each(placeholderData, function (placeholder) {
            let replace = "";
            if (typeof placeholderData[`${placeholder}`] === "object") {
                $.each(placeholderData[`${placeholder}`], function (property) {
                    replace = "$" + placeholder + "." + property + "$";
                    viewContent = viewContent.replace(replace, (_this.renderEmptyTemplate && replace.indexOf("$_") < 0)
                        ? _this.emptyValuePlaceholder
                        : placeholderData[`${placeholder}`][`${property}`]);
                });
            } else {
                replace = "$" + placeholder + "$";
                viewContent = viewContent.replace(replace, (_this.renderEmptyTemplate && replace.indexOf("$_") < 0)
                    ? _this.emptyValuePlaceholder
                    : placeholderData[`${placeholder}`]);

            }
        });
        if (_this.renderEmptyTemplate) {
            viewContent = viewContent.replace(/\$.+\$/g, _this.emptyValuePlaceholder);
        }

        if (_this.replaceEmptyVars) {
            viewContent = viewContent.replace(/\$.+\$/g, _this.emptyValuePlaceholder);
        }

        return viewContent;
    };

    const processExecMethod = function (_this, actionName, element) {
        if (actionName && actionName.indexOf(".") > 0 && _this.controller.ctrlActionComp !== null) {
            const comp = actionName.split(".");
            if (comp[1] === "exec") {
                $(element).on(element.getAttribute("data-bind-event"), function (e) {
                    e.stopImmediatePropagation();
                    _this.controller.ctrlActionComp.exec(actionName, {event: e, target: element});
                    return false;
                });
            }
        }
    };

    const processMethodToCtrlActionComponent = function (_this, methodName, element) {
        if (methodName && methodName.indexOf(".") > 0) {
            const comp2 = methodName.split(".");

            if (defined(_this.controller.ctrlActionComp) && defined(_this.controller.ctrlActionComp[comp2[1]])) {
                $(element).on(element.getAttribute("data-bind-event"), function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    _this.controller.ctrlActionComp[comp2[1]]({event: e, target: element});
                    return false;
                });
            }
        }
    };

    const processBindDefaultCtrlAction = function (_this, actionName, element) {
        if (_this.controller["exec" + actionName] !== undefined) {
            $(element).on(element.getAttribute("data-bind-event"), function (e) {
                e.stopImmediatePropagation();
                _this.controller.exec(actionName, {event: e, target: element});
                return false;
            });
        }
    };
    const processBindDefaultCtrlMethod = function (_this, methodName, element) {
        if (_this.controller[`${methodName}`] !== undefined) {
            $(element).on(element.getAttribute("data-bind-event"), function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                _this.controller[`${methodName}`]({event: e, target: element});
                return false;
            });
        }
    };
    /**
     * Bind controller actions and methods defined by view template elements elements.<br>
     *
     * Supported bindings:<br>
     * - data-bind-action: executes AppController action <br>
     * - data-bind-method: executes AppController method <br>
     * - data-bind-event: DOM event on which binded method|action will be triggered.
     */
    const _bindElementControllerEvents = function (_this) {
        AppMain.log("AppView._bindElementControllerEvents");

        // Bind controller "action" & "method" from elements
        $("[data-bind-action],[data-bind-method]").each(function (ignore, element) {
            const actionName = element.getAttribute("data-bind-action");
            const methodName = element.getAttribute("data-bind-method");

            // Action callback to component controller
            processExecMethod(_this, actionName, element);

            // Method callback to controller action component
            processMethodToCtrlActionComponent(_this, methodName, element);

            // Bind default controller action
            processBindDefaultCtrlAction(_this, actionName, element);
            // Bind default controller method
            processBindDefaultCtrlMethod(_this, methodName, element);
        });
    };

    /**
     * Called after AppView.render()
     */
    const _afterRender = function (_this) {
        _bindElementControllerEvents(_this);
    };

    this.defineIncludeForRender = function (includeHTML) {
        return defined(includeHTML)
            ? includeHTML
            : this.include;
    };
    const defineAppendToCanvas = function (appendToCanvas) {
        return defined(appendToCanvas)
            ? appendToCanvas
            : true;
    };
    const defineViewContent = function (viewSectionSelector, viewContent) {
        return (viewSectionSelector)
            ? $(viewContent).filter("#" + viewSectionSelector).prop("innerHTML")
            : viewContent;
    };
    /**
     * Render view template:
     * view templates are placed inside <script type="text/template" id="viewName">
     *
     * @param {String}  viewName Template name
     * @param {Object}  placeholderData
     * @param {Boolean} includeHTML Include HTML template from file.
     * @param {Boolean} appendToCanvas Append view template to canvas or return it as a string. Default: true.
     */
    this.render = function (viewName, placeholderData, includeHTML, appendToCanvas) {
        this.include = this.defineIncludeForRender(includeHTML);
        const viewTemplateName = _resolveViewName(viewName); // viewName without section selectors
        const viewSectionSelector = _resolveViewNameSectionSelector(viewName);
        appendToCanvas = defineAppendToCanvas(appendToCanvas);

        // View render logging
        if (AppMain.environment === AppMain.ENVIRONMENT_DEV) {
            AppMain.log("AppView.render() executed for viewName: " + viewName);
            AppMain.log("AppView.render() params: ");
            const logObj = {
                viewName: viewName,
                placeholderData: placeholderData,
                includeHTML: includeHTML,
                appendToCanvas: appendToCanvas
            };
            AppMain.log(logObj.toString());
        }

        // Load view template (view file or section chunk from single HTML)
        // View template contains variables wich are processed later on.
        let viewContent = _loadViewTemplate(this, viewName);

        // Load template section if requested (viewName # part)
        viewContent = defineViewContent(viewSectionSelector, viewContent);

        // Append view content to template
        if (viewContent !== undefined) {
            viewContent = _processTemplate(this, viewContent, placeholderData);
            // Cache processed view template
            this.cachePom[`${viewName}`] = viewContent;
        } else {
            throw "View template not found: " + viewTemplateName;
        }

        // Append template to canvas or return it as a string.
        if (!appendToCanvas) {
            return viewContent;
        }

        this.appendToCanvas(viewContent);
        _afterRender(this);
    };

    /**
     * Render empty view template ( replacing view vars with AppMain.emptyValuePlaceholder )
     */
    this.renderEmpty = function (viewName, placeholderData, includeHTML) {
        this.renderEmptyTemplate = true;
        this.render(viewName, placeholderData, includeHTML, undefined);
        this.renderEmptyTemplate = false;
    };

    /**
     * Render partial view section template. Used for updating specific template segments.
     * @param {String} viewName View name.
     * @param {String} sectionName Section selector (supports all selectors).
     * @param {Object} placeholderData
     * @param {Boolean} includeHTML Optional.
     */
    this.renderSection = function (viewName, sectionName, placeholderData, includeHTML) {
        includeHTML = includeHTML || this.include;
        placeholderData = placeholderData || {};

        const _canvas = this.canvas;
        this.canvas = sectionName;
        this.render(viewName, placeholderData, includeHTML, undefined);
        this.canvas = _canvas;
    };

    /**
     * Render partial view section template from cache only once. If section is already rendered
     * do not try to render it again (use this for static partials).
     *
     * @param {String} viewName View name.
     * @param {String} sectionName Section selector (supports all selectors).
     * @param {Object} placeholderData
     * @param {Boolean} includeHTML Optional.
     */
    this.renderSectionStatic = function (viewName, sectionName, placeholderData, includeHTML) {
        if (!this.cached(viewName, undefined)) {
            this.renderSection(viewName, sectionName, placeholderData, includeHTML);
        }
    };

    /**
     * Render processed template from cache.
     * @param {String} viewName
     * @return {String}
     */
    this.renderFromCache = function (viewName) {
        const viewContent = this.cached(viewName, undefined)
            ? this.cachePom[`${viewName}`]
            : null;
        if (viewContent) {
            this.appendToCanvas(viewContent);
        }
    };

    /**
     * Check if view is already in cache.
     * @param {String} viewName View name
     * @param {Boolean} processed Get processed or original template from cache. Original templates in cache are "_" prefixed.
     */
    this.cached = function (viewName, processed) {
        processed = (processed !== undefined)
            ? processed
            : true;
        if (processed) {
            return (this.cachePom[`${viewName}`] !== undefined);
        }
        return (this.cachePom["_" + viewName] !== undefined);
    };

    /**
     * Called before AppView.appendToCanvas gets called inside rendering procedure.
     */
    const _beforeAppendToCanvas = function (content) {
        // Process view template with RBAC permissions
        const rbac = new modulerbac.AppRBAC();
        content = rbac.processViewTemplate(content);
        return content;
    };

    /**
     * Append view content to AppView.canvas.
     */
    this.appendToCanvas = function (content) {
        if (this.canvas === null) {
            throw "AppView: 'canvas' selector property not set.";
        }
        // View variables have been processed
        // last chance to modify view before the output.
        content = _beforeAppendToCanvas(content);
        $(this.canvas).html(content);
    };


    /**
     * Rebind view binned elements. Useful when view elements are added dynamically
     * and there is a need for data-bind* to be processed once again.
     */
    this.rebindElementEvents = function () {
        _bindElementControllerEvents(AppMain.getAppComponent("view"));
    };

    /**
     * Recheck for RBAC elements. Usefull when elements are added dynamically
     * and there is a need for data-rbac* to be processed once again.
     */
    this.recheckRBAC = function (content) {
        return _beforeAppendToCanvas(content);
    };

    /**
     * Set main view template title.
     * @param {string} title String will be automatically passed trough AppMain.t for translation.
     */
    this.setTitle = function (title) {
        const txt = AppMain.t(title, "HEADER");
        $(".mdl-layout-title").html(txt);
        const arr = txt.split(" &raquo; ");
        $(".mdl-layout-title.title-short").html(arr[arr.length - 1]);
    };

    /**
     * Show AJAX loading indicator.
     */
    this.loadingIndicator = function (display) {
        const selector = "div#xhrLoad";
        if (display === undefined && !$(selector).is(":visible")) {
            $(selector).show();
        } else {
            $(selector).hide();
        }
    };

    const setTimeoutForClosingDialog = function (type, messageId) {
        if (type === "default" || type === "success" || type === "error-discovery") {
            setTimeout(function () {
                $("." + messageId).hide("slow", function () {
                    this.remove();
                });
            }, 5000);
        }
        // Close dialog event
        $("." + messageId + " .close").on("click", function () {
            $("." + messageId).remove();
        });
    };
    const checkForOpenErrors = function () {
        let errDisc = $(".error-discovery");
        if (errDisc.length) {
            errDisc.hide(0, function () {
                this.remove();
            });
        }
    };

    /**
     * Diplay dialog message inside template dialog message section.
     * @param {String} message Message string.
     * @param {String} type Dialog type: default, warning, error, success. If no type is provided "default" is which disappears after 5sec.
     */
    this.showDialogMessage = function (message, type) {
        type = type || "default";
        const messageId = "msg_" + Math.round(Math.random() * (Math.pow(10, 10)));
        if (type !== "error-discovery") {
            $(this.canvasDialog).append("<div class='dialog-message " + type + " " + messageId + "'><a class='close'>&Cross;</a>"
                    + "<p>" + message + "</p>" + "<div style='clear:both'></div> </div>");
        } else {
            checkForOpenErrors();
            $(this.canvasDialog).append("<div class='dialog-message error error-discovery" + " " + messageId + "'><a class='close'>&Cross;</a>"
                    + "<p>" + message + "</p>" + "<div style='clear:both'></div> </div>");
        }
        setTimeoutForClosingDialog(type, messageId);
    };
};