// Encoding: UTF-8
'use strict';

pk.notes = {
  KEYS: {TAB:9, ENTER:13, ESC:27, F3:114, UP:38, DOWN:40},
  URL_NOTES: '/api/notes',

  init: function(selector, opts) {
    this.container = $(selector);
    if (!this.container.length) { return; }
    console.debug('init pk.notes on '+ selector);
    this.opts = $.extend(true, {}, this.defaults, opts);
    this.xhr = null;
    this.search = null;
    this.init_elements();
    this.init_triggers();
    this.init_shortcuts();
    this.update_list(this.searchinput.val(), this.opts.init_noteid);
  },
  
  init_elements: function() {
    this.sidepanel = this.container.find('#sidepanel');
    this.searchinput = this.container.find('#search');
    this.addnote = this.container.find('#search-action');
    this.notelist = this.container.find('#sidepanel-content');
  },
  
  init_triggers: function() {
    var self = this;
    // search input changes
    this.searchinput.on('change paste keyup', function(event) {
      if (_.valuesIn(this.KEYS).indexOf(event.keyCode) == -1) {
        event.preventDefault();
        var url = pk.utils.update_url(null, {search:$(this).val()})
        window.history.replaceState(null, null, url);
        self.update_list($(this).val());
      }
    });
    // start a new note
    this.addnote.on('click', function() {
      event.preventDefault();
      self.new_note();
    });
  },
  
  init_shortcuts: function() {
    var self = this;
    var KEYS = this.KEYS;
    // select noteitems via keyboard
    $(document).on('keydown', function(event) {
      var noteitems = self.notelist.find('.notes-item');
      var focused = self.searchinput.is(':focus');
      if (event.keyCode == KEYS.F3) {
        event.preventDefault();
        event.stopPropagation();
        self.searchinput.focus();
      } else if (focused && (_.valuesIn(KEYS).indexOf(event.keyCode) > -1)) {
        event.preventDefault();
        var selected = noteitems.filter('.selected');
        if ((event.keyCode == KEYS.DOWN) || (event.keyCode == KEYS.TAB)) {
          var next = selected.next();
          next = next.length ? next : noteitems.filter(':first-child');
          noteitems.removeClass('selected');
          next.addClass('selected');
        } else if (event.keyCode == KEYS.UP) {
          var prev = selected.prev().filter('.notes-item');
          prev = prev.length ? prev : noteitems.filter(':last-child');
          noteitems.removeClass('selected');
          prev.addClass('selected');
        } else if ((event.keyCode == KEYS.ENTER) && (selected.length)) {
          window.top.location = selected.attr('href');
        } else if (event.keyCode == KEYS.ESC) {
          noteitems.removeClass('selected');
        }
      }
    });
  },
  
  new_note: function() {
    pk.editor.toggle_editor(true);
    pk.editor.history.saved = {};
    pk.editor.codemirror.setValue('');
    pk.editor.title.val('');
    pk.editor.tags.val('');
    window.history.replaceState('','','/n/');
  },
  
  update_list: function(search, noteid) {
    var self = this;
    if (search == this.search) { return; }
    try { this.xhr.abort(); } catch(err) { }
    var url = search ? this.URL_NOTES +'?search='+ encodeURIComponent(search) : this.URL_NOTES;
    this.xhr = $.ajax({url:url, type:'GET', dataType:'json'});
    this.xhr.done(function(data, textStatus, jqXHR) {
      var ctx = {notes:data.results, search:encodeURIComponent(search), noteid:noteid};
      var html = pk.templates.note_items(ctx);
      self.notelist.html(html);
      self.search = search;
    });
  },

  defaults: {
    editor: null,         // (required) reference to pk.editor object
    init_noteid: null,    // initial noteid to highlight
  },

};