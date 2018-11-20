
(function() {
	'use strict';

	const state = {
		'sequence': 0,
	};
	
	const encodeCommand = function(did, cid, data) {

		// Next sequence number
		const seq = state.sequence & 0xFF;
		state.sequence += 1;

		// Start of packet #2
		let sop2 = 0xFC;
		sop2 |= 1; // Answer
		sop2 |= 2; // Reset timeout

		// Data length
		const dlen = data.byteLength + 1;
		const sum = data.reduce((a, b) => {
			return a + b;
		});

		// Checksum
		const chk = ((sum + did + cid + seq + dlen) & 0xFF) ^ 0xFF;
		const checksum = new Uint8Array([chk]);
		const packets = new Uint8Array([0xFF, sop2, did, cid, seq, dlen]);

		// Append arrays: packet + data + checksum
		const array = new Uint8Array(packets.byteLength + data.byteLength + checksum.byteLength);
		array.set(packets, 0);
		array.set(data, packets.byteLength);
		array.set(checksum, packets.byteLength + data.byteLength);
		console.log('Sending', array);

		return array;
	};
	
	
	
	class BB8 {
		constructor() {
			this._EVENTS = {};
            this._CHARACTERISTIC = null;
			
			this._QUEUE = [];
			this._SCHEDULED = [];
			this._WORKING = false;

			this._HEADING = 0;

			setInterval(this._ping.bind(this), 50);
		}
		
		connect() {
            return new Promise(async (resolve, reject) => {
				let device, server, service, characteristic;
 
				try {
					/* Request device */

					device = await navigator.bluetooth.requestDevice({
						filters: [
							{ namePrefix: 'BB'}
						],
						optionalServices: [
							'22bb746f-2bb0-7554-2d6f-726568705327',
							'22bb746f-2ba0-7554-2d6f-726568705327'
						]
					});

					device.addEventListener('gattserverdisconnected', this._disconnect.bind(this));

					
					/* Connect to GATT */

					server = await device.gatt.connect();		
									

					/* Handshake */

					service = await server.getPrimaryService("22bb746f-2bb0-7554-2d6f-726568705327");

					characteristic = await service.getCharacteristic("22bb746f-2bbd-7554-2d6f-726568705327");
					// await characteristic.writeValue(new Uint8Array('011i3'.split('').map(c => c.charCodeAt())));
					await characteristic.writeValue(new Uint8Array([0x30, 0x31, 0x31, 0x69, 0x33]));
					
					characteristic = await service.getCharacteristic("22bb746f-2bb2-7554-2d6f-726568705327");
					await characteristic.writeValue(new Uint8Array([0x07]));

					characteristic = await service.getCharacteristic("22bb746f-2bbf-7554-2d6f-726568705327");
					await characteristic.writeValue(new Uint8Array([0x01]));


					/* Get control characteristic */

					service = await server.getPrimaryService("22bb746f-2ba0-7554-2d6f-726568705327");
					
					characteristic = await service.getCharacteristic("22bb746f-2ba1-7554-2d6f-726568705327");

					this._CHARACTERISTIC = characteristic;

					resolve();
				}
				catch(e) {
					reject(e);
				}
			});
		}
		
		orientation(heading) {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._orientation(heading).then(() => resolve()));
			});
		}

		stabilisation(value) {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._stabilisation(value).then(() => resolve()));
			});
		}
		
		turn(heading) {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._turn(heading).then(() => resolve()));
			});
		}
        
		roll(heading, speed) {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._roll(heading, speed).then(() => resolve()));
			});
		}

		stop() {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._stop().then(() => resolve()));
			});
		}

		light(value) {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._light(value).then(() => resolve()));
			});
		}

		color(r, g, b) {
            return new Promise((resolve, reject) => {
				if (!this._CHARACTERISTIC) return reject();
				this._queue(() => this._color(r, g, b).then(() => resolve()));
			});
		}

		shake() {
			let middle = this._HEADING;
			let left = (this._HEADING + 270) % 360;
			let right = (this._HEADING + 90) % 360;

			this._schedule(() => this._turn(left));
			this._wait(6)
			this._schedule(() => this._turn(right));
			this._wait(6)
			this._schedule(() => this._turn(left));
			this._wait(6)
			this._schedule(() => this._turn(right));
			this._wait(6)
			this._schedule(() => this._turn(left));
			this._wait(6)
			this._schedule(() => this._turn(right));
			this._wait(6)
			this._schedule(() => this._turn(middle));
		}

		vectors(items) {
			let that = this;

			items.forEach(item => {
				that._schedule(() => that._roll(item.angle, 100));

				let steps = Math.round(item.length / 10);

				for (var s = 0; s < steps; s++) {
					that._schedule(null);
				}
			});

			this._schedule(() => this._stop());
		}

		addEventListener(e, f) {
			this._EVENTS[e] = f;
		}

		isConnected() {
			return !! this._CHARACTERISTIC;
		}

		_stop() {
			const data = encodeCommand(0x02, 0x30, new Uint8Array([100, this._HEADING >> 8, this._HEADING & 0xFF, 0x00]));
			return this._CHARACTERISTIC.writeValue(data);
		}

		_orientation(heading) {
			const data = encodeCommand(0x02, 0x01, new Uint8Array([heading >> 8, heading & 0xFF]));
			return this._CHARACTERISTIC.writeValue(data);
		}		
		
		_turn(heading) {
			console.log('Turn heading=' + heading);
			
			this._HEADING = heading;

			const data = encodeCommand(0x02, 0x30, new Uint8Array([100, heading >> 8, heading & 0xFF, 0x00]));
			return this._CHARACTERISTIC.writeValue(data);
		}		
		
		_roll(heading, speed) {
			console.log('Roll heading=' + heading + ', speed=' + speed);
			
			this._HEADING = heading;

			const data = encodeCommand(0x02, 0x30, new Uint8Array([speed, heading >> 8, heading & 0xFF, 0x01]));
			return this._CHARACTERISTIC.writeValue(data);
		}

		_color(r, g, b) {
			console.log('Set color: r=' + r + ',g=' + g + ',b=' + b);

			const data = encodeCommand(0x02, 0x20, new Uint8Array([r, g, b, 0x00]));
			return this._CHARACTERISTIC.writeValue(data);
		}

		_light(value) {
			console.log('Set light: value=' + value);

			const data = encodeCommand(0x02, 0x21, new Uint8Array([value]));
			return this._CHARACTERISTIC.writeValue(data);
		}

		_stabilisation(value) {
			console.log('Set stabilisation: value=' + value);

			const data = encodeCommand(0x02, 0x02, new Uint8Array([value ? 0x01 : 0x00]));
			return this._CHARACTERISTIC.writeValue(data);
		}




		_wait(i) {
			while (i--) {
				this._schedule(null);
			}
		}

		_schedule(f) {
			this._SCHEDULED.push(f);
		}

		_ping() {
			if (this._SCHEDULED.length) {
				var command = this._SCHEDULED.shift();

				if (command) {
					this._queue(command);
				}
			}
		}

		_queue(f) {
			var that = this;
			
			function run() {
				if (!that._QUEUE.length) {
					that._WORKING = false; 
					return;
				}
				
				that._WORKING = true;
				(that._QUEUE.shift()()).then(() => run());
			}
			
			that._QUEUE.push(f);
			
			if (!that._WORKING) run();	
		}

		_disconnect() {
            console.log('Disconnected from GATT Server...');

			this._CHARACTERISTIC = null;
			
			if (this._EVENTS['disconnected']) {
				this._EVENTS['disconnected']();
			}
		}
	}

	window.BB8 = new BB8();
})();

