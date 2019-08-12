/**
 * AppWebserviceClient component
 * @author LTFE
 * @module src/AppWebserviceClient
 */
const X2JS = require("xml-json-parser");
const Json2Xml = new X2JS();
const Xml2Json = new X2JS();

/**
 * @class AppWebserviceClient
 */
module.exports.AppWebserviceClient = function () {
    this.host = location.host;
    this.urlService = "/soap/GWtest";
    this.statusCodes = {
        "503": AppMain.t("SERVICE_UNAVAILABLE", "global"),
        "400": AppMain.t("BAD_REQUEST", "global"),
        "403": AppMain.t("FORBIDDEN", "global")
    };
    this._lastResponse = null;
    /**
     * Last method call to webservice.
     */
    let _lastMethodExec = null;
    let _cache = {};
    let _lastSoapMessage = null;

    /**
     * Element namespace.
     * @param {String} Namespace incl. collon ":"
     */
    let _xmlNamespace = "";


    /**
     * SOAP message string when building SOAP message with methods (not from JSON but from string).
     */
    let _xmlSoapMessage = {
        elements: [],
        parameters: []
    };

    /**
     * Create SOAP message (XML string) which will be execute by _executeRequest.
     *
     * @param messageBody string|object JSON object or XML string.
     * @return string SOAP message
     */
    this.createSoapMessage = function (messageBody) {
        // JSON object
        let soapBody;
        if (messageBody instanceof Object)
            soapBody = Json2Xml.json2xml_str(messageBody);
        else
            soapBody = messageBody;

        let xml = '<?xml version="1.0" encoding="UTF-8"?> \n';
        if (_xmlNamespace === "mes:") {
            xml += '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" ' +
                'xmlns:cos="http://www.dlms.com/COSEMpdu" xmlns:mes="http://iec.ch/TC57/2011/schema/message" ' +
                'xmlns:dev="http://iec.ch/TC13/2014/schema/DeviceAccess">';
        } else {
            xml += '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:gw="http://plc-gw.namespace/GW/">';
        }
        xml += "<soap:Body>";
        xml += soapBody;
        xml += "</soap:Body>";
        xml += "</soap:Envelope>";
        _lastSoapMessage = xml;
        // Cleanup XML structures
        _xmlSoapMessage.parameters = [];
        _xmlSoapMessage.elements = [];

        AppMain.log("AppWebserviceClient soap_message: " + xml);
        return xml;
    };

    this.createSoapMethodMessage = function (method, params) {
        let soapMessage = {};
        if (params instanceof Object) {
            params = params || {};
            soapMessage[_xmlNamespace + method] = params;
        } else
            soapMessage = "<" + _xmlNamespace + method + ">" + params + "</" + _xmlNamespace + method + ">";

        return this.createSoapMessage(soapMessage);
    };

    this.getHostURI = function () {
        return (AppMain.httpsEnabled === true) ? "https://" + this.host : "http://" + this.host;
    };

    /**
     * Execute SOAP method call.
     * @param {String} method SOAP method name.
     * @param {Object} prm Additional method params.
     * @return {Object} AppWS
     */
    this.exec = function (method, prm) {

        const params = (!defined(prm)) ? {} : prm;

        const soapMsg = this.createSoapMethodMessage(method, params);

        _lastMethodExec = method;

        return _executeRequest(this, soapMsg);
    };

    /**
     * Async execute SOAP method call.
     * @param {String} method SOAP method name.
     * @param {Object} prm Additional method params.
     * @return {Object} AppWS
     */
    this.execAsync = function (method, prm) {

        const params = (!defined(prm)) ? {} : prm;

        const soapMsg = this.createSoapMethodMessage(method, params);

        _lastMethodExec = method;

        return _executeAsyncRequest(this, soapMsg);
    };
    /**
     * Execute SOAP method call.
     * @param {String} method SOAP method name.
     * @param {Object} prm Additional method params.
     * @return {Object} AppWS
     */
    this.getXML = function (method, prm) {
        const params = (!defined(prm)) ? {} : prm;
        return vkbeautify.xml(Json2Xml.json2xml_str(params), 2);
    };

    /**
     * Main method to execute request to the webservice.
     */
    const _executeRequest = function (_this, soapMessage) {
        let lastResponse = {};
        $.ajax({
            url: _this.getHostURI() + _this.urlService,
            data: soapMessage, // xmlSerialize.serializeToString(xmlRequestMethod),
            method: "POST",
            crossDomain: true,
            dataType: "xml",
            async: false,
            beforeSend: function (req) {
                // req.setRequestHeader("Access-Control-Request-Headers", "x-requested-with");
                if (AppMain.authBasic === true) {
                    if (localStorage.getItem("authDigest") == null) {
                        dmp("authDigest: " + localStorage.getItem("authDigest") + "  " + soapMessage);
                    }
                    req.setRequestHeader("Authorization", "Basic " + localStorage.getItem("authDigest"));
                }
                AppMain.view.loadingIndicator();
            }
        }).done(function (data) {
            lastResponse = data;
            AppMain.view.loadingIndicator(false);

        }).fail(function (response) {
            AppMain.view.loadingIndicator(false);

            const resp = Json2Xml.xml2json(response.responseXML);

            // Handle SOAP message response: errors, warnings, etc ...
            if (defined(resp.Envelope)) {
                const messageId = resp.Envelope.Body.Fault.Reason.Text.toString();
                let message = AppMain.getAppMessage(messageId);
                if (message) {
                    // Translate application message
                    message = AppMain.t(message, undefined);
                    return AppMain.dialog(message, "warning");
                }
                if (response.status !== 400 && response.status !== 500)
                    lastResponse = response.responseXML;
            }

            if (defined(_this.statusCodes[response.status]))
                AppMain.dialog(response.status + " " + _this.statusCodes[response.status], "error");
            else
                AppMain.dialog("UNDEFINED_ERROR", "error");
        });
        // Set last response
        _this._lastResponse = lastResponse;

        return _this;
    };

    /**
     * method to execute async request to the webservice.
     */
    const _executeAsyncRequest = function (_this, soapMessage) {
        let dfd = $.Deferred();

         $.ajax({
            url: _this.getHostURI() + _this.urlService,
            data: soapMessage, // xmlSerialize.serializeToString(xmlRequestMethod),
            method: "POST",
            crossDomain: true,
            dataType: "xml",
            async: true,
            beforeSend: function (req) {
                // req.setRequestHeader("Access-Control-Request-Headers", "x-requested-with");
                if (AppMain.authBasic === true) {
                    if (localStorage.getItem("authDigest") == null) {
                        dmp("authDigest: " + localStorage.getItem("authDigest") + "  " + soapMessage);
                    }
                    req.setRequestHeader("Authorization", "Basic " + localStorage.getItem("authDigest"));
                }
                AppMain.view.loadingIndicator();
            }
        })
        .done(function (data) {
            AppMain.view.loadingIndicator(false);

            const jsonResponse = Xml2Json.xml2json(data);
            if (typeof jsonResponse.Envelope.Body === "undefined")
                throw "SOAP response error or SOAP envelope has no body.";

            dfd.resolve(jsonResponse.Envelope.Body);

        }).fail(function (response) {
            AppMain.view.loadingIndicator(false);

            const resp = Json2Xml.xml2json(response.responseXML);

            // Handle SOAP message response: errors, warnings, etc ...
            if (defined(resp.Envelope)) {
                const messageId = resp.Envelope.Body.Fault.Reason.Text.toString();
                let message = AppMain.getAppMessage(messageId);
                if (message) {
                    // Translate application message
                    message = AppMain.t(message, undefined);
                    return dfd.reject(message);
                }
            }

            if (defined(_this.statusCodes[response.status]))
                return dfd.reject(response.status + " " + _this.statusCodes[response.status]);
            else
                return dfd.reject("UNDEFINED_ERROR");
        });

         return dfd.promise();
    };

    /**
     * Get WS last response. Call this after AppWS.exec() was executed.
     * @param {Boolean} rawResp If true raw XML is returned instead of JSON object.
     * @return {Object} JSON object | XML object
     */
    this.getResponse = function (rawResp) {
        // Create method response cache
        if (!defined(_cache[_lastMethodExec]))
            _cache[_lastMethodExec] = null;

        dmp("Executed method: " + _lastMethodExec);

        //if (typeof this._lastResponse.Body === "undefined")
        //	throw "SOAP response error or SOAP envelope has no body.";
        const rawResponse = (typeof rawResp !== "undefined" && rawResp === true);
        if (rawResponse) {
            AppMain.log(this._lastResponse);
            return this._lastResponse;
        } else if (this._lastResponse !== null) {
            const jsonResponse = Xml2Json.xml2json(this._lastResponse);
            if (typeof jsonResponse.Envelope.Body === "undefined")
                throw "SOAP response error or SOAP envelope has no body.";

            AppMain.log(jsonResponse.Envelope.Body);

            return _cache[_lastMethodExec] = jsonResponse.Envelope.Body;
        }
    };

    /**
     * Helper method for processing response from WS (Array|Object problem, etc).
     */
    /*this.processElementList = function (elementsObject, nodeName) {
        let elements = (elementsObject instanceof Array) ? elementsObject[nodeName] : elementsObject;
        if (typeof elements["__prefix"] !== "undefined")
            delete elements["__prefix"];
        return elements;
    };*/

    /**
     * Get WS method response from cache or execute new method request.
     * @param {String} methodName
     * @param {Object} params
     */
    this.getResponseCache = function (methodName, params) {
        return defined(_cache[methodName]) ? _cache[methodName] : this.exec(methodName, params).getResponse(false);
    };

    /**
     * Return last executed SOAP message by AppWebserviceClient.
     * @return string SOAP message.
     */
    /*this.getLastSoapMessage = function () {
        return _lastSoapMessage;
    };*/

    /**
     * This method always returns response element as array.
     * It also fixes "__prefix"" problem with SOAP message elements.
     *
     * @param responseElement Object  Response element reference, e.g.: response["GetParametersResponse"]["cntr"]["forward-to-hes-list"];
     * @return Array|Object
     */
    this.getResponseElementAsArray = function (responseElement) {
        dmp("response-element");
        dmp(typeof responseElement);

        if (!defined(responseElement))
            return [];

        if (typeof responseElement["__prefix"] !== "undefined")
            delete responseElement["__prefix"];

        if (typeof responseElement === "string")
            return [responseElement];

        if ($.isArray(responseElement) || responseElement instanceof Array)
            return responseElement;

        if (responseElement instanceof Object)
            return {0: responseElement};

        return [];
    };

    this.xmlSetElement = function (elementName) {
        _xmlSoapMessage.elements[_xmlSoapMessage.elements.length] = elementName;
    };

    this.xmlSetParam = function (paramName, paramValue) {
        let obj = {};
        obj.name = paramName;
        obj.value = paramValue;
        _xmlSoapMessage.parameters[_xmlSoapMessage.parameters.length] = obj;
    };

    this.xmlGetStructure = function () {
        let xml = "";
        // Append elements open-tag
        for (let i in _xmlSoapMessage.elements)
            xml += "<" + _xmlSoapMessage.elements[i] + ">";

        // Appending parameters
        for (let i in _xmlSoapMessage.parameters)
            xml += "<" + _xmlSoapMessage.parameters[i].name + ">" + _xmlSoapMessage.parameters[i].value + "</" + _xmlSoapMessage.parameters[i].name + ">";

        // Append elements close-tag
        // Use slice() so we are working with copy of array (else reverse mutates order)
        let elements = _xmlSoapMessage.elements.slice();
        elements = elements.reverse();
        for (let i in elements)
            xml += "</" + elements[i] + ">";

        return xml;
    };

    /**
     * Set SOAP call namespace.
     * @param {String} namespace Namespace incl. colon ":".
     */
    this.setNamespace = function (namespace) {
        _xmlNamespace = namespace;
    };

    /*this.clearCache = function (methodName) {
        if (!defined(methodName))
            throw "AppWebserviceClient.clearCache missing 'methodName' parameter.";

        _cache[methodName] = null;
        delete _cache[methodName];
    }*/
};