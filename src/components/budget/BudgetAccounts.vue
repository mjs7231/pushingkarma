<template>
  <div id='budgetsettingsaccounts' v-hotkey='keymap'>
    <!-- <h2>Bank Accounts</h2> -->
    <p>Add all accounts that you plan to upload .qfx files for. Each bank should
      provide a unique FID that you can see by opening the file. This is used to
      determine the bank the data originated when uploading transactions.</p>
    <div v-click-outside='_cancelall'>
      <b-table :data='tabledata' narrowed ref='table' tabindex='-1'>
        <template slot-scope='props'>
          <b-table-column v-for='cell in props.row' :key='cell.col.name' v-bind='cell.col'>
            <TableCell v-bind='cell' :ref='`c${cell.tabindex}`' :key='cell.row.id' @action='action'/>
              <!-- @click.native='clickSetFocus($event, cell.tabindex)'/> -->
          </b-table-column>
        </template>
        <template slot='empty'>No items to display.</template>
      </b-table>
      <div style='margin-top:10px;'>
        <b-button size='is-small' type='is-danger' class='is-pulled-right' @click.prevent='confirmDelete'
          :disabled='!focus'>Delete Account</b-button>
        <b-button size='is-small' class='add' @click.prevent='add'>Add New Account</b-button>
      </div>
    </div>
  </div>
</template>

<script>
  import * as api from '@/api';
  import * as pathify from 'vuex-pathify';
  import * as utils from '@/utils/utils';
  import TableMixin from '@/components/TableMixin';
  import {TYPES} from '@/components/TableMixin';
  import Vue from 'vue';

  export default {
    name: 'BudgetAccounts',
    mixins: [TableMixin],
    data: function() {
      return {
        columns: [
          {type:TYPES.editable, label:'Name', field:'name', width:'160px'},
          {type:TYPES.editable, label:'FID', field:'fid', select:true, width:'160px'},
          {type:TYPES.editable, label:'Payee Field', field:'payee', width:'160px'},
          {type:TYPES.readonly, label:'Last Updated', field:'balancedt', width:'140px', display:utils.timeAgo},
          {type:TYPES.readonly, label:'Transactions', field:'meta.num_transactions', width:'150px', numeric:true, display:utils.intComma},
          {type:TYPES.readonly, label:'Balance', field:'balance', width:'150px', cls:'blur', numeric:true, display:utils.usd, opts:{color:true}},
        ],
      };
    },
    computed: {
      items: pathify.sync('budget/accounts'),
      keymap: function() { return this.tablemixin_keymap(); },
    },
    mounted: function() {
      document.title = `PushingKarma - Budget Accounts`;
    },
    methods: {
      // Save
      // Save the current cell value - There is a slight bit of wonkyness here in
      // that this function is called anytime a cell value changed, but depending
      // on the state of row.id or row.name we may be creating or deleting the
      // the account data.
      // save: async function(id, rowindex, field, newvalue, cell=null, refresh=false) {
      //   if (id == null && field == 'name' && newvalue != '') { return this.create(newvalue); }
      //   if (id == null && field == 'name' && newvalue == '') { return this.refresh(); }
      //   try {
      //     var change = utils.rset({}, field, newvalue);
      //     var {data} = await api.Budget.patchAccount(id, change);
      //     Vue.set(this.items, rowindex, data);
      //     if (cell) { cell.setStatus('success', 1000); }
      //     if (refresh) { this.refresh(); }
      //     return data;
      //   } catch(err) {
      //     if (cell) { cell.setStatus('error'); }
      //     utils.snackbar(`Error saving account.`);
      //     console.log(err);
      //     return err;
      //   }
      // },

      // Save (action)
      // Save a new value to the database
      // Options: {id, field, newvalue, (callback)}
      _save: async function(opts) {
        try {
          var change = utils.rset({}, opts.field, opts.newvalue);
          var {data} = await api.Budget.patchAccount(opts.id, change);
          this.updateItem(opts.id, data);
          if (opts.callback) { opts.callback({'status':'success', data:data}); }
        } catch(err) {
          utils.snackbar(`Error saving account.`);
          if (opts.callback) { opts.callback({'status':'error', error:err}); }
        }
      },

      // Create
      // Create a new account in the database
      create: async function(name) {
        try {
          var params = {name:name, type:'bank'};
          var {data} = await api.Budget.createAccount(params);
          Vue.set(this.items, this.items.length-1, data);
        } catch(err) {
          utils.snackbar(`Error creating account ${name}.`);
          console.error(err);
        }
      },

      // Confirm Delete
      // Confirm and delete an existing account in the database
      confirmDelete: async function() {
        var self = this;
        var account = this.item;
        this.$buefy.dialog.confirm({
            title: 'Delete Account',
            message: `Are you sure you want to delete the account <b>${account.name}</b>?`,
            confirmText: 'Delete Account',
            focusOn: 'cancel',
            type: 'is-danger',
            onConfirm: async function() {
              await api.Budget.deleteAccount(account.id);
              utils.snackbar(`Successfully deleted account ${account.name}.`);
              self.refresh();
            },
        });
      },

      // Refresh
      // Refresh the list of accounts displayed
      refresh: async function() {
        var {data} = await api.Budget.getAccounts();
        this.items = data.results;
      },
    }
  };
</script>
