/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

//requre effectcomposer
//https://www.npmjs.com/package/three-effectcomposer
require('./src/EffectComposer');
require('./src/RenderPass');
require('./src/CopyShader');
require('./src/FXAAShader');
require('./src/ShaderPass');
require('./src/UnrealBloomPass');
require('./src/LuminosityHighPassShader');
require('./src/DotScreenPass');
require('./src/DotScreenShader');

/**
 * Aframe Fractal component for A-Frame.
 */
AFRAME.registerComponent('fractal', {
  schema: {
    x: {type: 'string', default: 't' },
    y: {type: 'string', default: 't' },
    z: {type: 'string', default: 't' },
    audioSource: {type:'selector'},
    bloom: {type: 'boolean', default: false},
    bloomStrength: {type: 'float', default: 2},
    bloomThreshold: {type: 'float', default: 0.3},
    bloomRadius: {type: 'float', default: 1.3},
    colors: {type: 'array', default: [ '#f4ee42', '#41f468', '#41dff4' ]},
    detail: {type: 'int', default: 100},
    fftSize: {type: 'int', default: 256},
    points: {type: 'int', default: 100},
    pointSize: {type: 'int', default: 1},
    scale: {type: 'float', default: 1}
  },

  /**
   * Set if component needs multiple instancing.
   */
  multiple: false,

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function () {
    this.Fractal = {};
    var self = this;

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

          this.Fractal.geometry.vertices.push( point );

        }

        this.Fractal.mesh = new THREE.Points( this.Fractal.geometry, new THREE.PointsMaterial({color: this.data.colors[0], size: this.data.pointSize} ) );

        this.el.setObject3D('mesh', this.Fractal.mesh);

        if ( this.data.bloom ) {

          this.el.sceneEl.addEventListener('camera-set-active', e => {

            //vvv Check if removable vvv
            this.el.sceneEl.renderer.autoClear = false;
            //end
            this.el.sceneEl.renderer.gammaInput = true;
  				  this.el.sceneEl.renderer.gammaOutput = true;
            this.el.sceneEl.renderer.toneMapping = THREE.LinearToneMapping;
            this.el.sceneEl.renderer.toneMappingExposure = Math.pow( 0.9, 4.0 );

            this.Fractal.composer = new THREE.EffectComposer( this.el.sceneEl.renderer );

            this.Fractal.renderPass = new THREE.RenderPass( this.el.sceneEl.object3D, this.el.sceneEl.camera );
            this.Fractal.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
		        this.Fractal.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
            this.Fractal.bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2(window.innerWidth, window.innerHeight), this.data.bloomStrength, this.data.bloomRadius, this.data.bloomThreshold );
            this.Fractal.bloomPass.renderToScreen = true;

            this.Fractal.composer.setSize(window.innerWidth, window.innerHeight);
            this.Fractal.composer.addPass(this.Fractal.renderPass);
            this.Fractal.composer.addPass(this.Fractal.effectFXAA);
            this.Fractal.composer.addPass(this.Fractal.effectFXAA);
            this.Fractal.composer.addPass(this.Fractal.effectFXAA);
            this.Fractal.composer.addPass(this.Fractal.bloomPass);


            /*
            this.Fractal.renderPass = new THREE.RenderPass( this.el.sceneEl.object3D, this.el.sceneEl.camera );

            //vvv Check if removable vvv
            this.el.sceneEl.renderer.autoClear = false;
            //end
            this.el.sceneEl.renderer.gammaInput = true;
  				  this.el.sceneEl.renderer.gammaOutput = true;

            this.Fractal.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.data.bloomStrength, this.data.bloomRadius, this.data.bloomThreshold);
            this.Fractal.bloomPass.renderToScreen = true;

            this.Fractal.composer = new THREE.EffectComposer( this.el.sceneEl.renderer );

            this.Fractal.composer.setSize(window.innerWidth, window.innerHeight);
            this.Fractal.composer.addPass( this.Fractal.renderPass );
            this.Fractal.composer.addPass( this.Fractal.bloomPass );
            */
          })

        }

      } else {

        this.Fractal.audioAnalysers = [];
        this.Fractal.materials = [];
        this.Fractal.clouds = [];
        this.Fractal.group = new THREE.Group();

        var groupAverage = (this.data.points - (this.data.points % this.data.detail)) / this.data.detail;
        groupAverage = groupAverage < 1 ? 1 : groupAverage;
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

          //Determine which group to add the vertex to.
          if ( Math.floor( i / groupAverage ) > ( meshes - 1 ) ) {
    				group = ( meshes - 1 );
    			} else {
    				group = Math.floor( i / groupAverage );
    			}

          //Add vertex to specified group
          this.Fractal.clouds[ group ].vertices.push( point );


        }

        //Create meshes and add it to the group
        for(var i=0; i < this.Fractal.clouds.length; i++) {
          this.Fractal.group.add(new THREE.Points( this.Fractal.clouds[i], this.Fractal.materials[i] ));
        }

        this.el.setObject3D('group', this.Fractal.group);

        //When an audio source is loaded, execute this function
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
    this.Fractal.updateColors();
    this.Fractal.generate();
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { },

  /**
   * Called on each scene tick.
   */
  tick: function (t, dt) {

    if ( this.data.audioSource && this.data.colors.length > 1 ) {
      this.Fractal.listen();
    }

    let self = this;

    if ( this.Fractal.composer ) {
      this.Fractal.composer.render( dt );
    }
  },

  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () { },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () { }
});
