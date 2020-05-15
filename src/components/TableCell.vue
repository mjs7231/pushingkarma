<template>
  <div class='tablecell' :class='[status,{focused,editing}]' :style='{"max-width":col.width}' tabindex='-1'
      @keydown.up='navigate($event, "up")' @keydown.down='navigate($event, "down")'
      @keydown.left='navigate($event, "left")' @keydown.right='navigate($event, "right")'
      @click='click' @keydown.esc='esc' @keydown.enter='enter'>
    <!-- Toggle Cell -->
    <div v-if='col.cls=="check"' @mousedown='preventDoubleClick' ref='div' tabindex='-1' :style='{"min-width":col.width}'>
      <i v-if='value' class='mdi mdi-check'/>
    </div>
    <!-- Readonly, Editable, Choice Cells -->
    <div v-else v-html='html' :contenteditable='contenteditable' ref='div' :style='{"min-width":col.width}'
        spellcheck='false' @input="text=$event.target.textContent" tabindex='-1'
        @mousedown='preventDoubleClick'/>
      <!-- @keyup.up.prevent='moveChoice(-1)' @keyup.down.prevent='moveChoice(+1)' @keydown.enter='makeChoice'/> -->
    <!-- Choice Dropdown -->
    <ul v-if='contenteditable && (choices.length > 0)' class='choices' :style='{"min-width":col.width}'>
      <li v-for='(c,i) in choices' :key='c.id' class='choice' :class='{highlighted:i==choice}' @click='makeChoice'>{{c.name}}</li>
    </ul>
  </div>
</template>

<script>
  import * as utils from '@/utils/utils';
  import fuzzysort from 'fuzzysort';
  import trim from 'lodash/trim';

  export default {
    name: 'TableCell',
    props: {
      col: {type:Object, required:true},
      row: {type:Object, required:true},
      rowindex: {type:Number, required:true},
      tabindex: {required:true},
    },
    data: () => ({
      choice: 0,            // Current highlighted choice
      choices: [],          // Choices for display
      editing: false,       // True if editing this cell
      focused: false,       // True if this cell is focused
      status: 'default',    // Sets bgcolor to status {success or error}
      text: '',             // Current textContent
    }),
    computed: {
      contenteditable: function() { return this.focused && this.editing; },     // True if currently editable
      item: function() { return this.row; },                                    // Alias for this.row
      value: function() { return utils.rget(this.row, this.col.field); },       // Raw value for this cell
      editable: function() { return this.col.type.editable; },
      focusable: function() { return this.col.type.focusable; },
      html: function() {
        if (this.col.opts) { return this.col.display(this.value, this.col.opts); }
        if (this.col.display) { return this.col.display(this.value); }
        return this.value || '';
      },
    },
    mounted: function() {
      this.text = this.$refs.div.textContent;
    },
    watch: {
      contenteditable: async function() { this.focus(); },
      text: function(text) {
        this.choices = this.filterChoices(text);
        this.choice = 0;
      },
      status: async function() {
        await utils.sleep(1000);
        this.status = 'fadestatus';
        await utils.sleep(1000);
        this.status = 'default';
      },
    },
    methods: {
      // Click
      // User clicked on the cell
      click: function(event) {
        if (!this.focused && this.focusable) {
          event.preventDefault();
          this.$emit('action', 'focus', {tabindex:this.tabindex});
        } else if (this.focused && !this.editing && this.editable) {
          event.preventDefault();
          this.$emit('action', 'edit', {tabindex:this.tabindex});
        }
      },

      // Enter
      // User pressed enter on the cell
      enter: async function(event) {
        if (this.focused && !this.editing && this.editable) {
          // Start Editing
          event.preventDefault();
          this.$emit('action', 'edit', this);
        } else if (this.editing) {
          // Save the new value
          event.preventDefault();
          this.save();
        }
      },

      // Esc
      // User pressed the escape on the cell
      esc: function(event) {
        if (this.focused || this.editing) {
          event.preventDefault();
          this.$emit('action', 'cancel');
        }
      },

      // Focus
      // Focus on the input for this cell
      focus: async function() {
        if (this.contenteditable) {
          await this.$nextTick();
          var range = document.createRange();
          range.selectNodeContents(this.$refs.div);
          var selection = window.getSelection();
          if (!this.col.select) { range.collapse(false); }
          selection.removeAllRanges();
          selection.addRange(range);
          this.$el.focus();
        }
      },

      // Navigate
      // Move the focus up, down, left, or right
      navigate: function(event, dir) {
        if (!this.editing) {
          event.preventDefault();
          this.$emit('action', 'navigate', {dir});
        }
      },

      // Prevent Double Click
      // Checkmark cells need this to quickly toggle the value but
      // it often also selects a word of text which is annoying.
      preventDoubleClick: function(event) {
        if (event.detail > 1) { event.preventDefault(); }
      },

      // Save
      // Save a new value to the database
      save: function() {
        var oldvalue = utils.textContent(this.html);
        if (oldvalue != this.text) {
          this.$emit('action', 'save', {
            id: this.row.id,
            field: this.col.field,
            newvalue: this.text,
            callback: (result) => {
              console.log(result);
              this.status = result.status;
              this.$emit('action', 'navigate', {dir:'down'});
            }
          });
        }
      },

      //-----------------------------------
      // Filter Choices
      // Filter available choices based on passed in text
      filterChoices: function(text) {
        if (!this.contenteditable) { return []; }
        if (!this.col.choices) { return []; }
        if (this.text == '') { return []; }
        var lchoices = this.col.choices.map(c => c.name.toLowerCase());
        if (!text || text == '') { return this.col.choices; }
        if (lchoices.indexOf(text.toLowerCase()) >= 0) { return []; }
        var result = fuzzysort.go(text, this.col.choices, {key:'name'});
        return result.map(x => x.obj);
      },

      // Make Choice
      // Called when clicking a choice
      makeChoice: function(event) {
        if (this.choices.length) {
          event.preventDefault();
          event.stopPropagation();
          var newtext;
          if (event.target.classList.contains('choice')) { newtext = trim(event.target.textContent); }
          else { newtext = trim(this.choices[this.choice].name); }
          this.$refs.div.textContent = newtext;
          this.text = newtext;
          this.choices = [];
          this.focus();
        }
      },

      // Move Choice
      // Adjust highlighted choice by offset (for next / prev selection).
      moveChoice: function(offset) {
        var newchoice = this.choice + offset;
        newchoice = Math.max(newchoice, 0);
        newchoice = Math.min(newchoice, this.choices.length - 1);
        this.choice = newchoice;
      },

    },
  };
