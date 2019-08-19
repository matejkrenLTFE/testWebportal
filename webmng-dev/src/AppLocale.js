/**
 * Application localization and translation component.
 * @author LTFE
 */
/*jshint esversion: 6 */
/* jshint node: true */
"use strict";

module.exports.AppLocale = function(loc)
{
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
            DATETIME_FORMAT_DATETIMEPICKER: "Y-m-d H:i:s",
        }
    };

    /**
     * Get list of languages supported by application.
     * @return {Array}
     */
    this.getLanguagesList = function() {
        return languages;
    };

    /**
     * Set supported locale.
     * @param {Array} localeList
     */
    this.setSupportedLocale = function(localeList) {
        if (defined(localeList))
            languages = languages.concat(localeList);
    };

    /**
     * Load translation strings from files located in ./locale/[localeName].js
     * @return void
     */
    this.loadTranslations = function() {
        for (let lang in languages) {
            if(languages.hasOwnProperty(lang))
            translationStrings[ languages[lang] ] = require("./locale/" + languages[lang]);
        }
    };

    // /**
    //  * Set default locale.
    //  * @param {String} localeName E.g.: en_US
    //  */
    // this.setLocale = function(localeName) {
    //     locale = localeName;
    // };

    this.getLanguageStrings = function(selectLocale) {
        const _locale = selectLocale || locale;
        // Reload translation strings
        if (Object.keys(translationStrings).length===0 && translationStrings.constructor===Object)
            this.loadTranslations();
        return defined(translationStrings[_locale]) ? translationStrings[_locale] : {};
    };

    /**
     * Translate source string into selected internal locale.
     * @param {String}  string Source.
     * @param {String} contextPom (translation group).
     * @param {Array} vars: Array of placeholder vars
     */
    this.stringTranslate = function(string, contextPom, vars) {
        let context = contextPom || "global";
        const langStrings = this.getLanguageStrings();
        if (context === "global") {
            if (defined(langStrings[context]) && defined(langStrings[context][string]))
                string = langStrings[context][string];
            else
                string = defined(langStrings[string]) ? langStrings[string] : string;
        }else
            string = defined(langStrings[context]) && defined( langStrings[context][string] ) ? langStrings[context][string] : string;

        return this.stringTranslateProcessVars(string, vars);            
    };

    /**
     * Process translation string with placeholder vars.
     * @param {String} string Source  (contains $%0, %1, %2 ... placeholders).
     * @param {Array} vars Array of placeholder
     * @return {String} 
     */
    this.stringTranslateProcessVars = function(string, vars) {
        if (vars instanceof Array) {            
            for (let i in vars)
                if(vars.hasOwnProperty(i))
                    string = string.replace("%" + i, vars[i]);
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
    this.localization = function(selectLocale) {      
        const strings = this.getLanguageStrings(selectLocale);
        return defined(strings.localization) ? strings.localization : translationStringsDefault.localization;
    }
};