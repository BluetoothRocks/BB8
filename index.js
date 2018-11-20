
var emulateState = false;

var currentHeading = 0;


/* Keyboard events */

document.addEventListener('keydown', handleKeyEvent);
document.addEventListener('keyup', handleKeyEvent);			

var lastKey = null;

var activeKeys = {
    'ArrowUp':    false,
    'ArrowDown':  false,
    'ArrowLeft':  false,
    'ArrowRight': false
}

function handleKeyEvent(event) {
    if (event.type != 'keydown' && event.type != 'keyup') return;

	if (activeKeys.hasOwnProperty(event.key)) {
		activeKeys[event.key] = event.type == 'keydown';

		if (event.type == 'keydown') {
			lastKey = event.key;
		}

		event.preventDefault();
	}
	
	evaluateCommands();
}




/* Gamepad support */

var activeButtons = {
    'ArrowUp':    false,
    'ArrowDown':  false,
    'ArrowLeft':  false,
    'ArrowRight': false
}

const gamepad = new Gamepad();

gamepad.on('press', 'd_pad_up', () => { activeButtons.ArrowUp = true; evaluateCommands(); } );
gamepad.on('release', 'd_pad_up', () => { activeButtons.ArrowUp = false; evaluateCommands(); } );
gamepad.on('press', 'd_pad_left', () => { activeButtons.ArrowLeft = true; evaluateCommands(); } );
gamepad.on('release', 'd_pad_left', () => { activeButtons.ArrowLeft = false; evaluateCommands(); } );
gamepad.on('press', 'd_pad_right', () => { activeButtons.ArrowRight = true; evaluateCommands(); } );
gamepad.on('release', 'd_pad_right', () => { activeButtons.ArrowRight = false; evaluateCommands(); } );
gamepad.on('press', 'd_pad_down', () => { activeButtons.ArrowDown = true; evaluateCommands(); } );
gamepad.on('release', 'd_pad_down', () => { activeButtons.ArrowDown = false; evaluateCommands(); } );

gamepad.on('press', 'button_1', () => executeCommand('lights') );






/* Mouse events */
var controls = document.getElementById('controls');

controls.addEventListener('mousedown', handleMouseEvent);
controls.addEventListener('mouseup', handleMouseEvent);
controls.addEventListener('touchstart', handleMouseEvent);
controls.addEventListener('touchend', handleMouseEvent);

function handleMouseEvent(event) {
    if (event.target.tagName != 'BUTTON') {
        return;
    }
    
    var type = event.type == 'mousedown' || event.type == 'touchstart' ? 'down' : 'up'
    var command = event.target.dataset[type];
    executeCommand(command);

    event.preventDefault();
}





/* Connect to device */

document.getElementById('connect')
	.addEventListener('click', () => {
		BB8.connect()
			.then(() => BB8.color(0, 0, 0))
			.then(() => {
				document.body.classList.add('connected');
			});
	});

document.getElementById('emulate')
	.addEventListener('click', () => {
	    emulateState = true;
		document.body.classList.add('connected');
	});


	
	
	
/* Handle commands */


var lastCommand = 'stop';

function evaluateCommands() {
	command = 'stop';
	if (activeKeys.ArrowUp || activeButtons.ArrowUp) command = 'forward';
	if (activeKeys.ArrowDown || activeButtons.ArrowDown) command = 'reverse';
	if (activeKeys.ArrowLeft || activeButtons.ArrowLeft) command = 'left';
	if (activeKeys.ArrowRight || activeButtons.ArrowRight) command = 'right';
	
	
    if (lastCommand != command) {
        executeCommand(command);
        lastCommand = command;
    }
}

function updateCommand(value) {
	document.body.classList.remove('forward', 'reverse', 'left', 'right');
	
	if (value) {
		document.body.classList.add(value);
	}
}

function executeCommand(value) {
    switch (value) {
		case 'forward':
        	updateCommand('forward');

			if (!emulateState) {
				BB8.roll(currentHeading, 100);
			}

			break;
        
        case 'reverse':
        	updateCommand('reverse');

			if (!emulateState) {
				BB8.roll((currentHeading + 180) % 360, 100);
			}

			break;
        
        case 'right':
        	updateCommand('right');

			if (!emulateState) {
				currentHeading = (currentHeading + 45) % 360;
				BB8.turn(currentHeading);
			}

			break;
        
        case 'left':
        	updateCommand('left');

			if (!emulateState) {
				currentHeading = (currentHeading + 315) % 360;
				BB8.turn(currentHeading);
			}

			break;
        
        case 'stop':
        	updateCommand();

			if (!emulateState) {
				BB8.turn(currentHeading)
			}

			break;
    }
}




/* Pills */

document.getElementById('control').addEventListener('click', (e) => {
	document.body.classList.remove('control', 'calibrate', 'map');
	document.body.classList.add('control');
	calibrateOff();
});

document.getElementById('calibrate').addEventListener('click', (e) => {
	document.body.classList.remove('control', 'calibrate', 'map');
	document.body.classList.add('calibrate');
	calibrateOn();
});

document.getElementById('map').addEventListener('click', (e) => {
	document.body.classList.remove('control', 'calibrate', 'map');
	document.body.classList.add('map');
	calibrateOff();
});



/* Calibrate */

let arrow = document.getElementById('arrow');

function calibrateOn() {
	if (!emulateState) {
		BB8.light(255);
		BB8.stabilisation(false);
		BB8.turn(0);	
	}
}

function calibrateOff() {
	if (!emulateState) {
		let value = document.getElementById('orientation').value;
		BB8.orientation(value % 360);	
		BB8.light(0);
		BB8.stabilisation(true);
		BB8.turn(0);	
	}

	currentHeading = 0;
}

document.getElementById('orientation').addEventListener('input', (e) => {
	arrow.style.transform = "rotate(" + e.target.value + "deg)";

	if (!emulateState) {
		BB8.turn(e.target.value % 360);	
	}
});



/* Map */

let map = new MapWidget({
	canvas:			document.getElementById('mapCanvas'),
	clearButton:	document.getElementById('clearMap'),
	runButton:		document.getElementById('runMap')
});

map.addEventListener('run', (vectors) => {
	if (!emulateState) {
		BB8.vectors(vectors);
	}
});