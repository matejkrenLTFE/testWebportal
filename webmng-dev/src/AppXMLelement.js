/**
 * AppXMLelement component
 * @author LTFE
 * @module src/AppXMLelement
 */


/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

/**
 * @class AppXMLelement
 */
module.exports.AppXMLelement = function () {
    "use strict";

    this.elements = [];
    this.parameters = [];

    this.xmlSetParam = function (paramName, paramValue) {
        let obj = {};
        obj.name = paramName;
        obj.value = paramValue;
        this.parameters[this.parameters.length] = obj;
    };

    this.xmlGetStructure = function () {
        let xml = "";
        // Append elements open-tag
        this.elements.forEach(function (elm) {
            xml += "<" + elm + ">";
        });

        // Appending parameters
        this.parameters.forEach(function (elm) {
            xml += "<" + elm.name + ">" + elm.value + "</" + elm.name + ">";
        });

        // Append elements close-tag
        // Use slice() so we are working with copy of array (else reverse mutates order)
        let elements = this.elements.slice();
        elements = elements.reverse();
        this.elements.forEach(function (elm) {
            xml += "</" + elm + ">";
        });
        return xml;
    };
};