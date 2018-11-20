(() => {
	'use strict';

    class MapWidget {
        
        constructor(options) {
			this.events = {};
            this.coordinates = [];
            this.path = [];
        
            this.clearButton = options.clearButton;
            this.clearButton.addEventListener('click', this._clear.bind(this));

            this.runButton = options.runButton;
            this.runButton.addEventListener('click', this._run.bind(this));

            this.canvas = options.canvas;
            this.canvas.width = parseInt(getComputedStyle(this.canvas).width.slice(0, -2)) * devicePixelRatio;
            this.canvas.height = parseInt(getComputedStyle(this.canvas).height.slice(0, -2)) * devicePixelRatio;

            this.canvas.addEventListener('mousedown', this._start.bind(this));
            this.canvas.addEventListener('mousemove', this._move.bind(this));
            this.canvas.addEventListener('mouseup', this._end.bind(this));

            window.addEventListener('resize', this._resize.bind(this));
        }

        addEventListener(e, f) {
			this.events[e] = f;
		}

        _resize() {
            this.canvas.width = parseInt(getComputedStyle(this.canvas).width.slice(0, -2)) * devicePixelRatio;
            this.canvas.height = parseInt(getComputedStyle(this.canvas).height.slice(0, -2)) * devicePixelRatio;

            this._draw();
        }

        _start(e) {
            this.coordinates.push({ x: e.offsetX  * devicePixelRatio, y: e.offsetY * devicePixelRatio });
            this.path.push({ x: e.offsetX  * devicePixelRatio, y: e.offsetY * devicePixelRatio });
            
            this._draw();
        }

        _move(e) {
            if (e.buttons) {
                this.path.push({ x: e.offsetX  * devicePixelRatio, y: e.offsetY * devicePixelRatio });
    
                let last = this.coordinates[this.coordinates.length - 1];
                if (last) {
                    let h = Math.abs(last.x - (e.offsetX * devicePixelRatio));
                    let v = Math.abs(last.y - (e.offsetY * devicePixelRatio));
                    let l = Math.sqrt((h * h) + (v * v));
    
                    if (l > 50) {
                        this.coordinates.push({ x: e.offsetX  * devicePixelRatio, y: e.offsetY * devicePixelRatio });
                    }
                }
            }
    
            this._draw();
        }

        _end(e) {
            this.path = [];
            
            this._draw();
        }

        _clear() {
            this.path = [];
            this.coordinates = [];
            
            this._draw();
        }

        _run() {
            let vectors = [];

            if (this.coordinates.length > 1) {
                for (let i = 1; i < this.coordinates.length; i++) {
                    let previous = this.coordinates[i - 1];
                    let current = this.coordinates[i];
    
                    let horizontal = Math.abs(previous.x - current.x);
                    let vertical = Math.abs(previous.y - current.y);
    
                    let length = Math.sqrt(Math.pow(horizontal, 2) + Math.pow(vertical, 2));
                    let angle = Math.atan2(current.y - previous.y, current.x - previous.x) * 180 / Math.PI;
    
                    vectors.push({
                        length: length,
                        angle: Math.round((angle + 90 + 360) % 360)
                    })
                }
            }
    
			if (this.events['run']) {
				this.events['run'](vectors);
			}
        }

        _draw() {
            let context = this.canvas.getContext('2d');

            context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            context.strokeStyle = '#666666';
            context.lineWidth = 20;
            context.lineCap = 'round';
    
            if (this.path.length > 1) {
                for (let i = 1; i < this.path.length; i++) {
                    context.beginPath();
                    context.moveTo(this.path[i - 1].x, this.path[i - 1].y);
                    context.lineTo(this.path[i].x, this.path[i].y);
                    context.stroke();
                }
            }
    
            context.fillStyle = '#dddddd';
            context.strokeStyle = '#dddddd';
            context.lineWidth = 3;
    
            if (this.coordinates.length) {
                for (let i = 0; i < this.coordinates.length; i++) {
                    context.beginPath();
                    context.arc(this.coordinates[i].x, this.coordinates[i].y, 4, 0, 2 * Math.PI);
                    context.fill();
                }
            }
    
            if (this.coordinates.length > 1) {
                for (let i = 1; i < this.coordinates.length; i++) {
                    context.beginPath();
                    context.moveTo(this.coordinates[i - 1].x, this.coordinates[i - 1].y);
                    context.lineTo(this.coordinates[i].x, this.coordinates[i].y);
                    context.stroke();
                }
            }
    
            if (this.coordinates.length > 1) {
                let last = this.coordinates[this.coordinates.length - 1];
                let first = this.coordinates[this.coordinates.length - 2];
                var angle = Math.atan2(last.y - first.y, last.x - first.x);
    
                context.fillStyle = '#dddddd';
               
                context.save();
                context.translate(last.x, last.y);
                context.rotate(angle);
     
                context.beginPath();
                context.moveTo(-8 * devicePixelRatio, 8 * devicePixelRatio);
                context.lineTo(8 * devicePixelRatio, 0);
                context.lineTo(-8 * devicePixelRatio, -8 * devicePixelRatio);
                context.lineTo(-8 * devicePixelRatio, 8 * devicePixelRatio);
                context.fill();
                context.restore();
            }
        }
    }

    if (typeof define === 'function' && define.amd !== undefined) {
        define([], function () { return MapWidget; });
    } else if (typeof module === 'object' && module.exports !== undefined) {
        module.exports = MapWidget;
    } else {
        window.MapWidget = MapWidget;
    }
})();