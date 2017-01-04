//-------------------------------------------------------------------------------
// Copyright IBM Corp. 2015
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//-------------------------------------------------------------------------------

'use strict';

/**
 * CDS Labs module
 * 
 *   Helpers for managing VCAP_SERVICES
 * 
 * @author David Taieb
 */

var configManager = require('./configManager');

function vcapServices(){
	
	var cfOptions = {};
	if ( configManager.get( "DEV_VCAP_PATH" )){
		//User has specified the path of a properties file to load the vcap services from
		cfOptions.vcap = {"services" : require("jsonfile").readFileSync( configManager.get("DEV_VCAP_PATH") )};
	}else if ( configManager.get( "DEV_VCAP_CONFIG") ){
		//User has specified dev vcap via nconfig
		cfOptions.vcap = {"services" : configManager.get("DEV_VCAP_CONFIG") };
	}
		
	//Parse the services
	//Make sure that we have a HOME env variable before loading cfenv, otherwise it crashes somewhere in ports module
	var homedir = process.platform === "win32" ? "USERPROFILE" : "HOME";
	if ( !process.env[homedir] ){
		process.env[homedir]="dummy";
	}
	var appEnv = require("cfenv").getAppEnv(cfOptions);
	
	this.getService = function( serviceName ){
		return appEnv.getService( new RegExp(".*" + serviceName +".*", "i") );
	}
}

module.exports = new vcapServices();