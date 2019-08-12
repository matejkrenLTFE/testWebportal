/**
 * AppXMLelement component
 * @author LTFE
 * @module src/AppXMLelement
 */

/**
 * @class AppXMLelement
 */
module.exports.AppXMLelement = function() {
	this.elements = [];
	this.parameters = [];

	// this.xmlSetElement = function(elementName) {
	// 	this.elements[this.elements.length] = elementName;
	// };

	this.xmlSetParam = function(paramName, paramValue) {
		let obj = {};
		obj.name = paramName;
		obj.value = paramValue;
		this.parameters[this.parameters.length] = obj;
	};

	this.xmlGetStructure = function() {			
		let xml = "";
		// Append elements open-tag
		for(let i in this.elements)
			xml += "<" + this.elements[i] + ">";

		// Appending parameters
		for (let i in this.parameters)
			xml += "<" + this.parameters[i].name + ">" + this.parameters[i].value + "</" + this.parameters[i].name + ">";

		// Append elements close-tag
		// Use slice() so we are working with copy of array (else reverse mutates order)
		let elements = this.elements.slice();
		elements = elements.reverse();
		for(let i in elements)
			xml += "</" + elements[i] + ">";
		return xml;
	};
};