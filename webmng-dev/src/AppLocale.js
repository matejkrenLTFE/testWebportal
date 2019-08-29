/**
 * Application localization and translation component.
 * @author LTFE
 */

/* global defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

module.exports.AppLocale = function (loc) {
    "use strict";

    const localeDefault = "en_US";

    /**
     * Current working locale or use default "en_US".
     */
    let locale = loc || localeDefault;

    /**
     * Supported languages
     */
    let languages = [localeDefault];

    let translationStrings = {};

    let translationStringsDefault = {
        localization: {
            DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
            DATE_FORMAT: "YYYY-MM-DD",
            DATETIME_FORMAT_ISO: "",
            DATETIME_FORMAT_DATETIMEPICKER: "Y-m-d H:i:s"
        }
    };

    /**
     * Get list of languages supported by application.
     * @return {Array}
     */
    this.getLanguagesList = function () {
        return languages;
    };

    /**
     * Set supported locale.
     * @param {Array} localeList
     */
    this.setSupportedLocale = function (localeList) {
        if (defined(localeList)) { // protect dynamic require
            languages = languages.concat(localeList);
        }
    };

    /**
     * Load translation strings from files located in ./locale/[localeName].js
     * @return void
     */
    this.loadTranslations = function () {
        if (Object.keys(translationStrings).length === 0 && translationStrings.constructor === Object) {
            languages.forEach(function (language) {  // protect dynamic require
                translationStrings[`${language}`] = require("./locale/" + language); // eslint-disable-line security/detect-non-literal-require
            });
        }
    };

    this.getLanguageStrings = function (selectLocale) {
        const _locale = selectLocale || locale;
        // Reload translation strings
        this.loadTranslations();

        return defined(translationStrings[`${_locale}`])
            ? translationStrings[`${_locale}`]
            : {};
    };

    const getLangStr = function (string, langStrings) {
        return defined(langStrings[`${string}`])
            ? langStrings[`${string}`]
            : string;
    };

    const getGlobalStrTranslate = function (string, langStrings, context) {
        if (defined(langStrings[`${context}`]) && defined(langStrings[`${context}`][`${string}`])) {
            string = langStrings[`${context}`][`${string}`];
        } else {
            string = getLangStr(string, langStrings);
        }
        return string;
    };
    const getContextStrTranslate = function (string, langStrings, context) {
        return (defined(langStrings[`${context}`]) && defined(langStrings[`${context}`][`${string}`]))
            ? langStrings[`${context}`][`${string}`]
            : string;
    };
    /**
     * Translate source string into selected internal locale.
     * @param {String}  string Source.
     * @param {String} contextPom (translation group).
     * @param {Array} vars: Array of placeholder vars
     */
    this.stringTranslate = function (string, contextPom, vars) {
        let context = contextPom || "global";
        const langStrings = this.getLanguageStrings();
        if (context === "global") {
            string = getGlobalStrTranslate(string, langStrings, context);
        } else {
            string = getContextStrTranslate(string, langStrings, context);
        }

        return this.stringTranslateProcessVars(string, vars);
    };

    /**
     * Process translation string with placeholder vars.
     * @param {String} string Source  (contains $%0, %1, %2 ... placeholders).
     * @param {Array} vars Array of placeholder
     * @return {String}
     */
    this.stringTranslateProcessVars = function (string, vars) {
        if (Object.prototype.toString.call(vars) === "[object Array]") {
            vars.forEach(function (item, index) {
                string = string.replace("%" + index, item);
            });
        }
        return string;
    };

    /**
     * Get localization params.  Supported params:
     * - DATETIME_FORMAT
     * - DATE_FORMAT
     *
     * If selected locale has no "localization" defined in localization file AppLocale.translationStringsDefault.localization will be used.
     *
     * @return {object} Localization options.
     */
    this.localization = function (selectLocale) {
        const strings = this.getLanguageStrings(selectLocale);
        return defined(strings.localization)
            ? strings.localization
            : translationStringsDefault.localization;
    };
};