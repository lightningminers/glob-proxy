var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var crypto = require('crypto');

/**
    
*/
var read_model_file = function(filePath,keyword){
    if(!filePath) return false;
    var fileContent = fs.readFileSync(filePath,"utf-8");
    var fileLines = fileContent.split(/\n|\r/);
    var addre = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/mi;
    var recruise = new RegExp(keyword||'cruise','gi');
    var mapping = {};
    var set_url = [];
    fileLines.forEach(function(line,i){
        if(line.length > 10 && addre.test(line) && recruise.test(line)){
            var matchurls = line.match(addre);
            var shakey = crypto.createHash('sha');
            shakey.update((Math.random(0)*100)+i+matchurls);
            mapping['/'+shakey.digest('hex')] = matchurls[0];
            set_url.push(matchurls[0]);
        }
    });
    return set_url;
}

var is_empty_object = function(obj){
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