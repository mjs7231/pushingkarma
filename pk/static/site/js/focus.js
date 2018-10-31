// Encoding: UTF-8
'use strict';

pk.focus = {
    UPDATE_URL: '/focus/?json=1',   // data url
    REGEX_IP: /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/,

    init: function(selector, initdata) {
      var self = this;
      this.container = $(selector);
      if (!this.container.length) { return; }
      console.debug('init pk.focus on '+ selector);
      self.data = initdata || {};
      self.xhr = null;
      self.init_update_url();
      self.init_elements();
      self.init_triggers();
      // main loop
      setInterval(function() { self.update_clock(); }, 10000);      // 10 seconds
      setInterval(function() { self.update_news(); }, 20000);       // 20 seconds
      setInterval(function() { self.update_calendar(); }, 60000);   // 1 minute
      setInterval(this.update_data, 300000);                        // 5 minutes
      this.update_widgets();
      this.update_clock();
      this.update_photo();
      this.update_ip();
    },

    init_update_url: function() {
      var params = pk.utils.url_params();
      if (params.apikey) {
        this.UPDATE_URL += '&apikey='+ params.apikey;
      }
    },

    init_elements: function() {
      this.clock = this.container.find('#clock');
      this.photo = this.container.find('#photo');
      this.calendar = this.container.find('#calendar');
      this.weather = this.container.find('#weather');
      this.tasks = this.container.find('#tasks');
      this.news = this.container.find('#news');
      this.ip = this.container.find('#ip');
    },

    init_triggers: function() {
      var self = this;
      this.container.on('click', function() {
        self.container.toggleClass('hidecursor');
      });
    },
    
    update_data: function(initdata) {
      var self = this;
      self.xhr = $.ajax({url:self.UPDATE_URL, type:'GET', dataType:'json'});
      self.xhr.done(function(data, textStatus, jqXHR) {
        self.data = data.data;
        self.update_widgets();
      });
    },

    update_widgets: function() {
      this.weather.html(pk.templates.weather(this.data)).fadeIn('slow');
      this.tasks.html(pk.templates.tasks(this.data)).fadeIn('slow');
      this.update_calendar();
      this.update_news();
    },

    update_clock: function() {
      this.clock.html(pk.templates.clock()).fadeIn('slow');
    },

    update_photo: function() {
      this.photo.html(pk.templates.photo(this.data)).fadeIn('slow');
    },

    update_ip: function() {
      var self = this;
      window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
      var pc = new RTCPeerConnection({iceServers:[]})
      var noop = function(){};      
      pc.createDataChannel('');  //create a bogus data channel
      pc.createOffer(pc.setLocalDescription.bind(pc), noop);  // create offer and set local description
      pc.onicecandidate = function(ice) {
        if (ice && ice.candidate && ice.candidate.candidate) {
          var ip = self.REGEX_IP.exec(ice.candidate.candidate)[1];
          console.log('IP: ', ip); self.ip.text(ip).fadeIn('slow');
          pc.onicecandidate = noop;
        }
      };
    },

    update_calendar: function() {
      var events = [];
      var now = moment();
      var max = moment().add(12, 'hours');
      for (var i=0; i < this.data.calendar.length; i++) {
        var start = moment(this.data.calendar[i].Start);
        var end = moment(this.data.calendar[i].End);
        if ((end > now) && (start < max)) {
          events.push(this.data.calendar[i]);
        }
      }
      this.calendar.html(pk.templates.calendar({events:events})).fadeIn('slow');
    },

    update_news: function() {
      var self = this;
      if (self.data.news) {
        self.news.fadeOut(function() {
          var index = Math.floor(Math.random() * self.data.news.length)
          var data = {article: self.data.news[index]};
          self.news.html(pk.templates.news(data)).fadeIn('slow');
        });
      }
    },

}
