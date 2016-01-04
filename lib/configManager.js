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
 *   Abstraction layer for providing configuration variable
 *   Supports multiple strategies:
 *   	-Environment variables (System.env)
 *   	-nconfig module
 * 
 * @author David Taieb
 */

var path = require('path');

/**
* configManager class: provide abstraction layer for accessing app configuration values. Strategy is to look for System variables first
* then configuration defined in json configuration files
* @appName: correspond to the json configuration file name e.g: myapp.json. If not defined, then use the app Name defined in package.json
*/
function configManager(){	
	if ( process.env.NODE_CONFIG ){
		var appName = process.env.APP_NAME;
		var getAppRootDir = function(){
			//Get the root directory of the app.
			//Try the process current dir first
			var fs = require('fs');
			var curPath = process.cwd() + path.sep;
			if ( fs.lstatSync( path.join( curPath, "package.json" ) ).isFile() ){
				var pkg = require( path.join(curPath, "package.json") );
				if ( pkg && pkg.name ){
					appName = appName || pkg.name;
				}
				return curPath;				
			}
			//Try recursively from the current dir
			curPath = __dirname;
			while ( curPath ){
				curPath = path.resolve( curPath, "..");
				try{
					if ( fs.lstatSync( path.join( curPath, "package.json" ) ).isFile() ){
						var pkg = require( path.join( curPath, "package.json" ));
						if ( (pkg && pkg.name) !== 'bluemix-helper-config' ){
							//If appName is not defined, use the one fromt the running app
							appName = appName || pkg.name;
							break;
						}
					}
				}catch(e){
					//Ignore
				}
			}
			return curPath;
		};
	
		//Load the nconfig
		var configPath = null;
		if ( path.isAbsolute( process.env.NODE_CONFIG ) ){
			getAppRootDir();
			configPath = process.env.NODE_CONFIG;
		}else{
			//Resolve relative to the root of the app (e.g. where package.json is located).
			configPath = path.resolve( getAppRootDir(), process.env.NODE_CONFIG );
		}
		var nconfig = require('nconfig')({
			path: configPath
		});
		this.config = nconfig.loadSync(appName, ['vcap']);
	}
	
	this.get = function( varName ){
		var retValue = process.env[varName ];
		if ( retValue ){
			return retValue;
		}
		
		//Check the nconfig
		if ( this.config ){
			return this.config[varName];
		}
		return null;
	}
}

module.exports = new configManager();