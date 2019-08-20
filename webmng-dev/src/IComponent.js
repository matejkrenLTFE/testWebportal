/**
 * @class IComponent Action component interface.
 */
module.exports.IComponent = function() 
{
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
    var _data = {};
    
    /**
     * Set or read component data as "key => value".
     * Important: component data is not persistent and should be used only as temporary storage for 
     * component life-cycle. When page is refreshed component data will be lost.
     * 
     * @param {string} name Data key name.
     * @param {Object} value Date value to store.
     */    
    this.data = function(name, value) {
        if (defined(name) && defined(value)) {
            _data[name] = value;
        }
        else if (defined(name))
            return defined(_data[name]) ? _data[name] : null; 
        else            
            return _data;
    }

    /**
     * Init default temporary data.
     * @param {Object} data Object to populate default temp data storage.
     */
    this.initData = function(data) {
        for (key in data)
            _data[key]=data[key];
    }
}