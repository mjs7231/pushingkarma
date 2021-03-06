import Vue from 'vue';
import * as dayjs from 'dayjs';
import * as utils from '@/utils/utils';

var RelativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(RelativeTime);

Vue.filter('formatDate', function(value, format) {
  return utils.formatDate(value, {format});
});
Vue.filter('int', utils.int);
Vue.filter('intcomma', utils.intComma);
Vue.filter('timeAgo', utils.timeAgo);
Vue.filter('usd', utils.usd);
Vue.filter('usdint', utils.usdint);
