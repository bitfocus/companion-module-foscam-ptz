const {
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	TCPHelper,
	Regex,
} = require('@companion-module/base')
const request = require('request')

/**
 * Companion instance for Foscam PTZ cameras.
 * @author Bastiaan Rodenburg
 */
class FoscamPTZInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.instance_speed = -1
		this.BASEURI = ''
		this.tcp = null
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting, 'Connecting...')
		this.initActions()
		await this.initConnection()
	}

	async initConnection() {
		if (this.tcp) {
			this.tcp.destroy()
			this.tcp = null
		}

		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'Host not configured')
			return
		}

		// Use TCPHelper to test connection
		this.tcp = new TCPHelper(this.config.host, this.config.port || 88)

		this.tcp.on('status_change', (status, message) => {
			if (status === 'ok') {
				this.updateStatus(InstanceStatus.Ok, 'Connected')
			} else if (status === 'connecting') {
				this.updateStatus(InstanceStatus.Connecting, 'Connecting...')
			} else if (status === 'disconnected') {
				this.updateStatus(InstanceStatus.Disconnected, 'Disconnected')
			} else {
				this.updateStatus(InstanceStatus.UnknownError, message || 'Unknown error')
			}
		})

		this.tcp.on('error', (err) => {
			this.log('error', 'TCP Error: ' + err.message)
		})

		this.tcp.on('connect', () => {
			// Disconnect immediately as we use HTTP requests for communication
			if (this.tcp) {
				this.tcp.destroy()
				this.tcp = null
			}

			this.BASEURI = `http://${this.config.host}:${this.config.port || 88}/cgi-bin/CGIProxy.fcgi?usr=${this.config.user}&pwd=${this.config.password}`

			// Test connection with a PTZ stop command
			this.log('debug', 'Testing connection with stop command')
			this.makeRequest('ptzStopRun')
				.then(() => {
					this.updateStatus(InstanceStatus.Ok, 'Connected')
				})
				.catch((err) => {
					this.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed')
					this.log('warn', 'Authentication test failed: ' + err.message)
				})
		})
	}

	makeRequest(cmd, params = {}) {
		return new Promise((resolve, reject) => {
			let url = `${this.BASEURI}&cmd=${cmd}`

			// Add parameters if provided
			Object.keys(params).forEach((key) => {
				url += `&${key}=${encodeURIComponent(params[key])}`
			})

			request(url, (error, response, body) => {
				if (error) {
					reject(error)
				} else if (response.statusCode !== 200) {
					reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
				} else {
					resolve(body)
				}
			})
		})
	}

	async ptzMove(action, speed = -1, presetname = '') {
		try {
			// Set speed if it's a movement command and speed differs
			if (action.startsWith('ptzMove') && speed != -1 && speed != this.instance_speed) {
				await this.makeRequest('setPTZSpeed', { speed })
				this.instance_speed = speed
			}

			// Execute the movement command
			const params = {}
			if (action === 'ptzGotoPresetPoint' && presetname) {
				params.name = presetname
			}

			await this.makeRequest(action, params)
		} catch (error) {
			this.log('warn', `PTZ command failed: ${error.message}`)
			// Attempt to reconnect
			this.initConnection()
		}
	}

	initActions() {
		const actions = {
			left: {
				name: 'Pan Left',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveLeft', action.options.speed)
				},
			},
			right: {
				name: 'Pan Right',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveRight', action.options.speed)
				},
			},
			up: {
				name: 'Tilt Up',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveUp', action.options.speed)
				},
			},
			down: {
				name: 'Tilt Down',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveDown', action.options.speed)
				},
			},
			upleft: {
				name: 'Pan Up/Left',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveTopLeft', action.options.speed)
				},
			},
			upright: {
				name: 'Pan Up/Right',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveTopRight', action.options.speed)
				},
			},
			downleft: {
				name: 'Pan Down/Left',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveBottomLeft', action.options.speed)
				},
			},
			downright: {
				name: 'Pan Down/Right',
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
							{ id: '-1', label: 'Default speed' },
						],
						default: '0',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzMoveBottomRight', action.options.speed)
				},
			},
			stop: {
				name: 'PTZ Stop',
				options: [],
				callback: async () => {
					await this.ptzMove('ptzStopRun', -1)
				},
			},
			zoomI: {
				name: 'Zoom In',
				options: [],
				callback: async () => {
					await this.ptzMove('zoomIn', 0)
				},
			},
			zoomO: {
				name: 'Zoom Out',
				options: [],
				callback: async () => {
					await this.ptzMove('zoomOut', 0)
				},
			},
			zoomStop: {
				name: 'Zoom Stop',
				options: [],
				callback: async () => {
					await this.ptzMove('zoomStop', 0)
				},
			},
			preset: {
				name: 'Goto Preset',
				options: [
					{
						type: 'textinput',
						label: 'Preset name',
						id: 'preset',
						default: '',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzGotoPresetPoint', 0, action.options.preset)
				},
			},
			setPreset: {
				name: 'Set Preset',
				options: [
					{
						type: 'textinput',
						label: 'Preset name',
						id: 'preset',
						default: '',
					},
				],
				callback: async (action) => {
					await this.ptzMove('ptzAddPresetPoint', 0, action.options.preset)
				},
			},
			setDefaultSpeed: {
				name: 'Set Default Speed',
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
						],
						default: '0',
					},
				],
				callback: async (action) => {
					this.instance_speed = action.options.speed
					this.log('info', `Default speed set to ${action.options.speed}`)
				},
			},
		}

		this.setActionDefinitions(actions)
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Foscam IP Address',
				tooltip: 'The IP address of the camera',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Foscam Port Number (default 88)',
				tooltip: 'The port number of the camera',
				width: 6,
				default: 88,
				regex: Regex.PORT,
			},
			{
				type: 'textinput',
				id: 'user',
				label: 'User name',
				tooltip: 'The username for authentication',
				width: 6,
				regex: Regex.SOMETHING,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				tooltip: 'The password for authentication',
				width: 6,
				regex: Regex.SOMETHING,
			},
		]
	}

	async destroy() {
		if (this.tcp) {
			this.tcp.destroy()
			this.tcp = null
		}
	}

	async configUpdated(config) {
		this.config = config
		await this.initConnection()
	}
}

runEntrypoint(FoscamPTZInstance, [])
