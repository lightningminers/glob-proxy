var util = module.exports = {}

util.is_empty_object = function(obj){
    var has = function(obj,key){
        return hasOwnProperty.call(obj,key);
    }
    for(var key in obj){
        if(!has(obj,key)){
            return false;
        }
    }
    return true;
}