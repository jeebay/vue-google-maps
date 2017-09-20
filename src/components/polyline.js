import {omit, clone} from 'lodash'

import eventBinder from '../utils/eventsBinder.js';
import propsBinder from '../utils/propsBinder.js';
import MapElementMixin from './mapElementMixin';
import getPropsValuesMixin from '../utils/getPropsValuesMixin.js';

const props = {
  draggable: {
    type: Boolean
  },
  editable: {
    type: Boolean,
  },
  options: {
    twoWay: false,
    type: Object
  },
  path: {
    type: Array,
    twoWay: true
  },
  deepWatch: {
    type: Boolean,
    default: false,
  },
  animate: {
    type: Boolean,
    default: false
  }
};

const events = [
  'click',
  'dblclick',
  'drag',
  'dragend',
  'dragstart',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'rightclick'
];

export default {
  mixins: [MapElementMixin, getPropsValuesMixin],
  props: props,

  methods: {
    animateCircle(line) {
      var count = 0;

      window.setInterval(function() {
        count = (count + 1) % 200;

        var icons = line.get('icons');
        icons[0].offset = (count / 2) + '%';
        line.set('icons', icons);
      }, 200);
    }
  },

  render() { return ''; },

  destroyed () {
    if (this.$polylineObject) {
      this.$polylineObject.setMap(null);
    }
  },

  deferredReady() {
    const options = clone(this.getPropsValues());
    delete options.options;
    Object.assign(options, this.options);
    this.$polylineObject = new google.maps.Polyline(options);
    this.$polylineObject.setMap(this.$map);

    if (this.animate) this.animateCircle(this.$polylineObject);

    propsBinder(this, this.$polylineObject, omit(props, ['deepWatch', 'path']));
    eventBinder(this, this.$polylineObject, events);

    var clearEvents = () => {};

    this.$watch('path', (path) => {
      if (path) {
        clearEvents();

        this.$polylineObject.setPath(path);

        const mvcPath = this.$polylineObject.getPath();
        const eventListeners = [];

        const updatePaths = () => {
          this.$emit('path_changed', this.$polylineObject.getPath());
        };

        eventListeners.push([mvcPath, mvcPath.addListener('insert_at', updatePaths)]);
        eventListeners.push([mvcPath, mvcPath.addListener('remove_at', updatePaths)]);
        eventListeners.push([mvcPath, mvcPath.addListener('set_at', updatePaths)]);

        clearEvents = () => {
          eventListeners.map(([obj, listenerHandle]) => // eslint-disable-line no-unused-vars
            google.maps.event.removeListener(listenerHandle));
        };
      }
    }, {
      deep: this.deepWatch
    });

    // Display the map
    this.$polylineObject.setMap(this.$map);
  },
};
