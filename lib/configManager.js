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

function configManager(){	
	if ( process.env.NODE_CONFIG ){
		var getAppRootDir = function(){
			var curPath = __dirname;
			var fs = require('fs');
			while ( curPath ){
				curPath = path.resolve( curPath, "..");
				try{
					if ( fs.lstatSync( path.join( curPath, "package.json" ) ).isFile() ){
						var pkg = require( path.join( curPath, "package.json" ));
						if ( (pkg && pkg.name) !== 'bluemix-helper-config' ){
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
			configPath = process.env.NODE_CONFIG;
		}else{
			//Resolve relative to the root of the app (e.g. where package.json is located).
			configPath = path.resolve( getAppRootDir(), process.env.NODE_CONFIG );
		}
		var nconfig = require('nconfig')({
			path: configPath
		});
		this.config = nconfig.loadSync('pipes', ['vcap']);
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