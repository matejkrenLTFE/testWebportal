/* MDL SELECT FIELDS CUSTOM REGISTE */
/* MDL SELECT FIELDS CUSTOM */
/* MDL SELECT FIELDS CUSTOM */

/* global componentHandler */
/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

function MaterialSelect(element) {
    "use strict";
    this.elementPom = element;
    this.maxRows = this.ConstantPom.NO_MAX_ROWS;
    // Initialize instance.
    this.init();
}

MaterialSelect.prototype.ConstantPom = {
    NO_MAX_ROWS: -1,
    MAX_ROWS_ATTRIBUTE: "maxrows"
};

MaterialSelect.prototype.CssClassesPom = {
    LABEL: "mdl-textfield__label",
    INPUT: "mdl-select__input",
    IS_DIRTY: "is-dirty",
    IS_FOCUSED: "is-focused",
    IS_DISABLED: "is-disabled",
    IS_INVALID: "is-invalid",
    IS_UPGRADED: "is-upgraded"
};

MaterialSelect.prototype.onKeyDownPom = function (event) {
    "use strict";

    let currentRowCount = event.target.value.split("\n").length;
    if (event.keyCode === 13) {
        if (currentRowCount >= this.maxRows) {
            event.preventDefault();
        }
    }
};

MaterialSelect.prototype.onFocusPom = function () {
    "use strict";

    this.elementPom.classList.add(this.CssClassesPom.IS_FOCUSED);
};

MaterialSelect.prototype.onBlurPom = function () {
    "use strict";

    this.elementPom.classList.remove(this.CssClassesPom.IS_FOCUSED);
};

MaterialSelect.prototype.updateClassesPom = function () {
    "use strict";
    this.checkDisabled();
    this.checkValidity();
    this.checkDirty();
};

MaterialSelect.prototype.checkDisabled = function () {
    "use strict";
    if (this.inputPom.disabled) {
        this.elementPom.classList.add(this.CssClassesPom.IS_DISABLED);
    } else {
        this.elementPom.classList.remove(this.CssClassesPom.IS_DISABLED);
    }
};

MaterialSelect.prototype.checkValidity = function () {
    "use strict";
    if (this.inputPom.validity.valid) {
        this.elementPom.classList.remove(this.CssClassesPom.IS_INVALID);
    } else {
        this.elementPom.classList.add(this.CssClassesPom.IS_INVALID);
    }
};

MaterialSelect.prototype.checkDirty = function () {
    "use strict";
    if (this.inputPom.value && this.inputPom.value.length > 0) {
        this.elementPom.classList.add(this.CssClassesPom.IS_DIRTY);
    } else {
        this.elementPom.classList.remove(this.CssClassesPom.IS_DIRTY);
    }
};

MaterialSelect.prototype.disable = function () {
    "use strict";

    this.inputPom.disabled = true;
    this.updateClassesPom();
};

MaterialSelect.prototype.enable = function () {
    "use strict";

    this.inputPom.disabled = false;
    this.updateClassesPom();
};

MaterialSelect.prototype.change = function (value) {
    "use strict";

    if (value) {
        this.inputPom.value = value;
    }
    this.updateClassesPom();
};

MaterialSelect.prototype.initMaxRows = function () {
    "use strict";
    this.maxRows = parseInt(this.inputPom.getAttribute(
        this.ConstantPom.MAX_ROWS_ATTRIBUTE
    ), 10);
    if (Number.isNaN(this.maxRows)) {
        this.maxRows = this.ConstantPom.NO_MAX_ROWS;
    }
};

MaterialSelect.prototype.initPom = function () {
    "use strict";
    if (this.inputPom.hasAttribute(this.ConstantPom.MAX_ROWS_ATTRIBUTE)) {
        this.initMaxRows();
    }

    this.boundUpdateClassesHandler = this.updateClassesPom.bind(this);
    this.boundFocusHandler = this.onFocusPom.bind(this);
    this.boundBlurHandler = this.onBlurPom.bind(this);
    this.inputPom.addEventListener("input", this.boundUpdateClassesHandler);
    this.inputPom.addEventListener("focus", this.boundFocusHandler);
    this.inputPom.addEventListener("blur", this.boundBlurHandler);

    if (this.maxRows !== this.ConstantPom.NO_MAX_ROWS) {
        this.boundKeyDownHandler = this.onKeyDownPom.bind(this);
        this.inputPom.addEventListener("keydown", this.boundKeyDownHandler);
    }

    this.updateClassesPom();
    this.elementPom.classList.add(this.CssClassesPom.IS_UPGRADED);
};

MaterialSelect.prototype.init = function () {
    "use strict";

    if (this.elementPom) {
        // this.labelPom = this.elementPom.querySelector("." + this.CssClassesPom.LABEL);
        this.inputPom = this.elementPom.querySelector("." + this.CssClassesPom.INPUT);

        if (this.inputPom) {
            this.initPom();
        }
    }
};

// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialSelect,
    classAsString: "MaterialSelect",
    cssClass: "mdl-js-select",
    widget: true
});
/* MDL SELECT FIELDS CUSTOM ENDE*/
