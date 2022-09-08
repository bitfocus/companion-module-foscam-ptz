var instance_skel = require('../../instance_skel');
var request = require("request");
var tcp = require("../../tcp");
var EventEmitter = require('events').EventEmitter;
var debug;
var log;
var instance_speed = -1;

/**
 * Companion instance for Foscam PTZ cameras.
 * @author Bastiaan Rodenburg
 */

class instance extends instance_skel {

	constructor(system, id, config) {
		super(system, id, config);
		var self = this;

		// Characterworks Port #
		self.actions();
		self.BASEURI = "";
	}

	actions(system) {
		var self = this;

		self.setActions({
			'left':           { label: 'Pan Left',
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						]
					}
				],
				default: '0'
			},
			'right':          { label: 'Pan Right' ,
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						]
					}
				],
				default: '0'
			},
			'up':          { label: 'Tilt up' ,
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						]
					}
				],
				default: '0'
			},
			'down':          { label: 'Tilt down' ,
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						],
						default: '0'
					}
				]
			},
			'upleft':           { label: 'Pan Up/Left',
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						],
						default: '0'
					}
				]
				},
			'upright':          { label: 'Pan Up/Right' ,
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						],
						default: '0'
					}
				]
			},
			'downleft':           { label: 'Pan Down/Left',
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						],
						default: '0'
					}
				]
			},
			'downright':          { label: 'Pan Down/Right' ,
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' },
							{ id: '-1', label: 'Default speed' }
						],
						default: '0'
					}
				]
			},
			'stop':           { label: 'PTZ Stop' },
			'zoomI':          { label: 'Zoom In' },
			'zoomO':          { label: 'Zoom Out' },
			'zoomStop':       { label: 'Zoom Stop' },			
			'preset':          { label: 'Goto preset' ,
				options: [
					{
						type: 'textinput',
						width: 3,
						label: 'Preset name',
						id: 'preset'
					}
				]
			},
			'setDefaultSpeed':          { label: 'Set default speed' ,
				options: [
					{
						type: 'dropdown',
						label: 'Speed',
						id: 'speed',
						choices: [
							{ id: '0', label: '0 fast' },
							{ id: '1', label: '1' },
							{ id: '2', label: '2' },
							{ id: '3', label: '3' },
							{ id: '4', label: '4 slow' }
						],
						default: '0'
					}
				]
			},
		});
	}

	ptzMove(action,speed = -1, presetname = '') {
		var self = this;
		var urlToReq;

		// First send required speed
		if (action.startsWith('ptzMove') && speed != self.instance_speed) {
			urlToReq = self.BASEURI + '&cmd=setPTZSpeed&speed=' + speed;
			self.log('debug', urlToReq);
			self.instance_speed = speed;

			request(urlToReq, function (error, response, body) {
				if ((error) || (response.statusCode !== 200)) {
					self.log('warn', 'Send Error: ' + error);
					self.init();
					return 0;
				}
			});

		}

		// Next send the command
		urlToReq = self.BASEURI + '&cmd=' + action;

		if (action == 'ptzGotoPresetPoint') {
			urlToReq = urlToReq + "&name=" + presetname;
		}

		//self.log('debug', urlToReq);

		request(urlToReq, function (error, response, body) {
			if ((error) || (response.statusCode !== 200)) {
				self.log('warn', 'Send Error: ' + error);
				// Start init to reconnect to cam because probably network lost
				self.init();
			}
		});

	}

	action(action) {
		var self = this;
		var parameter;
		var opt = action.options;

		switch (action.action) {

			case 'left':
				self.ptzMove('ptzMoveLeft', opt.speed);
				break;

			case "right":
				self.ptzMove('ptzMoveRight', opt.speed);
				break;

			case 'up':
				self.ptzMove('ptzMoveUp', opt.speed);
				break;

			case "down":
				self.ptzMove('ptzMoveDown', opt.speed);
				break;

			case 'upleft':
				self.ptzMove('ptzMoveTopLeft', opt.speed);
				break;

			case "upright":
				self.ptzMove('ptzMoveTopRight', opt.speed);
				break;

			case 'downleft':
				self.ptzMove('ptzMoveBottomLeft', opt.speed);
				break;

			case "downright":
				self.ptzMove('ptzMoveBottomRight', opt.speed);
				break;

			case 'stop':
				self.ptzMove('ptzStopRun', -1);
				break;

			case 'zoomI':
				self.ptzMove('zoomIn', 0);
				break;

			case 'zoomO':
				self.ptzMove('zoomOut', 0);
				break;

			case 'zoomStop':
				self.ptzMove('zoomStop', 0);
				break;
				
			case 'preset':
				self.ptzMove('ptzGotoPresetPoint', 0, opt.preset);
				break;

			case 'setDefaultSpeed':
				// Only speed of this instance, not send to camera
				self.instance_speed = opt.speed;
				break;
		}
	}

	// Web config fields
	config_fields () {
		var self = this;
		return [
			{
				type:    'textinput',
				id:      'host',
				label:   'Foscam IP Address',
				tooltip: 'The IP of the camera',
				width:   6,
				regex:   self.REGEX_IP
			},
			{
				type:    'textinput',
				id:      'port',
				label:   'Foscam Port Number (default 88)',
				tooltip: 'The Port Number camera.',
				width:   6,
				default: 88,
				regex:   self.REGEX_PORT
			},
			{
				type:    'textinput',
				id:      'user',
				label:   'User name',
				tooltip: 'The user name.',
				width:   6,
				regex:   self.REGEX_SOMETHING
			},
			{
				type:    'textinput',
				id:      'password',
				label:   'Password',
				tooltip: 'The password',
				width:    6,
				regex:    self.REGEX_SOMETHING
			}
		]
	}


	destroy() {
		var self = this;
		debug("destroy");
	}

	init() {
		var self = this;

		debug = self.debug;
		log = self.log;

		self.status(self.STATUS_WARNING, 'Connecting...');

		// Connecting on init not neccesary for http (request). But during init try to tcp connect
		// to get the status of the module right and automatically try reconnecting. Which is
		// implemented in ../../tcp.
		if (self.config.host !== undefined) {
			self.tcp = new tcp(self.config.host, self.config.port);

			self.tcp.on('status_change', function (status, message) {
				self.status(status, message);
			});

			self.tcp.on('error', function () {
				// Ignore
			});
			self.tcp.on('connect', function () {
				// disconnect immediately because further comm takes place via Request and not
				// via this tcp sockets.
				if (self.tcp !== undefined) {
					self.tcp.destroy();
					delete self.tcp;
				}
				self.BASEURI = 'http://' + self.config.host + ':' + self.config.port + '/cgi-bin/CGIProxy.fcgi?usr=' + self.config.user + '&pwd=' + self.config.password;

				//Try a ptz stop command to be sure username and password are correct and this user is allowed PTZ on this camera
				self.log('debug', 'Send stop command to camera to test');
				request(self.BASEURI + '&cmd=ptzStopRun', function (error, response, body) {
					if ((error) || (response.statusCode !== 200)) {
						self.status(self.STATUS_ERROR, 'Username/password');
						self.log('warn', "response.statusCode: " + response.statusCode);
						self.log('warn', "response.statusText: " + response.statusText);
					} else {
						self.status(self.STATUS_OK, 'Connected');
					}
				});
			});
		}
	}

	updateConfig(config) {
		var self = this;
		self.config = config;

		if (self.tcp !== undefined) {
			self.tcp.destroy();
			delete self.tcp;
		}

		self.init();
	}
}

exports = module.exports = instance;
