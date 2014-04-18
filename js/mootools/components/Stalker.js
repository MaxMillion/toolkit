/**
 * @copyright   2010-2014, The Titon Project
 * @license     http://opensource.org/licenses/BSD-3-Clause
 * @link        http://titon.io
 */

Toolkit.Stalker = new Class({
    Extends: Toolkit.Component,
    Binds: ['onScroll'],

    /** Element that contains the elements */
    container: null,

    /** Elements to apply active state to */
    targets: [],

    /** Elements that trigger the active state */
    markers: [],

    /** Offset positioning for markers */
    offsets: [],

    /** Default options */
    options: {
        target: '',
        targetBy: 'href',
        marker: '',
        markBy: 'id',
        threshold: 50,
        throttle: 50,
        onlyWithin: true,
        applyToParent: true
    },

    /**
     * Initialize the component by fetching elements and binding events.
     *
     * @param {Element} element
     * @param {Object} [options]
     */
    initialize: function(element, options) {
        this.parent(options);
        this.element = element;
        this.container = (element.getStyle('overflow') === 'auto') ? element : window;

        if (!this.options.target || !this.options.marker) {
            throw new Error('A marker and target is required');
        }

        element.addClass(Toolkit.vendor + 'stalker');

        // Gather markets and targets
        this.refresh();

        // Initialize events
        var events;

        this.events = events = {
            'ready document': 'onScroll'
        };

        events['scroll:throttle(' + this.options.throttle + ') container'] = 'onScroll';

        this.enable();
        this.fireEvent('init');
    },

    /**
     * Activate a target when a marker is entered.
     *
     * @param {Element} marker
     * @returns {Toolkit.Stalker}
     */
    activate: function(marker) {
        this._stalk(marker, 'activate');

        return this;
    },

    /**
     * Deactivate a target when a marker is exited.
     *
     * @param {Element} marker
     * @returns {Toolkit.Stalker}
     */
    deactivate: function(marker) {
        this._stalk(marker, 'deactivate');

        return this;
    },

    /**
     * Gather the targets and markers used for stalking.
     *
     * @returns {Toolkit.Stalker}
     */
    refresh: function() {
        if (this.element.getStyle('overflow') === 'auto' && this.element !== document.body) {
            this.element.scrollTop = 0; // Set scroll to top so offsets are correct
        }

        this.targets = $$(this.options.target).addClass(Toolkit.vendor + 'stalker-target');

        this.markers = $$(this.options.marker).addClass(Toolkit.vendor + 'stalker-marker');

        this.offsets = this.markers.getCoordinates(this.element);

        return this;
    },

    /**
     * Either active or deactivate a target based on the marker.
     *
     * @private
     * @param {Element} marker
     * @param {String} type
     */
    _stalk: function(marker, type) {
        // Stop all the unnecessary processing
        if (type === 'activate' && marker.hasClass('is-stalked')) {
            return;
        }

        var targetBy = this.options.targetBy,
            markBy = this.options.markBy,
            method = (type === 'activate') ? 'addClass' : 'removeClass',
            target = this.targets.filter(function(item) {
                return (item.get(targetBy).replace('#', '') === marker.get(markBy));
            });

        marker[method]('is-stalked');

        if (this.options.applyToParent) {
            target.getParent()[method]('is-active');
        } else {
            target[method]('is-active');
        }

        this.fireEvent(type, [marker, target]);
    },

    /**
     * While the element is being scrolled, notify the targets when a marker is reached.
     *
     * @private
     */
    onScroll: function() {
        var scroll = this.container.getScroll().y,
            markers = this.markers,
            offsets = this.offsets,
            onlyWithin = this.options.onlyWithin,
            threshold = this.options.threshold;

        markers.each(function(marker, index) {
            var coords = offsets[index],
                top = coords.top - threshold,
                bot = coords.top + coords.height + threshold;

            // Scroll is within the marker
            if (
                (onlyWithin && scroll >= top && scroll <= bot) ||
                (!onlyWithin && scroll >= top)
            ) {
                this.activate(marker);

            // Scroll went outside the marker
            } else {
                this.deactivate(marker);
            }
        }.bind(this));

        this.fireEvent('scroll');
    }

});

/**
 * Defines a component that can be instantiated through stalker().
 */
Toolkit.create('stalker', function(options) {
    return new Toolkit.Stalker(this, options);
});