var glob = require('./src/glob-proxy');

glob.Config({
	'PORT':'8084',
	'REQUEST':{
		'GET':{
			'/github':'/mock.json'
		},
		'POST':{
			'/github':'/mock.json',
			'/django':'http://m.fat19.qa.nt.ctripcorp.com/restapi.cruises/CruiseService.svc/GetBookingInfo'

		},
		'SOAP':{
			
		}
	},
	'TYPE':'HTTP',
	'ROOT':'E:\\github\\glob-proxy'
});