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
 *   Global singleton object
 * 
 * @author David Taieb
 */

var _ = require('lodash');
var events = require('events');
var bunyan = require('bunyan');
var fs = require('fs');
var moment = require('moment');
var appEnv = require("cfenv").getAppEnv();

var globalFn = function(){
	//Call constructor from super class
	events.EventEmitter.call(this);
	
	this.appHost = process.env.VCAP_APP_HOST ? appEnv.urls[0]: null;
	this.appPort = 0;
	this.getHostName = function(){
		var url = this.appHost || "http://127.0.0.1";
		if ( url.indexOf("://") < 0 ){
			url = "https://" + this.appHost;
		}
		return url;
	};
	this.getHostUrl = function(){		
		var url = this.getHostName();
		if ( this.appPort > 0 ){
			url += ":" + this.appPort;
		}
		return url;
	};
	this.gc = function(){
		if ( global.gc ){
			//Check the memory usage to decide whether to invoke the gc or not
			var mem = process.memoryUsage();
			if ( (mem.heapUsed / mem.heapTotal) * 100 > 80 ){	//Heap is 80% or more filled
				global.gc();
			}			
		}
	};
	this.jsonError = function( res, code, err ){		
		if ( !err ){
			err = code;
		}
		if ( !_.isFinite( code ) ){
			code = 500;
		}
		
		var message = err.message || err.statusMessage || err;
		if ( res.headersSent ){
			console.log("Error could not be sent because response is already flushed: " + message );
			return;
		}
		
		res.status( code ).json({'error': message} );
		return message;
	};
	
	this.getLogger = function( loggerName ){
		var logPath = function( logFileName ){
			var logDir = require('path').resolve( __dirname, '..', 'logs');
			var createDir = false;
			try{
				createDir = !fs.lstatSync( logDir ).isDirectory();
			}catch(e){
				createDir = true;
			}
			if ( createDir ){
				fs.mkdirSync( logDir );
			}
			var path = logDir + "/" + logFileName + "." + moment().format("YYYYMMDD-HHmm") + ".log";
			console.log("moment: " + moment().format() );
			console.log( "log path: " + path );
			return path;
		}
		
		var filePath = logPath(loggerName);
		var logger = bunyan.createLogger({
			name: loggerName,
			src: true,
			streams:[
			    {
			    	path: filePath,
			    	level: "trace"
			    },
			    {
			    	stream: process.stderr,
			    	level: "warn"
			    }
			]
		});
		//Remember the logPath so we write it as an attachment to the run document
		logger.logPath = filePath;
		return logger;
	};
};

//Extend event Emitter
require("util").inherits(globalFn, events.EventEmitter);

//Export the singleton
module.exports = new globalFn();
