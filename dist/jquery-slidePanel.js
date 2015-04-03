/*! jQuery slidePanel - v0.1.0 - 2015-04-03
* https://github.com/amazingSurge/jquery-slidePanel
* Copyright (c) 2015 amazingSurge; Licensed GPL */
(function($, document, window, undefined) {
    "use strict";

var SlidePanel = $.slidePanel = function(){
	SlidePanel.open.apply( this, arguments );
};

if (!Date.now) {
    Date.now = function() {
        return new Date().getTime();
    };
}

function getTime() {
    if (typeof window.performance !== 'undefined' && window.performance.now) {
        return window.performance.now();
    } else {
        return Date.now();
    }
}

var vendors = ['webkit', 'moz'];
for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = (window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame']);
}
if (/iP(ad|hone|od).*OS (6|7|8)/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function(callback) {
        var now = getTime();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function() {
                callback(lastTime = nextTime);
            },
            nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
}
var Support = (function() {
    var style = $('<support>').get(0).style,
        prefixes = ['webkit', 'Moz', 'O', 'ms'],
        events = {
            transition: {
                end: {
                    WebkitTransition: 'webkitTransitionEnd',
                    MozTransition: 'transitionend',
                    OTransition: 'oTransitionEnd',
                    transition: 'transitionend'
                }
            },
            animation: {
                end: {
                    WebkitAnimation: 'webkitAnimationEnd',
                    MozAnimation: 'animationend',
                    OAnimation: 'oAnimationEnd',
                    animation: 'animationend'
                }
            }
        },
        tests = {
            csstransforms: function() {
                return !!test('transform');
            },
            csstransforms3d: function() {
                return !!test('perspective');
            },
            csstransitions: function() {
                return !!test('transition');
            },
            cssanimations: function() {
                return !!test('animation');
            }
        };

    function test(property, prefixed) {
        var result = false,
            upper = property.charAt(0).toUpperCase() + property.slice(1);
        $.each((property + ' ' + prefixes.join(upper + ' ') + upper).split(' '), function(i, property) {
            if (style[property] !== undefined) {
                result = prefixed ? property : true;
                return false;
            }
        });

        return result;
    }

    function prefixed(property) {
        return test(property, true);
    }
    var support = {};
    if (tests.csstransitions()) {
        /* jshint -W053 */
        support.transition = new String(prefixed('transition'))
        support.transition.end = events.transition.end[support.transition];
    }

    if (tests.cssanimations()) {
        /* jshint -W053 */
        support.animation = new String(prefixed('animation'))
        support.animation.end = events.animation.end[support.animation];
    }

    if (tests.csstransforms()) {
        /* jshint -W053 */
        support.transform = new String(prefixed('transform'));
        support.transform3d = tests.csstransforms3d();
    }

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
        support.touch = true;
    } else {
        support.touch = false;
    }
    return support;
})();

function convertMatrixToArray(value) {
    if (value && (value.substr(0, 6) == "matrix")) {
        return value.replace(/^.*\((.*)\)$/g, "$1").replace(/px/g, '').split(/, +/);
    }
    return false;
}

function getHashCode(object){
  if(typeof object !=='string'){
    object = JSON.stringify(object);
  }

  var hash = 0, i, chr, len;
  if (object.length == 0) return hash;
  for (i = 0, len = object.length; i < len; i++) {
    chr   = object.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}
function easingBezier(mX1, mY1, mX2, mY2) {
    function a(aA1, aA2) {
        return 1.0 - 3.0 * aA2 + 3.0 * aA1;
    }

    function b(aA1, aA2) {
        return 3.0 * aA2 - 6.0 * aA1;
    }

    function c(aA1) {
        return 3.0 * aA1;
    }

    // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier(aT, aA1, aA2) {
        return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
    }

    // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope(aT, aA1, aA2) {
        return 3.0 * a(aA1, aA2) * aT * aT + 2.0 * b(aA1, aA2) * aT + c(aA1);
    }

    function getTForX(aX) {
        // Newton raphson iteration
        var aGuessT = aX;
        for (var i = 0; i < 4; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) return aGuessT;
            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }

    if (mX1 === mY1 && mX2 === mY2) {
        return {
            css: 'linear',
            fn: function(aX) {
                return aX;
            }
        };
    } else {
        return {
            css: 'cubic-bezier(' + mX1 + ',' + mY1 + ',' + mX2 + ',' + mY2 + ')',
            fn: function(aX) {
                return calcBezier(getTForX(aX), mY1, mY2);
            }
        }
    }
};

var Easings = {
    'ease': easingBezier(0.25, 0.1, 0.25, 1.0),
    'linear': easingBezier(0.00, 0.0, 1.00, 1.0),
    'ease-in': easingBezier(0.42, 0.0, 1.00, 1.0),
    'ease-out': easingBezier(0.00, 0.0, 0.58, 1.0),
    'ease-in-out': easingBezier(0.42, 0.0, 0.58, 1.0)
};

SlidePanel.options = {
	classes: {
		panel: 'sidePanel',
		show: 'slidePanel-show',
		loading: 'sidePanel-loading',
		content: 'sidePanel-content'
	},

	template: function(){
		return '<div class="'+this.options.classes.panel+'"><div class="'+this.options.classes.content+'"></div></div>';
	},

	loading: {
		template: function(){
			return '<div class="'+this.options.classes.loading+'"></div>';
		},
	},

	useCssTransforms3d: true,
    useCssTransforms: true,
    useCssTransitions: true,

	direction: 'right', // up, down, left, right
	duration: '300',
	easing: 'ease' // linear, ease-in, ease-out, ease-in-out
};

// View
function View() { 
	return this.initialize.apply(this, Array.prototype.slice.call(arguments));
};

$.extend(View.prototype, {
    initialize: function(options) {
        this.options = options;

        this.build();
    },

    build: function() {
        if (this._build) return;

        var html = this.options.template.call(SlidePanel);
        this.$panel = $(html).appendTo('body');
        this.$content = this.$panel.find('.'+this.options.classes.content);
        
        this.loading = new Loading(this);

        this._build = true;
    },

    show: function(callback) {
        this.build();
    },

    hide: function(callback) {
        
    }
});
// Loading
function Loading() { 
	return this.initialize.apply(this, Array.prototype.slice.call(arguments)); 
};

$.extend(Loading.prototype, {
    initialize: function(view) {

        this.build();
    },

    build: function() {
        if (this._build) return;
        
        this._build = true;
    },

    show: function(callback) {
        this.build();
    },

    hide: function(callback) {
        
    }
});


// Instance
function Instance() { 
	return this.initialize.apply(this, Array.prototype.slice.call(arguments)); 
};

$.extend(Instance.prototype, {
    initialize: function(object) {
        var options = arguments[1] || {};
        
        if (typeof object === 'string') {
			object = {
				url: object
			};
		} else if (object && object.nodeType == 1) {
			var $element = $(object);

			object = {
				url: $element.attr('href'),
				options: $element.data() || {}
			}
		}

		if(object && object.options) {
			object.options = $.extend(true, options, object.options);
		} else {
			object.options = $.extend({}, options);
		}

		object.options = $.extend(true, SlidePanel.options, object.options);

		$.extend(this, object);

		return this;
    }
});

var _SlidePanel = {
    // Current state information.
    _states: {},
    _views: {},

    initialize: function() {
        
    },

    /**
     * Checks whether the carousel is in a specific state or not.
     */
    is: function(state) {
        return this._states[state] && this._states[state] > 0;
    },

    /**
     * Enters a state.
     */
    enter: function(state) {
        if (this._states[state] === undefined) {
            this._states[state] = 0;
        }

        this._states[state] ++;
    },

    /**
     * Leaves a state.
     */
    leave: function(state) {
        this._states[state] --;
    },

    show: function(object){
        if(!(object instanceof Instance)){
            object = new Instance.apply(arguments);
        }
        
        var view = this.getView(object.options);
        view.show();
    },

    getView: function(options) {
        var code = getHashCode(options);

        if(this._views.hasOwnProperty(code)){
            return this._views[code];
        }

        return this._views[code] = new View(options);
    },

    hide: function(){

    }
};
$.extend(SlidePanel, {
    is: function(state) {
        return _SlidePanel.is(state);
    },

    show: function(object) {
        _SlidePanel.show.apply(_SlidePanel, Array.prototype.slice.call(arguments, 1));
        return this;
    },

    hide: function() {
        View.hide();
        return this;
    }
});
$.fn.slidePanel = function(options) {
    if (typeof options === 'string') {
        var method = options;
        var method_arguments = Array.prototype.slice.call(arguments, 1);
        if (/^\_/.test(method)) {
            return false;
        } else {
            return this.each(function() {
                var instance = $.data(this, 'slidePanel');
                // if (instance && typeof SlidePanel[method] === 'function') {
                //     SlidePanel[method].apply(instance, method_arguments);
                // }
            });
        }
    } else {
        return this.each(function() {
            if (!$.data(this, 'slidePanel')) {
                $.data(this, 'slidePanel', new Instance(this, options));

                $(this).on('click', function(e){
                    var instance = $.data(this, 'slidePanel');
                    _SlidePanel.show(instance);
                    
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        });
    }
};

})(jQuery, document, window);