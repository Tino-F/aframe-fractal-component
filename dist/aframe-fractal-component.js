/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Aframe Fractal component for A-Frame.
 */
AFRAME.registerComponent('fractal', {
  schema: {
    x: {type: 'string', default: 't' },
    y: {type: 'string', default: 't' },
    z: {type: 'string', default: 't' },
    audioSource: {type:'selector'},
    colors: {type: 'array', default: [ '#f4ee42', '#41f468', '#41dff4' ]},
    detail: {type: 'int', default: 100},
    fftSize: {type: 'int', default: 256},
    points: {type: 'int', default: 100},
    pointSize: {type: 'int', default: 1},
    scale: {type: 'float', default: 1},
    logValues: {type: 'boolean', default: false}
  },

  /**
   * Set if component needs multiple instancing.
   */
  multiple: false,

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function () {
    this.Fractal = {
      pause: false
    };
    var self = this;

    if ( !this.data.audioSource ) {

      let sourceSelector = this.el.getAttribute('audioSource');

      if ( !sourceSelector ) {

        this.data.audioSource = false;

      } else {

        this.data.audioSource = document.querySelector( sourceSelector );

      }

    }

    this.data.audioSource = this.data.audioSource ? this.data.audioSource : this.el.getAttribute('audioSource');

    this.Fractal.componentToHex = function (c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    };

    /*
      Prepare colors in the following format...
      You can have more or less than 3 colors

      [
        { pct: 0, color: { r: 0xf4, g: 0xee, b: 0x42 } },
        { pct: 0.5, color: { r: 0x41, g: 0xf4, b: 0x68 } },
        { pct: 1, color: { r: 0x41, g: 0xdf, b: 0xf4 } }
      ]

    */

    this.Fractal.updateColors = function () {

      this.Fractal.colors = [];

      for ( var i = 0; i < this.data.colors.length; i++  ) {

        try {

          var color = new THREE.Color( this.data.colors[i] ).getHexString();

          this.Fractal.colors.push({
            pct: i / ( this.data.colors.length - 1 ),
            color: {
              r: '0x' + color.slice(0,2),
              g: '0x' + color.slice(2,4),
              b: '0x' + color.slice(4,6)
            }
          });

        } catch ( err ) {
          console.log(`Please enter a valid color.\n${err}`);
        }

      }

    }.bind(self);

    /*
      The function to generate colors based on percentages
    */

    this.Fractal.getColor = function ( pct ) {
  		for (var i = 1; i < this.Fractal.colors.length - 1; i++) {
          if (pct < this.Fractal.colors[i].pct) {
              break;
          }
      }
      var lower = this.Fractal.colors[i - 1];
      var upper = this.Fractal.colors[i];
      var range = upper.pct - lower.pct;
      var rangePct = (pct - lower.pct) / range;
      var pctLower = 1 - rangePct;
      var pctUpper = rangePct;
      var color = {
          r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
          g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
          b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
      };
      return '0x' + this.Fractal.componentToHex(color.r) + this.Fractal.componentToHex(color.g) + this.Fractal.componentToHex(color.b);
  	}.bind(self);

    /*
      Generate the function to plot the coordinates
    */

    this.Fractal.ft = function ( t ) {
      var prev = this.Fractal.PointArray.length ? this.Fractal.PointArray[this.Fractal.PointArray.length-1] : {x:0.0000001,y:0.0000001,z:0.0000001};
      return { x: eval(this.data.x), y: eval(this.data.y), z: eval(this.data.z) };
    }.bind(self);

    this.Fractal.generate = function () {

      this.Fractal.PointArray = [];

      if ( !this.data.audioSource || this.data.colors.length < 2 ) {

        //What to do if there is no audio or the user only selected 1 color

        this.Fractal.geometry = new THREE.Geometry();

        for(var i=0; i < this.data.points; i++) {

          var result = this.Fractal.ft( i );
          var point = new THREE.Vector3();

          this.Fractal.PointArray.push( result );
    			point.x = result.x * this.data.scale;
    			point.y = result.y * this.data.scale;
    			point.z = result.z * this.data.scale;

          if ( this.data.logValues ) {
            console.log( `x: ${point.x}, y: ${point.y}, z: ${point.z}` );
          }

          this.Fractal.geometry.vertices.push( point );

        }

        this.Fractal.mesh = new THREE.Points( this.Fractal.geometry, new THREE.PointsMaterial({color: this.data.colors[0], size: this.data.pointSize} ) );

        this.el.setObject3D('mesh', this.Fractal.mesh);

      } else {

        this.Fractal.audioAnalysers = [];
        this.Fractal.materials = [];
        this.Fractal.clouds = [];
        this.Fractal.group = new THREE.Group();

        var average = (this.data.points - (this.data.points % this.data.detail)) / this.data.detail;
        average = average < 1 ? 1 : average;
        var meshes = this.data.detail > this.data.points ? this.data.points : this.data.detail;

        for ( var i = 0; i < meshes; i++ ) {
          // The shape is made up of vertexes generated
          this.Fractal.clouds[i] = new THREE.Geometry();
          this.Fractal.materials[i] = new THREE.PointsMaterial({color: this.data.colors[0], size: this.data.pointSize});
        }

        for(var i=0; i < this.data.points; i++) {
          //Plot points

          var result = this.Fractal.ft( i );

          this.Fractal.PointArray.push( result );
          var group;

          var point = new THREE.Vector3();
    			point.x = result.x * this.data.scale;
    			point.y = result.y * this.data.scale;
    			point.z = result.z * this.data.scale;

          if ( this.data.logValues ) {
            console.log( `x: ${point.x}, y: ${point.y}, z: ${point.z}` );
          }

          if ( Math.floor( i / average )  > ( meshes - 1 ) ) {
    				group = ( meshes - 1 );
    			} else {
    				group = Math.floor( i / average );
    			}

          this.Fractal.clouds[ group ].vertices.push( point );


        }

        //Create meshes and add it to the group

        for(var i=0; i < this.Fractal.clouds.length; i++) {
          this.Fractal.group.add(new THREE.Points( this.Fractal.clouds[i], this.Fractal.materials[i] ));
        }

        this.el.setObject3D('group', this.Fractal.group);

        this.data.audioSource.addEventListener('sound-loaded', function ( e ) {

          this.Fractal.audioAnalysers = [];

          this.data.audioSource.components.sound.pool.children.forEach(function ( sound ) {
            //Create audioAnalyzer

            this.Fractal.audioAnalysers.push( new THREE.AudioAnalyser( sound, this.data.fftSize) );

          }.bind(self));

        }.bind(self))

      }

    }.bind(self);

    /*
      Update Material Colors based on audio input
    */

    this.Fractal.listen = function () {

      if ( this.Fractal.audioAnalysers.length ) {
        var spectrum = this.Fractal.audioAnalysers[0].getFrequencyData();
        var i = 0;

        this.Fractal.materials.forEach(( point ) => {
          var color = this.Fractal.getColor( spectrum[ i ] / 256 );
          point.color.setHex( color );
          i++;
        });
      }

    }.bind(self);

    this.Fractal.updateColors();
    this.Fractal.generate();
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {

    data = this.data;

    //The if statement would have been far too long so I added this function to add a digit to the regenerate variable for each statement that is true.

    function needsRegeneration () {
      let regenerate = data.x != oldData.x ? 1 : 0;
      regenerate += data.y != oldData.y ? 1 : 0;
      regenerate += data.z != oldData.z ? 1 : 0;
      regenerate += data.scale != oldData.scale ? 1 : 0;
      regenerate += data.points != oldData.points ? 1 : 0;
      regenerate += data.detail != oldData.detail ? 1 : 0;
      regenerate += data.detail != oldData.detail ? 1 : 0;
      regenerate += data.fftSize != oldData.fftSize ? 1 : 0;
      regenerate += data.pointSize != oldData.pointSize ? 1 : 0;
      return regenerate;
    }

    if ( needsRegeneration() > 0 ) {
      this.Fractal.generate();
    }

    if ( data.colors != oldData.colors ) {
      this.Fractal.updateColors();
    }

  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { },

  /**
   * Called on each scene tick.
   */
  tick: function (t) {
    if ( this.data.audioSource && this.data.colors.length > 1 && !this.Fractal.pause ) {
      this.Fractal.listen();
    }
  },

  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () {
    this.Fractal.pause = true;
  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
    this.Fractal.pause = false;
  }
});


/***/ })
/******/ ]);