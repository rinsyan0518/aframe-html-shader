/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
	                                                                                                                                                                                                                                                                               * A shader to render HTML DOM Element
	                                                                                                                                                                                                                                                                               * Inspired by @scenevr's `htmltexture-component`
	                                                                                                                                                                                                                                                                               * @see https://github.com/scenevr/htmltexture-component
	                                                                                                                                                                                                                                                                               */

	var _domToImage = __webpack_require__(1);

	var _domToImage2 = _interopRequireDefault(_domToImage);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	if (typeof AFRAME === 'undefined') {
	  throw 'Component attempted to register before AFRAME was available.';
	}

	/* get util from AFRAME */
	var debug = AFRAME.utils.debug;
	// debug.enable('shader:html:*')

	debug.enable('shader:html:warn');
	var warn = debug('shader:html:warn');
	var log = debug('shader:html:debug');

	/* create error message */
	function createError(err, target) {
	  return { status: 'error', target: target, message: err, timestamp: Date.now() };
	}

	AFRAME.registerShader('html', {

	  /**
	   * For material component:
	   * @see https://github.com/aframevr/aframe/blob/60d198ef8e2bfbc57a13511ae5fca7b62e01691b/src/components/material.js
	   * For example of `registerShader`:
	   * @see https://github.com/aframevr/aframe/blob/41a50cd5ac65e462120ecc2e5091f5daefe3bd1e/src/shaders/flat.js
	   * For MeshBasicMaterial
	   * @see http://threejs.org/docs/#Reference/Materials/MeshBasicMaterial
	   */

	  schema: {

	    /* For material */
	    color: { type: 'color' },
	    fog: { default: true },

	    /* For texuture */
	    target: { default: null },
	    debug: { default: null },
	    fps: { type: 'number', default: 0 },
	    width: { default: null },
	    height: { default: null },
	    ratio: { default: null }

	  },

	  /**
	   * Initialize material. Called once.
	   * @protected
	   */
	  init: function init(data) {
	    log('init', data);
	    this.__cnv = document.createElement('canvas');
	    this.__cnv.width = 2;
	    this.__cnv.height = 2;
	    this.__ctx = this.__cnv.getContext('2d');
	    this.__texture = new THREE.Texture(this.__cnv);
	    this.__reset();
	    this.material = new THREE.MeshBasicMaterial({ map: this.__texture });
	    this.el.sceneEl.addBehavior(this);
	    return this.material;
	  },


	  /**
	   * Update or create material.
	   * @param {object|null} oldData
	   */
	  update: function update(oldData) {
	    log('update', oldData);
	    this.__updateMaterial(oldData);
	    this.__updateTexture(oldData);
	    return this.material;
	  },


	  /**
	   * Called on each scene tick.
	   * @protected
	   */
	  tick: function tick(t) {

	    if (this.__paused || !this.__target || !this.__nextTime) {
	      return;
	    }

	    var now = Date.now();
	    if (now > this.__nextTime) {
	      this.__render();
	    }
	  },


	  /*================================
	  =            material            =
	  ================================*/

	  /**
	   * Updating existing material.
	   * @param {object} data - Material component data.
	   */
	  __updateMaterial: function __updateMaterial(data) {
	    var material = this.material;

	    var newData = this.__getMaterialData(data);
	    Object.keys(newData).forEach(function (key) {
	      material[key] = newData[key];
	    });
	  },


	  /**
	   * Builds and normalize material data, normalizing stuff along the way.
	   * @param {Object} data - Material data.
	   * @return {Object} data - Processed material data.
	   */
	  __getMaterialData: function __getMaterialData(data) {
	    return {
	      fog: data.fog,
	      color: new THREE.Color(data.color)
	    };
	  },


	  /*==============================
	  =            texure            =
	  ==============================*/

	  /**
	   * set texure
	   * @private
	   * @param {Object} data
	   * @property {string} status - success / error
	   * @property {string} target - target url
	   * @property {DOM Element} targetEl - target
	   * @property {Date} timestamp - created at the texure
	   */

	  __setTexure: function __setTexure(data) {
	    log('__setTexure', data);
	    if (data.status === 'error') {
	      warn('Error: ' + data.message + '\ntarget: ' + data.target);
	      this.__reset();
	    } else if (data.status === 'success' && data.target !== this.__textureSrc) {
	      /* Texture added or changed */
	      this.__ready(data);
	    }
	  },


	  /**
	   * Update or create texure.
	   * @param {Object} data - Material component data.
	   */
	  __updateTexture: function __updateTexture(data) {
	    var _this = this;

	    var target = data.target,
	        fps = data.fps,
	        width = data.width,
	        height = data.height,
	        ratio = data.ratio;

	    this.__width = width || this.schema.width.default;
	    this.__height = height || this.schema.height.default;

	    /* debug */
	    var resetDebug = function resetDebug() {
	      if (_this.__debugEl) {
	        _this.__debugEl.innerHTML = '';
	        _this.__debugEl = _this.schema.debug.default;
	      }
	    };
	    if (data.debug) {
	      var el = this.__validateAndGetQuerySelector(data.debug);
	      if (el && !el.error) {
	        this.__debugEl = el;
	      } else resetDebug();
	    } else resetDebug();

	    /* ratio */
	    if (ratio && ratio === 'width' || ratio === 'height') {
	      this.__ratio = ratio;
	    } else {
	      this.__ratio = this.schema.ratio.default;
	    }

	    /* fps */
	    if (fps) {
	      if (this.__fps > 0) {
	        this.__fps = fps;
	      } else if (fps === -1) {
	        /* render only once */
	        this.__fps = this.schema.fps.default;
	        if (this.__target) {
	          this.__render();
	        }
	        /* set attribute */
	        var material = Object.assign({}, this.el.getAttribute('material'));
	        delete material.fps;
	        this.el.setAttribute('material', material);
	      } else {
	        this.__fps = fps;
	        if (this.__target) {
	          this.play();
	          this.__render();
	        }
	      }
	    } else {
	      if (this.__fps > 0) {
	        this.pause();
	      } else {
	        this.__fps = this.schema.fps.default;
	      }
	    }

	    /* target */
	    if (target) {
	      if (target === this.__target) {
	        return;
	      }
	      this.__target = target;
	      // return
	      this.__validateSrc(target, this.__setTexure.bind(this));
	    } else {
	      /* Texture removed */
	      this.__reset();
	    }
	  },


	  /*=============================================
	  =            varidation for texure            =
	  =============================================*/

	  /**
	   * varidate src
	   * @private
	   * @param {string} target - dom selector
	   * @param {Function} cb - callback
	   */
	  __validateSrc: function __validateSrc(target, cb) {

	    var message = void 0;

	    /* check if target is a query selector */
	    var el = this.__validateAndGetQuerySelector(target);
	    if (!el || (typeof el === 'undefined' ? 'undefined' : _typeof(el)) !== 'object') {
	      return;
	    }
	    if (el.error) {
	      message = el.error;
	    } else {
	      var tagName = el.tagName.toLowerCase();
	      if (tagName === 'img' || tagName === 'video') {
	        message = 'For <' + tagName + '> element, please use `shader:flat`';
	      } else {
	        cb({ status: 'success', target: target, targetEl: el, timestamp: Date.now() });
	      }
	    }

	    /* if there is message, create error data */
	    if (message) {
	      var err = createError(message, target);
	      cb(err);
	    }
	  },


	  /**
	   * Query and validate a query selector,
	   *
	   * @param  {string} selector - DOM selector.
	   * @return {object} Selected DOM element | error message object.
	   */
	  __validateAndGetQuerySelector: function __validateAndGetQuerySelector(selector) {
	    try {
	      var el = document.querySelector(selector);
	      if (!el) {
	        return { error: 'No element was found matching the selector' };
	      }
	      return el;
	    } catch (e) {
	      // Capture exception if it's not a valid selector.
	      return { error: 'no valid selector' };
	    }
	  },


	  /*================================
	  =            playback            =
	  ================================*/

	  /**
	   * Pause video
	   * @public
	   */
	  pause: function pause() {
	    log('pause');
	    this.__paused = true;
	    this.__nextTime = null;
	  },


	  /**
	   * Play video
	   * @public
	   */
	  play: function play() {
	    log('play');
	    this.__paused = false;
	  },


	  /**
	   * Toggle playback. play if paused and pause if played.
	   * @public
	   */

	  togglePlayback: function togglePlayback() {
	    if (this.paused()) {
	      this.play();
	    } else {
	      this.pause();
	    }
	  },


	  /**
	   * Return if the playback is paused.
	   * @public
	   * @return {boolean}
	   */
	  paused: function paused() {
	    return this.__paused;
	  },


	  /*==============================
	   =            canvas            =
	   ==============================*/

	  /**
	   * clear canvas
	   * @private
	   */
	  __clearCanvas: function __clearCanvas() {
	    if (!this.__ctx || !this.__texture) {
	      return;
	    }
	    this.__ctx.clearRect(0, 0, this.__width, this.__height);
	    this.__texture.needsUpdate = true;
	  },


	  /**
	   * draw
	   * @private
	   */
	  __draw: function __draw(canvas) {
	    log('__draw');
	    if (!this.__ctx || !this.__texture) {
	      return;
	    }
	    var ratio = canvas.width / canvas.height;
	    var cnvW = this.__cnv.width = THREE.Math.floorPowerOfTwo(canvas.width);
	    var cnvH = this.__cnv.height = THREE.Math.floorPowerOfTwo(canvas.height);
	    this.__ctx.drawImage(canvas, 0, 0, cnvW, cnvH);
	    this.__texture.needsUpdate = true;
	    if (this.__ratio) {
	      /* change size */
	      var _el$getObject3D$geome = this.el.getObject3D('mesh').geometry.metadata.parameters,
	          width = _el$getObject3D$geome.width,
	          height = _el$getObject3D$geome.height;

	      this.el.setAttribute('geometry', Object.assign({}, this.el.getAttribute('geometry'), {
	        width: this.__ratio === 'width' ? width : height * ratio,
	        height: this.__ratio === 'width' ? width / ratio : height
	      }));
	    }

	    /* append if debug element exists */
	    if (this.__debugEl) {
	      this.__debugEl.innerHTML = '';
	      this.__debugEl.appendChild(canvas);
	    } else {
	      canvas.height = 0;
	      canvas.width = 0;
	      canvas.remove();
	    }

	    /* setup next tick */
	    this.__setNextTick();
	  },


	  /**
	   * render
	   * @private
	   */
	  __render: function __render() {
	    var _this2 = this;

	    this.__nextTime = null;
	    if (!this.__targetEl) {
	      return;
	    }

	    var _targetEl$getBoundin = this.__targetEl.getBoundingClientRect(),
	        width = _targetEl$getBoundin.width,
	        height = _targetEl$getBoundin.height;

	    var options = {
	      width: this.__width || width,
	      height: this.__height || height
	    };
	    _domToImage2.default
	    // Workaround for iOS Safari
	    // First rendering don't render <img>. But second rendering is fine...
	    // But the following code is not fine.
	    // // .toSvg(this.__targetEl, options)
	    // // .then(_ => domtoimage.toSvg(this.__targetEl, options))
	    .toPng(this.__targetEl, options).then(function (_) {
	      return _domToImage2.default.toPng(_this2.__targetEl, options);
	    }).then(function (uri) {
	      return new Promise(function (resolve, reject) {
	        var img = new Image();
	        var res = function res() {
	          img.removeEventListener('load', res);
	          img.removeEventListener('error', rej);
	          resolve(img);
	        };
	        var rej = function rej(event) {
	          img.removeEventListener('load', res);
	          img.removeEventListener('error', rej);
	          reject(event);
	        };
	        img.addEventListener('load', res);
	        img.addEventListener('error', rej);
	        img.src = uri;
	      });
	    }).then(function (image) {
	      var canvas = document.createElement('canvas');
	      canvas.width = options.width;
	      canvas.height = options.height;
	      var ctx = canvas.getContext('2d', { storage: 'discardable' });
	      ctx.drawImage(image, 0, 0);
	      return canvas;
	    }).then(this.__draw.bind(this));
	  },


	  /**
	   * get next time to draw
	   * @private
	   */
	  __setNextTick: function __setNextTick() {
	    if (this.__fps > 0) {
	      this.__nextTime = Date.now() + 1000 / this.__fps;
	    }
	  },


	  /*============================
	  =            ready           =
	  ============================*/

	  /**
	   * setup html animation and play if autoplay is true
	   * @private
	   * @property {string} target - target url
	   * @property {DOM Element} targetEl - target
	   */
	  __ready: function __ready(_ref) {
	    var target = _ref.target,
	        targetEl = _ref.targetEl;

	    log('__ready');
	    this.__target = target;
	    this.__targetEl = targetEl;
	    this.play();
	    this.__render();
	  },


	  /*=============================
	  =            reset            =
	  =============================*/

	  /**
	   * @private
	   */

	  __reset: function __reset() {
	    this.pause();
	    this.__clearCanvas();
	    this.__target = null;
	    this.__targetEl = null;
	    this.__debugEl = null;
	  }
	});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	(function (global) {
	    'use strict';

	    var util = newUtil();
	    var inliner = newInliner();
	    var fontFaces = newFontFaces();
	    var images = newImages();

	    // Default impl options
	    var defaultOptions = {
	        // Default is to fail on error, no placeholder
	        imagePlaceholder: undefined,
	        // Default cache bust is false, it will use the cache
	        cacheBust: false
	    };

	    var domtoimage = {
	        toSvg: toSvg,
	        toPng: toPng,
	        toJpeg: toJpeg,
	        toBlob: toBlob,
	        toPixelData: toPixelData,
	        impl: {
	            fontFaces: fontFaces,
	            images: images,
	            util: util,
	            inliner: inliner,
	            options: {}
	        }
	    };

	    if (true)
	        module.exports = domtoimage;
	    else
	        global.domtoimage = domtoimage;


	    /**
	     * @param {Node} node - The DOM Node object to render
	     * @param {Object} options - Rendering options
	     * @param {Function} options.filter - Should return true if passed node should be included in the output
	     *          (excluding node means excluding it's children as well). Not called on the root node.
	     * @param {String} options.bgcolor - color for the background, any valid CSS color value.
	     * @param {Number} options.width - width to be applied to node before rendering.
	     * @param {Number} options.height - height to be applied to node before rendering.
	     * @param {Object} options.style - an object whose properties to be copied to node's style before rendering.
	     * @param {Number} options.quality - a Number between 0 and 1 indicating image quality (applicable to JPEG only),
	                defaults to 1.0.
	     * @param {String} options.imagePlaceholder - dataURL to use as a placeholder for failed images, default behaviour is to fail fast on images we can't fetch
	     * @param {Boolean} options.cacheBust - set to true to cache bust by appending the time to the request url
	     * @return {Promise} - A promise that is fulfilled with a SVG image data URL
	     * */
	    function toSvg(node, options) {
	        options = options || {};
	        copyOptions(options);
	        return Promise.resolve(node)
	            .then(function (node) {
	                return cloneNode(node, options.filter, true);
	            })
	            .then(embedFonts)
	            .then(inlineImages)
	            .then(applyOptions)
	            .then(function (clone) {
	                return makeSvgDataUri(clone,
	                    options.width || util.width(node),
	                    options.height || util.height(node)
	                );
	            });

	        function applyOptions(clone) {
	            if (options.bgcolor) clone.style.backgroundColor = options.bgcolor;

	            if (options.width) clone.style.width = options.width + 'px';
	            if (options.height) clone.style.height = options.height + 'px';

	            if (options.style)
	                Object.keys(options.style).forEach(function (property) {
	                    clone.style[property] = options.style[property];
	                });

	            return clone;
	        }
	    }

	    /**
	     * @param {Node} node - The DOM Node object to render
	     * @param {Object} options - Rendering options, @see {@link toSvg}
	     * @return {Promise} - A promise that is fulfilled with a Uint8Array containing RGBA pixel data.
	     * */
	    function toPixelData(node, options) {
	        return draw(node, options || {})
	            .then(function (canvas) {
	                return canvas.getContext('2d').getImageData(
	                    0,
	                    0,
	                    util.width(node),
	                    util.height(node)
	                ).data;
	            });
	    }

	    /**
	     * @param {Node} node - The DOM Node object to render
	     * @param {Object} options - Rendering options, @see {@link toSvg}
	     * @return {Promise} - A promise that is fulfilled with a PNG image data URL
	     * */
	    function toPng(node, options) {
	        return draw(node, options || {})
	            .then(function (canvas) {
	                return canvas.toDataURL();
	            });
	    }

	    /**
	     * @param {Node} node - The DOM Node object to render
	     * @param {Object} options - Rendering options, @see {@link toSvg}
	     * @return {Promise} - A promise that is fulfilled with a JPEG image data URL
	     * */
	    function toJpeg(node, options) {
	        options = options || {};
	        return draw(node, options)
	            .then(function (canvas) {
	                return canvas.toDataURL('image/jpeg', options.quality || 1.0);
	            });
	    }

	    /**
	     * @param {Node} node - The DOM Node object to render
	     * @param {Object} options - Rendering options, @see {@link toSvg}
	     * @return {Promise} - A promise that is fulfilled with a PNG image blob
	     * */
	    function toBlob(node, options) {
	        return draw(node, options || {})
	            .then(util.canvasToBlob);
	    }

	    function copyOptions(options) {
	        // Copy options to impl options for use in impl
	        if(typeof(options.imagePlaceholder) === 'undefined') {
	            domtoimage.impl.options.imagePlaceholder = defaultOptions.imagePlaceholder;
	        } else {
	            domtoimage.impl.options.imagePlaceholder = options.imagePlaceholder;
	        }

	        if(typeof(options.cacheBust) === 'undefined') {
	            domtoimage.impl.options.cacheBust = defaultOptions.cacheBust;
	        } else {
	            domtoimage.impl.options.cacheBust = options.cacheBust;
	        }
	    }

	    function draw(domNode, options) {
	        return toSvg(domNode, options)
	            .then(util.makeImage)
	            .then(util.delay(100))
	            .then(function (image) {
	                var canvas = newCanvas(domNode);
	                canvas.getContext('2d').drawImage(image, 0, 0);
	                return canvas;
	            });

	        function newCanvas(domNode) {
	            var canvas = document.createElement('canvas');
	            canvas.width = options.width || util.width(domNode);
	            canvas.height = options.height || util.height(domNode);

	            if (options.bgcolor) {
	                var ctx = canvas.getContext('2d');
	                ctx.fillStyle = options.bgcolor;
	                ctx.fillRect(0, 0, canvas.width, canvas.height);
	            }

	            return canvas;
	        }
	    }

	    function cloneNode(node, filter, root) {
	        if (!root && filter && !filter(node)) return Promise.resolve();

	        return Promise.resolve(node)
	            .then(makeNodeCopy)
	            .then(function (clone) {
	                return cloneChildren(node, clone, filter);
	            })
	            .then(function (clone) {
	                return processClone(node, clone);
	            });

	        function makeNodeCopy(node) {
	            if (node instanceof HTMLCanvasElement) return util.makeImage(node.toDataURL());
	            return node.cloneNode(false);
	        }

	        function cloneChildren(original, clone, filter) {
	            var children = original.childNodes;
	            if (children.length === 0) return Promise.resolve(clone);

	            return cloneChildrenInOrder(clone, util.asArray(children), filter)
	                .then(function () {
	                    return clone;
	                });

	            function cloneChildrenInOrder(parent, children, filter) {
	                var done = Promise.resolve();
	                children.forEach(function (child) {
	                    done = done
	                        .then(function () {
	                            return cloneNode(child, filter);
	                        })
	                        .then(function (childClone) {
	                            if (childClone) parent.appendChild(childClone);
	                        });
	                });
	                return done;
	            }
	        }

	        function processClone(original, clone) {
	            if (!(clone instanceof Element)) return clone;

	            return Promise.resolve()
	                .then(cloneStyle)
	                .then(clonePseudoElements)
	                .then(copyUserInput)
	                .then(fixSvg)
	                .then(function () {
	                    return clone;
	                });

	            function cloneStyle() {
	                copyStyle(window.getComputedStyle(original), clone.style);

	                function copyStyle(source, target) {
	                    if (source.cssText) target.cssText = source.cssText;
	                    else copyProperties(source, target);

	                    function copyProperties(source, target) {
	                        util.asArray(source).forEach(function (name) {
	                            target.setProperty(
	                                name,
	                                source.getPropertyValue(name),
	                                source.getPropertyPriority(name)
	                            );
	                        });
	                    }
	                }
	            }

	            function clonePseudoElements() {
	                [':before', ':after'].forEach(function (element) {
	                    clonePseudoElement(element);
	                });

	                function clonePseudoElement(element) {
	                    var style = window.getComputedStyle(original, element);
	                    var content = style.getPropertyValue('content');

	                    if (content === '' || content === 'none') return;

	                    var className = util.uid();
	                    clone.className = clone.className + ' ' + className;
	                    var styleElement = document.createElement('style');
	                    styleElement.appendChild(formatPseudoElementStyle(className, element, style));
	                    clone.appendChild(styleElement);

	                    function formatPseudoElementStyle(className, element, style) {
	                        var selector = '.' + className + ':' + element;
	                        var cssText = style.cssText ? formatCssText(style) : formatCssProperties(style);
	                        return document.createTextNode(selector + '{' + cssText + '}');

	                        function formatCssText(style) {
	                            var content = style.getPropertyValue('content');
	                            return style.cssText + ' content: ' + content + ';';
	                        }

	                        function formatCssProperties(style) {

	                            return util.asArray(style)
	                                .map(formatProperty)
	                                .join('; ') + ';';

	                            function formatProperty(name) {
	                                return name + ': ' +
	                                    style.getPropertyValue(name) +
	                                    (style.getPropertyPriority(name) ? ' !important' : '');
	                            }
	                        }
	                    }
	                }
	            }

	            function copyUserInput() {
	                if (original instanceof HTMLTextAreaElement) clone.innerHTML = original.value;
	                if (original instanceof HTMLInputElement) clone.setAttribute("value", original.value);
	            }

	            function fixSvg() {
	                if (!(clone instanceof SVGElement)) return;
	                clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

	                if (!(clone instanceof SVGRectElement)) return;
	                ['width', 'height'].forEach(function (attribute) {
	                    var value = clone.getAttribute(attribute);
	                    if (!value) return;

	                    clone.style.setProperty(attribute, value);
	                });
	            }
	        }
	    }

	    function embedFonts(node) {
	        return fontFaces.resolveAll()
	            .then(function (cssText) {
	                var styleNode = document.createElement('style');
	                node.appendChild(styleNode);
	                styleNode.appendChild(document.createTextNode(cssText));
	                return node;
	            });
	    }

	    function inlineImages(node) {
	        return images.inlineAll(node)
	            .then(function () {
	                return node;
	            });
	    }

	    function makeSvgDataUri(node, width, height) {
	        return Promise.resolve(node)
	            .then(function (node) {
	                node.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
	                return new XMLSerializer().serializeToString(node);
	            })
	            .then(util.escapeXhtml)
	            .then(function (xhtml) {
	                return '<foreignObject x="0" y="0" width="100%" height="100%">' + xhtml + '</foreignObject>';
	            })
	            .then(function (foreignObject) {
	                return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
	                    foreignObject + '</svg>';
	            })
	            .then(function (svg) {
	                return 'data:image/svg+xml;charset=utf-8,' + svg;
	            });
	    }

	    function newUtil() {
	        return {
	            escape: escape,
	            parseExtension: parseExtension,
	            mimeType: mimeType,
	            dataAsUrl: dataAsUrl,
	            isDataUrl: isDataUrl,
	            canvasToBlob: canvasToBlob,
	            resolveUrl: resolveUrl,
	            getAndEncode: getAndEncode,
	            uid: uid(),
	            delay: delay,
	            asArray: asArray,
	            escapeXhtml: escapeXhtml,
	            makeImage: makeImage,
	            width: width,
	            height: height
	        };

	        function mimes() {
	            /*
	             * Only WOFF and EOT mime types for fonts are 'real'
	             * see http://www.iana.org/assignments/media-types/media-types.xhtml
	             */
	            var WOFF = 'application/font-woff';
	            var JPEG = 'image/jpeg';

	            return {
	                'woff': WOFF,
	                'woff2': WOFF,
	                'ttf': 'application/font-truetype',
	                'eot': 'application/vnd.ms-fontobject',
	                'png': 'image/png',
	                'jpg': JPEG,
	                'jpeg': JPEG,
	                'gif': 'image/gif',
	                'tiff': 'image/tiff',
	                'svg': 'image/svg+xml'
	            };
	        }

	        function parseExtension(url) {
	            var match = /\.([^\.\/]*?)$/g.exec(url);
	            if (match) return match[1];
	            else return '';
	        }

	        function mimeType(url) {
	            var extension = parseExtension(url).toLowerCase();
	            return mimes()[extension] || '';
	        }

	        function isDataUrl(url) {
	            return url.search(/^(data:)/) !== -1;
	        }

	        function toBlob(canvas) {
	            return new Promise(function (resolve) {
	                var binaryString = window.atob(canvas.toDataURL().split(',')[1]);
	                var length = binaryString.length;
	                var binaryArray = new Uint8Array(length);

	                for (var i = 0; i < length; i++)
	                    binaryArray[i] = binaryString.charCodeAt(i);

	                resolve(new Blob([binaryArray], {
	                    type: 'image/png'
	                }));
	            });
	        }

	        function canvasToBlob(canvas) {
	            if (canvas.toBlob)
	                return new Promise(function (resolve) {
	                    canvas.toBlob(resolve);
	                });

	            return toBlob(canvas);
	        }

	        function resolveUrl(url, baseUrl) {
	            var doc = document.implementation.createHTMLDocument();
	            var base = doc.createElement('base');
	            doc.head.appendChild(base);
	            var a = doc.createElement('a');
	            doc.body.appendChild(a);
	            base.href = baseUrl;
	            a.href = url;
	            return a.href;
	        }

	        function uid() {
	            var index = 0;

	            return function () {
	                return 'u' + fourRandomChars() + index++;

	                function fourRandomChars() {
	                    /* see http://stackoverflow.com/a/6248722/2519373 */
	                    return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
	                }
	            };
	        }

	        function makeImage(uri) {
	            return new Promise(function (resolve, reject) {
	                var image = new Image();
	                image.onload = function () {
	                    resolve(image);
	                };
	                image.onerror = reject;
	                image.src = uri;
	            });
	        }

	        function getAndEncode(url) {
	            var TIMEOUT = 30000;
	            if(domtoimage.impl.options.cacheBust) {
	                // Cache bypass so we dont have CORS issues with cached images
	                // Source: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
	                url += ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
	            }

	            return new Promise(function (resolve) {
	                var request = new XMLHttpRequest();

	                request.onreadystatechange = done;
	                request.ontimeout = timeout;
	                request.responseType = 'blob';
	                request.timeout = TIMEOUT;
	                request.open('GET', url, true);
	                request.send();

	                var placeholder;
	                if(domtoimage.impl.options.imagePlaceholder) {
	                    var split = domtoimage.impl.options.imagePlaceholder.split(/,/);
	                    if(split && split[1]) {
	                        placeholder = split[1];
	                    }
	                }

	                function done() {
	                    if (request.readyState !== 4) return;

	                    if (request.status !== 200) {
	                        if(placeholder) {
	                            resolve(placeholder);
	                        } else {
	                            fail('cannot fetch resource: ' + url + ', status: ' + request.status);
	                        }

	                        return;
	                    }

	                    var encoder = new FileReader();
	                    encoder.onloadend = function () {
	                        var content = encoder.result.split(/,/)[1];
	                        resolve(content);
	                    };
	                    encoder.readAsDataURL(request.response);
	                }

	                function timeout() {
	                    if(placeholder) {
	                        resolve(placeholder);
	                    } else {
	                        fail('timeout of ' + TIMEOUT + 'ms occured while fetching resource: ' + url);
	                    }
	                }

	                function fail(message) {
	                    console.error(message);
	                    resolve('');
	                }
	            });
	        }

	        function dataAsUrl(content, type) {
	            return 'data:' + type + ';base64,' + content;
	        }

	        function escape(string) {
	            return string.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
	        }

	        function delay(ms) {
	            return function (arg) {
	                return new Promise(function (resolve) {
	                    setTimeout(function () {
	                        resolve(arg);
	                    }, ms);
	                });
	            };
	        }

	        function asArray(arrayLike) {
	            var array = [];
	            var length = arrayLike.length;
	            for (var i = 0; i < length; i++) array.push(arrayLike[i]);
	            return array;
	        }

	        function escapeXhtml(string) {
	            return string.replace(/#/g, '%23').replace(/\n/g, '%0A');
	        }

	        function width(node) {
	            var leftBorder = px(node, 'border-left-width');
	            var rightBorder = px(node, 'border-right-width');
	            return node.scrollWidth + leftBorder + rightBorder;
	        }

	        function height(node) {
	            var topBorder = px(node, 'border-top-width');
	            var bottomBorder = px(node, 'border-bottom-width');
	            return node.scrollHeight + topBorder + bottomBorder;
	        }

	        function px(node, styleProperty) {
	            var value = window.getComputedStyle(node).getPropertyValue(styleProperty);
	            return parseFloat(value.replace('px', ''));
	        }
	    }

	    function newInliner() {
	        var URL_REGEX = /url\(['"]?([^'"]+?)['"]?\)/g;

	        return {
	            inlineAll: inlineAll,
	            shouldProcess: shouldProcess,
	            impl: {
	                readUrls: readUrls,
	                inline: inline
	            }
	        };

	        function shouldProcess(string) {
	            return string.search(URL_REGEX) !== -1;
	        }

	        function readUrls(string) {
	            var result = [];
	            var match;
	            while ((match = URL_REGEX.exec(string)) !== null) {
	                result.push(match[1]);
	            }
	            return result.filter(function (url) {
	                return !util.isDataUrl(url);
	            });
	        }

	        function inline(string, url, baseUrl, get) {
	            return Promise.resolve(url)
	                .then(function (url) {
	                    return baseUrl ? util.resolveUrl(url, baseUrl) : url;
	                })
	                .then(get || util.getAndEncode)
	                .then(function (data) {
	                    return util.dataAsUrl(data, util.mimeType(url));
	                })
	                .then(function (dataUrl) {
	                    return string.replace(urlAsRegex(url), '$1' + dataUrl + '$3');
	                });

	            function urlAsRegex(url) {
	                return new RegExp('(url\\([\'"]?)(' + util.escape(url) + ')([\'"]?\\))', 'g');
	            }
	        }

	        function inlineAll(string, baseUrl, get) {
	            if (nothingToInline()) return Promise.resolve(string);

	            return Promise.resolve(string)
	                .then(readUrls)
	                .then(function (urls) {
	                    var done = Promise.resolve(string);
	                    urls.forEach(function (url) {
	                        done = done.then(function (string) {
	                            return inline(string, url, baseUrl, get);
	                        });
	                    });
	                    return done;
	                });

	            function nothingToInline() {
	                return !shouldProcess(string);
	            }
	        }
	    }

	    function newFontFaces() {
	        return {
	            resolveAll: resolveAll,
	            impl: {
	                readAll: readAll
	            }
	        };

	        function resolveAll() {
	            return readAll(document)
	                .then(function (webFonts) {
	                    return Promise.all(
	                        webFonts.map(function (webFont) {
	                            return webFont.resolve();
	                        })
	                    );
	                })
	                .then(function (cssStrings) {
	                    return cssStrings.join('\n');
	                });
	        }

	        function readAll() {
	            return Promise.resolve(util.asArray(document.styleSheets))
	                .then(getCssRules)
	                .then(selectWebFontRules)
	                .then(function (rules) {
	                    return rules.map(newWebFont);
	                });

	            function selectWebFontRules(cssRules) {
	                return cssRules
	                    .filter(function (rule) {
	                        return rule.type === CSSRule.FONT_FACE_RULE;
	                    })
	                    .filter(function (rule) {
	                        return inliner.shouldProcess(rule.style.getPropertyValue('src'));
	                    });
	            }

	            function getCssRules(styleSheets) {
	                var cssRules = [];
	                styleSheets.forEach(function (sheet) {
	                    try {
	                        util.asArray(sheet.cssRules || []).forEach(cssRules.push.bind(cssRules));
	                    } catch (e) {
	                        console.log('Error while reading CSS rules from ' + sheet.href, e.toString());
	                    }
	                });
	                return cssRules;
	            }

	            function newWebFont(webFontRule) {
	                return {
	                    resolve: function resolve() {
	                        var baseUrl = (webFontRule.parentStyleSheet || {}).href;
	                        return inliner.inlineAll(webFontRule.cssText, baseUrl);
	                    },
	                    src: function () {
	                        return webFontRule.style.getPropertyValue('src');
	                    }
	                };
	            }
	        }
	    }

	    function newImages() {
	        return {
	            inlineAll: inlineAll,
	            impl: {
	                newImage: newImage
	            }
	        };

	        function newImage(element) {
	            return {
	                inline: inline
	            };

	            function inline(get) {
	                if (util.isDataUrl(element.src)) return Promise.resolve();

	                return Promise.resolve(element.src)
	                    .then(get || util.getAndEncode)
	                    .then(function (data) {
	                        return util.dataAsUrl(data, util.mimeType(element.src));
	                    })
	                    .then(function (dataUrl) {
	                        return new Promise(function (resolve, reject) {
	                            element.onload = resolve;
	                            element.onerror = reject;
	                            element.src = dataUrl;
	                        });
	                    });
	            }
	        }

	        function inlineAll(node) {
	            if (!(node instanceof Element)) return Promise.resolve(node);

	            return inlineBackground(node)
	                .then(function () {
	                    if (node instanceof HTMLImageElement)
	                        return newImage(node).inline();
	                    else
	                        return Promise.all(
	                            util.asArray(node.childNodes).map(function (child) {
	                                return inlineAll(child);
	                            })
	                        );
	                });

	            function inlineBackground(node) {
	                var background = node.style.getPropertyValue('background');

	                if (!background) return Promise.resolve(node);

	                return inliner.inlineAll(background)
	                    .then(function (inlined) {
	                        node.style.setProperty(
	                            'background',
	                            inlined,
	                            node.style.getPropertyPriority('background')
	                        );
	                    })
	                    .then(function () {
	                        return node;
	                    });
	            }
	        }
	    }
	})(this);


/***/ })
/******/ ]);