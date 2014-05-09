var glob = require('./src/glob-proxy');


glob.use('PORT','8084');
glob.use('TYPE','HTTP');
glob.use('ROOT','D:\\Github\\glob-proxy');
glob.use('REQUEST',{
	"GET":{
		"/github":"/mock.json",
		"/under":"http://underscorejs.org/"
	},
	"POST":{
		"/django":"http://xxxxxx"
	}
})
glob.initialize();





