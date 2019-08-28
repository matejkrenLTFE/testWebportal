/**
 * @class IComponent Action component interface.
 */

/* global defined */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

module.exports.IComponent = function () {
    "use strict";

    /**
     * Init component.
     */
    this.init = null;

    /**
     * Component configuration.
     */
    this.config = {};

    /**
     * Temporary component data storage.
     */
    let dataPom = {};

    /**
     * Set or read component data as "key => value".
     * Important: component data is not persistent and should be used only as temporary storage for
     * component life-cycle. When page is refreshed component data will be lost.
     *
     * @param {string} name Data key name.
     * @param {Object} value Date value to store.
     */
    this.data = function (name, value) {
        if (defined(name) && defined(value)) {
            dataPom[`${name}`] = value;
        }
        if (defined(name)) {
            return defined(dataPom[`${name}`])
                ? dataPom[`${name}`]
                : null;
        }
        return dataPom;
    };

    /**
     * Init default temporary data.
     * @param {Object} data Object to populate default temp data storage.
     */
    this.initData = function (data) {
        $.each(data, function (key, value) {
            dataPom[`${key}`] = value;
        });
    };
};