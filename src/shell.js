var buffer = require('buffer');
var crypto = require('crypto');
var repl = require('repl');


var shell = module.exports = {}

shell.exit = function(){
    var stage = true;
    process.on('SIGINT', function() {
        if(stage){
            stage = false;
            process.stdout.write('need exit this service ? Y/N : ');
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data',function(chunk){
                var chunk = chunk.toString().replace(/\n/,'');
                var g = chunk.match(/\w+/);
                process.stdin.pause();
                if(g){
                    if(g[0]==='y'){
                        process.exit();
                        return;
                    } 
                }
                stage = true;
                process.stdout.write('you can to do something \n');
            });
            process.stdin.on('end',function(){
                process.stdout.write('end');
            });
        }
    });
}