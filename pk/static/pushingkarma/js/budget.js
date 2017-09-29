/*----------------------------------------------------------
 * Copyright (c) 2015 PushingKarma. All rights reserved.
 *------------------------------------------------------- */
'use strict';

pk.budget = {
  API_CATEGORIES: '/api/categories/',
  API_TRANSACTIONS: '/api/transactions/',
  BUDGET_SELECTOR: '#budget',
  KEYS: {TAB:9, ENTER:13, ESC:27, UP:38, DOWN:40},
  
  init: function(selector) {
    this.container = $(selector);
    if (!this.container.length) { return; }
    console.debug('init pk.budget on '+ selector);
    this.xhr = null;            // main actions xhr reference
    this.xhrcat = null;         // categories xhr reference
    this.xhrtrx = null;         // transactions xhr reference
    this.trxpage = null;        // Last loaded trx page
    this.search = null;         // current search string
    this.init_elements();
    this.init_triggers();
    this.init_shortcuts();
    this.update_categories();
    this.update_transactions();
  },

  init_elements: function() {
    this.sidepanel = this.container.find('#sidepanel');
    this.searchinput = this.container.find('#search');
    this.transactionsbtn = this.container.find('#search-action');
    this.categorylist = this.container.find('#sidepanel-content');
    this.maincontent = this.container.find('#maincontent');
  },

  init_triggers: function() {
    var self = this;
    var KEYS = this.KEYS;

    // search input changes
    this.searchinput.on('change paste keyup', function(event) {
      event.preventDefault();
      self.update_transactions();
    });

    // edit category or transaction
    this.container.on('dblclick', 'td > div', function() {
      event.preventDefault();
      self.td_edit($(this).closest('td'));
    });
    this.container.on('blur', 'tbody input', function() {
      event.preventDefault();
      var input = $(this);
      if (!input.val() && input.data('empty')) {
        self[input.data('empty')](input);
      } else {
        self.input_save(input);
      }
    });

    // create category when pressing enter on footer inputs
    this.categorylist.on('keydown', 'tfoot input', function(event) {
      if (event.keyCode == KEYS.ENTER) {
        var input = $(this);
        var inputs = input.closest('tr').find('input');
        self.input_save(input);
        inputs.val('').first().focus();
      }
    });

    // drag and drop categories
    this.categorylist.find('tbody').sortable({
      axis:'y', delay:150, handle:'.trend',
      update: function(event, ui) {
        var input = ui.item.find('input').first();
        self.input_save(input);
      }
    });

    // load more transactions if user scrolls near bottom
    setInterval(function() {
       var bottom = $(document).height() - $(window).scrollTop() - $(window).height();
       if (bottom < 100 && self.maincontent.find('#loadmore').length) {
          self.update_transactions(true);
       }
    }, 2000);
  },

  init_shortcuts: function() {
    // update budget items on enter
    this.container.on('keydown', 'tbody input', function(event) {
      var watchedkey = _.valuesIn(KEYS).indexOf(event.keyCode) >= 0;
      if (watchedkey) {
        var td = $(this).closest('td');
        // enter and down select td on next row
        if (event.keyCode == KEYS.ENTER || event.keyCode == KEYS.DOWN) {
          event.preventDefault();
          var row = td.closest('tr');
          var name = td.attr('name');
          var next = row.next().find('input[name='+name+']');
        // up selects input on prev row
        } else if (event.keyCode == KEYS.UP) {
          event.preventDefault();
          var row = input.closest('tr');
          var name = input.attr('name');
          var next = row.prev().find('input[name='+name+']');
        // shift + tab selects previous input in full table
        } else if (event.shiftKey && event.keyCode == KEYS.TAB) {
          event.preventDefault();
          var all = input.closest('tbody').find(':input');
          var next = all.eq(all.index(this) - 1);
        // tab selects next input in full table
        } else if (event.keyCode == KEYS.TAB) {
          event.preventDefault();
          var all = input.closest('tbody').find(':input');
          var next = all.eq(all.index(this) + 1);
        // esc reverts back to init value and stops editing
        } else if (event.keyCode == KEYS.ESC) {
          var init = input.data('init');
          self.input_display(input, init);
        }
        // edit next input or blur current
        if (next !== undefined && next.length) {
          self.td_edit(next);
        } else {
          input.blur();
        }
      }
    });
  },

  data_category: function(row) {
    return {
      id: row.data('id'),
      name: row.find('input[name=name]').val(),
      budget: pk.utils.to_float(row.find('input[name=budget]').val()),
      sortindex: row.data('add') ? null : row.index(),
    };
  },

  data_transaction: function(row) {
    return {
      id: row.attr('id'),
      bankid: row.data('bankid'),
      account: row.find('td.account').text(),
      date: row.find('input[name=date]').val(),
      payee: row.find('input[name=payee]').val(),
      category: row.find('input[name=category]').val(),
      amount: pk.utils.to_float(row.find('input[name=amount]').val()),
      approved: row.find('input[name=approved]').val() == 'x',
      comment: row.find('input[name=comment]').val(),
    }
  },

  input_delete: function(input) {
    var self = this;
    var row = input.closest('tr');
    var type = row.data('type');
    $.confirm({
      backgroundDismiss: true,
      cancelButton: 'Cancel',
      columnClass: 'col-6',
      confirmButton: 'Delete It',
      content: "Are you sure you wish to delete the "+ type +" '"+ input.data('init') +"?'",
      keyboardEnabled: true,
      title: 'Delete '+ _.startCase(type) +'?',
      confirm: function() {
        var url = row.data('url');
        self.request(input, url, 'DELETE', null, function(data) {
          input.closest('tr').remove();
        });
      },
      cancel: function() {
        var init = input.data('init');
        self.input_display(input, init);
      }
    });
  },

  input_display: function(input, value) {
    input.attr('readonly', true);
    switch (input.data('display')) {
      case 'int': input.val(pk.utils.to_amount_int(value)); break;
      case 'float': input.val(pk.utils.to_amount_float(value)); break;
      case 'bool': input.val(value ? 'x' : ''); break;
      default: input.val(value); break;
    }
  },

  td_edit: function(td) {
    if (td.hasClass('readonly')) { return; }
    // replace div with input
    var input = $('<input type="text" />').val(td.text());
    td.addClass('editing').html(input);
    input.focus();
    if (!td.hasClass('error')) {
      var display = td.data('display');
      if (display == 'int') { input.val(pk.utils.to_int(input.val())); }
      if (display == 'float') { input.val(pk.utils.to_float(input.val())); }
    }
    td.data('init', input.val());
    setTimeout(function() {
      var end = input.val().length * 2;
      var start = td.hasClass('selectall') ? 0 : end;
      input.get(0).setSelectionRange(start, end);
    }, 10);
  },

  input_save: function(input) {
    var self = this;
    var row = input.closest('tr');
    var type = row.data('type');
    // do nothing if the value is unchanged
    if (input.data('init') == input.val() && !input.hasClass('error')) {
      return self.input_display(input, input.val());
    }
    // save the new value to the database
    input.addClass('saving');
    var data = this['data_'+ type](row);
    var url = row.data('url');
    var method = data.id ? 'PUT' : 'POST';
    self.request(input, url, method, data, function(data) {
      if (row.data('add')) {
        self.update_categories();
      } else {
        self.input_display(input, data[input.attr('name')]);
      }
    });
  },
  
  request: function(input, url, method, data, callback) {
    var row = input.closest('tr');
    var xhr = $.ajax({url:url, type:method, data:data, dataType:'json'});
    xhr.always(function() {
      setTimeout(function() { input.removeClass('saving'); }, 500);
    });
    xhr.done(function(data, textStatus, jqXHR) {
      row.find('input').removeClass('error');
      row.removeData('errors');
      callback(data, textStatus, jqXHR);
    });
    xhr.fail(function(jqXHR, textStatus, errorThrown) {
      input.addClass('error');
      row.data('errors', jqXHR.responseJSON);
    });
    return xhr;
  },
 
  update_categories: function() {
    var self = this;
    var url = '/api/categories/';
    try { this.xhrtrx.abort(); } catch(err) { }
    this.xhrcat = $.ajax({url:url, type:'GET', dataType:'json'});
    this.xhrcat.done(function(data, textStatus, jqXHR) {
      var html = self.templates.listcategories(data);
      self.categorylist.find('tbody').html(html);
    });
  },

  update_transactions: function(nextpage) {
    var self = this;
    if (!nextpage) {
      self.trxpage = null;
      var loadmore = null;
      var url = '/api/transactions/';
      var search = this.searchinput.val();
      url = search ? pk.utils.update_url(url, 'search', search) : url;
    } else {
      var loadmore = this.maincontent.find('#loadmore');
      var url = loadmore.data('next');
      loadmore.addClass('on');
    }
    if (self.trxpage != url) {
      self.trxpage = url;
      try { this.xhrtrx.abort(); } catch(err) { }
      this.xhrtrx = $.ajax({url:url, type:'GET', dataType:'json'});
      this.xhrtrx.done(function(data, textStatus, jqXHR) {
        if (loadmore) { loadmore.remove(); }
        var html = self.templates.listtransactions(data);
        self.maincontent.find('tbody').append(html);
      });
    }
  },

  // data attributes that affect ttd element behavior:
  //   data-id: ID of the item being displayed.
  //   data-type: category or transaction of item being displayed.
  //   data-name: name of the model field td corresponds to.
  //   data-display: int or float currency representaion.
  //   data-url: API url to use when editing item.
  //   selectall (class): Select all content when initializing edit.
  //   readonly (class): Do not allow editing this item.
  templates: {
    listcategories: Handlebars.compile([
      '{{#each this.results}}',
      '  <tr data-id="{{this.id}}" data-type="category" data-url="{{this.url}}">',
      '    <td data-name="name"><div>{{this.name}}</div></td>',
      '    <td data-name="trend"><div>&nbsp;</div></td>',
      '    <td data-name="budget" class="right"><div>{{amountInt this.budget}}</div></td>',
      '  </tr>',
      '{{/each}}',
    ].join('\n')),

    listtransactions: Handlebars.compile([
      '{{#each this.results}}',
      '  <tr id="{{this.id}}" data-type="transaction" data-bankid="{{this.bankid}}" data-url="{{this.url}}">',
      '    <td data-name="account" class="readonly"><div>{{this.account}}</div></td>',
      '    <td data-name="date"><div>{{this.date}}</div></td>',
      '    <td data-name="payee"><div>{{this.payee}}</div></td>',
      '    <td data-name="category"><div>{{this.category.name}}</div></td>',
      '    <td data-name="amount" class="right"><div>{{amountFloat this.amount}}</div></td>',
      '    <td data-name="approved" class="center selectall"><div>{{yesNo this.approved \'x\' \'\'}}</div></td>',
      '    <td data-name="comment"><div>{{this.comment}}</div></td>',
      '  </tr>',
      '{{/each}}',
      '{{#if this.next}}',
      '  <tr id="loadmore" data-next="{{this.next}}">',
      '    <td colspan="100%"><span class="spinner on"></span></td>',
      '  </tr>',
      '{{/if}}',
    ].join('\n')),

    // listtransactions: Handlebars.compile([
    //   '{{#each this.results}}',
    //   '  <tr id="{{this.id}}" data-type="transaction" data-bankid="{{this.bankid}}" data-url="{{this.url}}">',
    //   '    <td class="account">{{this.account}}</td>',
    //   '    <td class="date"><input name="date" type="text" value="{{this.date}}" autocomplete="off" readonly="readonly"></td>',
    //   '    <td class="payee"><input name="payee" type="text" value="{{this.payee}}" autocomplete="off" readonly="readonly"></td>',
    //   '    <td class="category"><input name="category" type="text" value="{{this.category.name}}" autocomplete="off" readonly="readonly"></td>',
    //   '    <td class="amount right"><input name="amount" data-display="float" type="text" value="{{amountFloat this.amount}}" autocomplete="off" readonly="readonly"></td>',
    //   '    <td class="approved center"><input name="approved" data-display="bool" data-selectall="true" type="text" value="{{yesNo this.approved \'x\' \'\'}}" autocomplete="off" readonly="readonly"></td>',
    //   '    <td class="comment"><input name="comment" type="text" value="{{this.comment}}" autocomplete="off" readonly="readonly"></td>',
    //   '  </tr>',
    //   '{{/each}}',
    //   '{{#if this.next}}',
    //   '  <tr id="loadmore" data-next="{{this.next}}">',
    //   '    <td colspan="100%"><span class="spinner on"></span></td>',
    //   '  </tr>',
    //   '{{/if}}',
    // ].join('\n')),
  },

};
