/**
 * Component for creating dynamic HTML elements.
 * @author LTFE
 */
"use strict";

module.exports.AppHTML = function () {
    this.table = function () {
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
        options.checked = (defined(options.checked) && options.checked === true) ? "checked" : "";
        options.labelClass = (defined(options.labelClass) && options.labelClass) || "";
        options.labelId = (defined(options.labelId) && options.labelId) || "";
        options.inputClass = (defined(options.inputClass) && options.inputClass) || "";
        options.inputId = (defined(options.inputId) && options.inputId) || null;
        options.inputAttr = (defined(options.inputAttr) && options.inputAttr) || {};

        let html = "";
        html += '<label style="width:0;" class="mdl-switch mdl-js-switch mdl-js-ripple-effect ' + options.labelClass + ' " for="' + name + '">';
        html += '<input type="hidden" name="' + name + '" value="' + inputHiddenVal + '"  />';
        // html += '<input type="hidden" name="' + name + '" value="false"  />';
        let input = '<input type="checkbox" id="' + (defined(options.inputId) ? options.inputId : name) + '" class="mdl-switch__input ' + options.inputClass + ' " name="' + name + '" value="' + value + '" ' + options.checked + ' ';
        for (let i in options.inputAttr) {
            if (options.inputAttr.hasOwnProperty(i)) {
                input += ' ' + i + '="' + options.inputAttr[i] + '"';
            }
        }
        input += "/>";
        html += input;
        html += '<span class="mdl-switch__label"></span>';
        return html + '</label>';
    };

    /**
     * HTML select menu.
     *
     * Options:
     * - elementSelected
     */
    this.formElementSelect = function (name, values, options, width, additionalClass) {
        options = options || {};
        let widthHtml = "";
        if (defined(width)) {
            widthHtml = " style='width:" + width + "'";
        }
        if (!defined(additionalClass)) {
            additionalClass = "";
        }
        let html = "";
        if (defined(options.label) && options.label !== "") {
            html = '<div class="mdl-select mdl-js-select mdl-select--floating-label mdl-textfield-less-padding ' + additionalClass + '" ' + widthHtml + '>';
        } else {
            html = '<div class="mdl-select mdl-js-select mdl-textfield-no-padding ' + additionalClass + '"' + widthHtml + '>';
        }

        options.elementAttr = defined(options.elementAttr) ? options.elementAttr : "";

        html += '<select ' + options.elementAttr + ' class="mdl-select__input" id="' + name + '" name="' + name + '">';

        for (let i in values) {
            if (values.hasOwnProperty(i)) {
                const selected = (defined(options.elementSelected) && options.elementSelected === i) ? "selected" : "";
                html += '<option ' + selected + ' value="' + i + '">' + values[i] + '</option>';
            }
        }
        html += '</select>';
        html += '<label class="mdl-select__label" for="' + name + '">' + (defined(options.label) ? options.label : name) + '</label>';
        html += '</div>';

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
        for (let i in elements) {
            if (elements.hasOwnProperty(i)) {
                componentHandler.upgradeElements($(elements[i]));
            }
        }

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
        options.elementAttr = defined(options.elementAttr) ? options.elementAttr : "";
        options.wrapperAttr = defined(options.wrapperAttr) ? options.wrapperAttr : "";
        options.wrapperClass = defined(options.wrapperClass) ? options.wrapperClass : "";
        const type = defined(options.inputType) ? options.inputType : "text";

        let html = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label ' + options.wrapperClass + '" ' + options.wrapperAttr + ' >';
        html += '<input class="mdl-textfield__input" type="' + type + '" id="' + name + '" name="' + name + '" ' + options.elementAttr + ' >';
        html += '<label class="mdl-textfield__label" for="' + name + '">' + label + '</label>';
        return html + '</div>';
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
        options.elementAttr = defined(options.elementAttr) ? options.elementAttr : "";
        options.wrapperAttr = defined(options.wrapperAttr) ? options.wrapperAttr : "";

        let html = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label" ' + options.wrapperAttr + ' >';
        html += '<input class="mdl-textfield__input" type="email" id="' + name + '" name="' + name + '" ' + options.elementAttr + ' >';
        html += '<label class="mdl-textfield__label" for="' + name + '">' + label + '</label>';
        return html + '</div>';
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
        options.elementAttr = defined(options.elementAttr) ? options.elementAttr : "";
        options.wrapperAttr = defined(options.wrapperAttr) ? options.wrapperAttr : "";

        let html = '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label" ' + options.wrapperAttr + ' >';
        html += '<input class="mdl-textfield__input" type="number" id="' + name + '" name="' + name + '" ' + options.elementAttr + ' >';
        html += '<label class="mdl-textfield__label" for="' + name + '">' + label + '</label>';
        return html + '</div>';
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