</script>

<style lang='scss'>
  .tablecell {
    position: relative;

    > div {
      background-color: transparent;
      border-radius: 3px;
      border: 0px;
      border: 1px solid transparent;
      box-sizing: border-box;
      font-size: 0.9em;
      line-height: 20px;
      margin: 1px 0px;
      padding: 2px 5px;
      width: 100%;
      height: 26px;
      transition: none;
      white-space: nowrap;  // overflow editing
      overflow: hidden;  // overflow editing
      max-width: 300px;  // overflow editing
      br { display:none; }
      * { display:inline; white-space:nowrap; }
    }
    
    // Focused & Editing
    &.fadestatus div { transition: all 2s ease !important; }
    &:focus {  // .focused {
      div {
        background-color: darken($lightbg-bg1, 3%);
        border: 1px solid darken($lightbg-bg2, 8%);
        box-shadow:
          0 0 0 2px lighten($lightbg-bg1, 2%),
          inset 0 0 0px 1px lighten($lightbg-bg1, 1%);
        position: absolute;  // overflow editing
        max-width: fit-content;  // overflow editing
      }
      &.editing div {
        border: 1px solid $lightbg-blue1;
        color: darken($lightbg-blue0, 50%);
        box-shadow: 0 0 0 2px rgba(7, 102, 120, 0.25);
      }
    }
    &:focus {
      border: 1px solid black;
    }

    // Success & Error
    &.success div {
      background-color: desaturate(lighten($darkbg-green1, 40%), 30%);
      border: 1px solid $darkbg-green1;
      box-shadow:
        0 0 0 2px lighten($lightbg-bg1, 2%),
        inset 0 0 0px 1px lighten($lightbg-bg1, 1%);
    }
    &.error div {
      background-color: desaturate(lighten($darkbg-red0, 40%), 30%);
      border-color: darken($darkbg-red0, 5%);
      box-shadow:
        0 0 0 2px lighten($lightbg-bg1, 2%),
        inset 0 0 0px 1px lighten($lightbg-bg1, 1%);
    }

    // Choices
    ul.choices {
      background-color: $lightbg-bg1;
      border-radius: 5px;
      box-shadow: 0 1px 3px 0 rgba(60,64,67,0.302), 0 4px 8px 3px rgba(60,64,67,0.149);
      color: lighten($lightbg-fg2, 20%);
      font-size: 13px;
      left: 0px;
      overflow: hidden;
      padding: 3px 0px;
      position: absolute;
      top: 29px;
      width: calc(100% - 10px);
      z-index: 20;
      li.choice {
        line-height: 22px;
        list-style-type: none;
        margin: 0px;
        padding: 0px 5px;
        &.highlighted { color: #000; }
      }
    }
  }
</style>
