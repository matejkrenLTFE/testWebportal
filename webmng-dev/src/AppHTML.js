/**
 * Component for creating dynamic HTML elements.
 * @author LTFE
 */
/* global $, defined, componentHandler */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

module.exports.AppHTML = function () {
    "use strict";

    const getOptionChecked = function (options) {
        return (defined(options.checked) && options.checked === true)
            ? "checked"
            : "";
    };
    const getLabelClass = function (options) {
        return (defined(options.labelClass) && options.labelClass) || "";
    };
    const getLabelId = function (options) {
        return (defined(options.labelId) && options.labelId) || "";
    };
    const getInputClass = function (options) {
        return (defined(options.inputClass) && options.inputClass) || "";
    };
    const getInputId = function (options, name) {
        return (defined(options.inputId) && options.inputId) || name;
    };
    const getInputAttr = function (options) {
        return (defined(options.inputAttr) && options.inputAttr) || {};
    };
    /**
     * Render switch button
     *
     * Supported options:
     * - checked: true|false
     * - labelClass
     * - labelId
     * - inputClass
     * - inputId
     * - inputAttr
     */
    this.formElementSwitch = function (name, value, opt) {
        const inputHiddenVal = defined(opt.checked) && opt.checked === true;

        let options = opt || {};
        options.checked = getOptionChecked(options);
        options.labelClass = getLabelClass(options);
        options.labelId = getLabelId(options, name);
        options.inputClass = getInputClass(options);
        options.inputId = getInputId(options);
        options.inputAttr = getInputAttr(options);

        let html = "";
        html += "<label style=\"width:0;\" class=\"mdl-switch mdl-js-switch mdl-js-ripple-effect " + options.labelClass + " \" for=\"" + name + "\">";
        html += "<input type=\"hidden\" name=\"" + name + "\" value=\"" + inputHiddenVal + "\"  />";
        let input = "<input type=\"checkbox\" id=\"" + options.inputId
                + "\" class=\"mdl-switch__input " + options.inputClass
                + " \" name=\"" + name + "\" value=\"" + value + "\" " + options.checked + " ";
        $.each(options.inputAttr, function (index, value) {
            input += " " + index + "=\"" + value + "\"";
        });
        input += "/>";
        html += input;
        html += "<span class=\"mdl-switch__label\"></span>";
        return html + "</label>";
    };

    const defineWidth = function (width) {
        return (defined(width))
            ? " style='width:" + width + "'"
            : "";
    };
    const defineAdditionalClass = function (additionalClass) {
        return defined(additionalClass)
            ? additionalClass
            : "";
    };
    const defineElementAttr = function (options) {
        return defined(options.elementAttr)
            ? options.elementAttr
            : "";
    };
    const defineWrapperAttr = function (options) {
        return defined(options.wrapperAttr)
            ? options.wrapperAttr
            : "";
    };
    const defineWrapperClass = function (options) {
        return defined(options.wrapperClass)
            ? options.wrapperClass
            : "";
    };
    const defineInputType = function (options) {
        return defined(options.inputType)
            ? options.inputType
            : "text";
    };
    const isElementSelectedCheck = function (options, index) {
        return (defined(options.elementSelected) && options.elementSelected === index)
            ? "selected"
            : "";
    };
    const getLabelTxtForSelect = function (options) {
        return (defined(options.label)
            ? options.label
            : name);
    };
    const defineMdlSelect = function (options, additionalClass, widthHtml) {
        if (defined(options.label) && options.label !== "") {
            return "<div class=\"mdl-select mdl-js-select mdl-select--floating-label mdl-textfield-less-padding " + additionalClass + "\" " + widthHtml + ">";
        }
        return "<div class=\"mdl-select mdl-js-select mdl-textfield-no-padding " + additionalClass + "\"" + widthHtml + ">";
    };

    /**
     * HTML select menu.
     *
     * Options:
     * - elementSelected
     */
    this.formElementSelect = function (name, values, options, width, additionalClass) {
        options = options || {};
        let widthHtml = defineWidth(width);
        additionalClass = defineAdditionalClass(additionalClass);
        options.elementAttr = defineElementAttr(options);

        let html = defineMdlSelect(options, additionalClass, widthHtml);
        html += "<select " + options.elementAttr + " class=\"mdl-select__input\" id=\"" + name + "\" name=\"" + name + "\">";
        $.each(values, function (index, value) {
            const selected = isElementSelectedCheck(options, index);
            html += "<option " + selected + " value=\"" + index + "\">" + value + "</option>";
        });

        html += "</select>";
        html += "<label class=\"mdl-select__label\" for=\"" + name + "\">" + getLabelTxtForSelect(options) + "</label>";
        html += "</div>";

        return html;
    };

    /**
     * MDL componentHandler
     * After MDL element render this method should be called to re-init JS events for dynamic
     * element DOM creation.
     *
     * @param elements Array List of element selectors which will be updated.
     */
    this.updateElements = function (elements) {
        elements.forEach(function (elm) {
            componentHandler.upgradeElements($(elm));
        });
    };
    this.updateAllElements = function () {
        componentHandler.upgradeAllRegistered();
    };

    /**
     * Select all checkboxes handler.
     * NOTE: checkboxes that utilize this functionality must have .AppHTMLCheckbox class.
     * @param {String} formId Form ID
     * @param {String} selectAllCheckboxId Select all checbox ID
     */
    this.formCheckboxSelectAll = function (formId, selectAllCheckboxId) {
        $("#" + formId + " #" + selectAllCheckboxId).on("click", function (e) {
            e.stopPropagation();
            const appHTMLCheckbox = $(".AppHTMLCheckbox");
            const checkedCheckBox = $(".AppHTMLCheckbox[disabled]");
            if (e.target.checked === true) {
                appHTMLCheckbox.attr("checked", "checked");
                appHTMLCheckbox.prop("checked", true);
                checkedCheckBox.removeAttr("checked");
                checkedCheckBox.prop("checked", false);
            } else {
                appHTMLCheckbox.removeAttr("checked");
                appHTMLCheckbox.prop("checked", false);
            }
        });
    };

    /**
     * Text input field.
     *
     * Options:
     * - elementAttr
     * - wrapperAttr
     */
    this.formTextInput = function (name, label, options) {
        options = options || {};
        options.elementAttr = defineElementAttr(options);
        options.wrapperAttr = defineWrapperAttr(options);
        options.wrapperClass = defineWrapperClass(options);
        const type = defineInputType(options);

        let html = "<div class=\"mdl-textfield mdl-js-textfield mdl-textfield--floating-label " + options.wrapperClass + "\" " + options.wrapperAttr + " >";
        html += "<input class=\"mdl-textfield__input\" type=\"" + type + "\" id=\"" + name + "\" name=\"" + name + "\" " + options.elementAttr + " >";
        html += "<label class=\"mdl-textfield__label\" for=\"" + name + "\">" + label + "</label>";
        return html + "</div>";
    };

    /**
     * Text input field.
     *
     * Options:
     * - elementAttr
     * - wrapperAttr
     */
    this.formEmailInput = function (name, label, opt) {
        let options = opt || {};
        options.inputType = "email";
        return this.formTextInput(name, label, options);
    };

    /**
     * Text input field.
     *
     * Options:
     * - elementAttr
     * - wrapperAttr
     */
    this.formNumberInput = function (name, label, opt) {
        let options = opt || {};
        options.inputType = "number";
        return this.formTextInput(name, label, options);
    };

    /**
     * Get form data as JSON object.
     * @return {Object}
     */
    this.getFormData = function (formSelector) {
        const form = $(formSelector);
        const formData = form.serialize();
        return form.deserialize(formData);
    };
};