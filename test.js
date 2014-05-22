var glob = require('./src/glob-proxy');


glob.use('PORT','8084');
glob.use('TYPE','HTTP');
glob.use('ROOT','E:\\django');
glob.use('REQUEST',{
	"GET":{
		"/github":"/mock.json",
		"/under":"http://underscorejs.org/"
	},
	"POST":{
		"/django":"http://GetBookingInfo"
	}
});
glob.use('SENDWS','ws://wwxiang.vip.com')
// glob.use('Mapping',{
//	
// });
glob.initialize();
