<template>
  <div id='notesmenubar'>
    <transition name='custom-classes-transition'
        enter-active-class='animated fadeIn'
        leave-active-class='animated fadeOut'>
      <editor-menu-bar :editor='editor' v-slot='{commands, getMarkAttrs, isActive}' v-if='editing'>
        <div class='menubar'>
          <!-- Format Menu Dropdown -->
          <b-dropdown>
            <button class='button is-text is-small texttype' slot='trigger' slot-scope='{active}'>
              <span>{{currentFormat(isActive)}}</span>
              <b-icon :icon="active ? 'menu-up' : 'menu-down'"></b-icon>
            </button>
            <b-dropdown-item :class='{"active":isActive.paragraph()}' @click='commands.paragraph'>Paragraph</b-dropdown-item>
            <b-dropdown-item :class='{"active":isActive.heading({level:1})}' @click='commands.heading({level:1})'>Heading 1</b-dropdown-item>
            <b-dropdown-item :class='{"active":isActive.heading({level:2})}' @click='commands.heading({level:2})'>Heading 2</b-dropdown-item>
            <b-dropdown-item :class='{"active":isActive.heading({level:3})}' @click='commands.heading({level:3})'>Heading 3</b-dropdown-item>
            <b-dropdown-item :class='{"active":isActive.code_block()}' @click='commands.code_block'>Code Block</b-dropdown-item>
          </b-dropdown>
          <!-- Regular Header Buttons -->
          <div class='sep'/>
          <b-button type='is-text is-small' :class='{"active":isActive.bold()}' @click='commands.bold'><b-icon size='is-small' icon='format-bold'/></b-button>
          <b-button type='is-text is-small' :class='{"active":isActive.italic()}' @click='commands.italic'><b-icon size='is-small' icon='format-italic'/></b-button>
          <b-button type='is-text is-small' :class='{"active":isActive.underline()}' @click='commands.underline'><b-icon size='is-small' icon='format-underline'/></b-button>
          <div class='sep'/>
          <b-button type='is-text is-small' :class='{"active":isActive.bullet_list()}' @click='commands.bullet_list'><b-icon size='is-small' icon='format-list-bulleted'/></b-button>
          <b-button type='is-text is-small' :class='{"active":isActive.ordered_list()}' @click='commands.ordered_list'><b-icon size='is-small' icon='format-list-numbered'/></b-button>
          <b-button type='is-text is-small' :class='{"active":isActive.todo_list()}' @click="commands.todo_list"><b-icon size='is-small' icon='format-list-checkbox'/></b-button>
          <div class='sep'/>
          <b-button type='is-text is-small' :class='{"active":isActive.link()}' @click='toggleLinkMenu(getMarkAttrs("link"))'><b-icon size='is-small' icon='link'/></b-button>
          <b-button type='is-text is-small' :class='{"active":isActive.blockquote()}' @click='commands.blockquote'><b-icon size='is-small' icon='format-quote-close'/></b-button>
          <b-button type='is-text is-small' :class='{"active":isActive.code()}' @click='commands.code'><b-icon size='is-small' icon='code-tags'/></b-button>
          <b-button type='is-text is-small' @click.prevent='save' style='float:right;'><span>Save</span></b-button>
          <!-- Link Form -->
          <div v-if='showLinkMenu' class='expandform'>
            <input type='text' name='url' class='input' v-model='linkUrl' ref='linkInput' placeholder='https://' spellcheck='false' autocomplete='off'
              @keydown.enter.prevent='setLinkUrl(commands.link, linkUrl)'
              @keydown.esc.stop='hideLinkMenu'
              @click='$refs.linkInput.focus()'/>
            <b-button type='is-text is-small' @click='setLinkUrl(commands.link, "")'>❌</b-button>
          </div>
        </div>
      </editor-menu-bar>
    </transition>
  </div>
</template>

<script>
  import * as api from '@/api';
  import * as pathify from 'vuex-pathify';
  import {EditorMenuBar} from 'tiptap';

  // TipTap Extensions
  import {Blockquote, BulletList, CodeBlockHighlight, HardBreak, Heading,
    Link, ListItem, OrderedList, Bold, Code, Italic, Strike, TodoItem,
    TodoList, Underline, History} from 'tiptap-extensions';
  import bash from 'highlight.js/lib/languages/bash';
  import css from 'highlight.js/lib/languages/css';
  import javascript from 'highlight.js/lib/languages/javascript';
  import python from 'highlight.js/lib/languages/python';
  import sql from 'highlight.js/lib/languages/sql';
  import xml from 'highlight.js/lib/languages/xml';
  var LANGUAGES = {bash,css,javascript,python,sql,xml};

  export default {
    name: 'NotesEditMenu',
    components: {EditorMenuBar},
    computed: {
      editing: pathify.sync('notes/editing'),
      editor: pathify.sync('notes/editor'),
      note: pathify.sync('notes/note'),
      userid: pathify.get('global/user@id'),
    },
    data: () => ({
      linkUrl: null,        // Current URL text when editing links
      showLinkMenu: false,  // True when displaying link input
    }),

    watch: {
      // Watch Editing
      // When edit mode changes, make sure TipTap is informed.
      editing: function() {
        let editable = this.editing && (this.userid !== null);
        this.editor.setOptions({editable});
      },

      // Watch UserID
      // If userid ever changes, make sure we stop editing.
      userid: function() {
        this.editing = false;
      }
    },

    methods: {
      // Extensions
      // Returns list of enabled tiptap extensions
      extensions: function() {
        return [
          new Blockquote(),
          new Bold(),
          new BulletList(),
          new Code(),
          new CodeBlockHighlight({languages:LANGUAGES}),
          new HardBreak(),
          new Heading({levels:[1,2,3]}),
          new History(),
          new Italic(),
          new Link({openOnClick:false}),
          new ListItem(),
          new OrderedList(),
          new Strike(),
          new TodoItem({nested: true}),
          new TodoList(),
          new Underline(),
        ];
      },

      // CurrentFormat
      // Return the currently selected text format
      currentFormat: function(isActive) {
        if (isActive.paragraph()) { return 'Paragraph'; }
        if (isActive.heading({level:1})) { return 'Heading 1'; }
        if (isActive.heading({level:2})) { return 'Heading 2'; }
        if (isActive.heading({level:3})) { return 'Heading 3'; }
        if (isActive.code_block()) { return 'Code Block'; }
        else { return 'Format'; }
      },

      // Save
      // Save the current Title and Content to the server
      save: async function(event) {
        if (this.editing) {
          event.preventDefault();
          try {
            await api.Notes.saveNote(this.note.id, {
              title: this.note.title,
              tags: this.note.tags,
              body: this.editor.getHTML()
            });
            this.editing = false;
            this.$root.$emit('notify', 'Note saved!', 'mdi-check');
          } catch(err) {
            this.$root.$emit('notify', 'Error saving note.', 'mdi-alert-circle-outline');
          }
        }
      },

      // StartEditing
      // Enable editing mode for this note
      startEditing: function(event) {
        let loggedin = this.userid !== null;
        let isinput = event && event.srcElement.tagName == 'INPUT';
        if (loggedin && !this.editing && !isinput) {
          if (event) event.preventDefault();
          this.editing = true;
        }
      },

      // StopEditing
      // Disable editing mode for this note
      stopEditing: function(event) {
        if (this.editing) {
          if (event) event.preventDefault();
          this.editing = false;
        }
      },

      // ToggleLinkMenu
      // Show or hide the link menu input
      // see: https://tiptap.scrumpy.io/links
      toggleLinkMenu: function(attrs) {
        if (this.showLinkMenu) {
          this.hideLinkMenu();
        } else {
          this.linkUrl = attrs.href;
          this.showLinkMenu = true;
          this.$nextTick(function() {
            this.$refs.linkInput.focus();
          });
        }
      },

      // HideLinkMenu
      // Hide the link menu without changing anything
      hideLinkMenu: function() {
        this.linkUrl = null;
        this.showLinkMenu = false;
      },

      // SetLinkURL
      // Set the link URL then hide the link menu
      setLinkUrl: function(command, url) {
        command({href: url});
        this.hideLinkMenu();
      },
    },

    // BeforeDestory: Cleanup the editor
    beforeDestroy: function() {
      this.editor.destroy();
    },

  };
</script>

<style lang='scss'>
  #notesmenubar .menubar {
    animation-duration: .3s;
    background-color: $darkbg-color;
    border-radius: 8px;
    box-shadow: 0 2px 3px rgba(0, 0, 0, .3);
    color: $darkbg-text;
    padding: 5px 10px;
    position: fixed;
    top: 70px;
    width: 900px;
    margin-left: -51px;
    z-index: 50;
    line-height: 1.6em;
    :focus { box-shadow: none; }
    .sep {
      margin: 0px 10px 0px 5px;
      display: inline;
      border-left: 1px solid #665c54;
    }
    .button {
      background-color: transparent;
      color: $darkbg-text;
      text-decoration: none;
      margin-right: 5px;
      &:hover { background-color: lighten($darkbg-color, 8%); }
      &.active { background-color: lighten($darkbg-color, 16%); }
      &.is-text {
        font-size: 0.9em;
        padding-top: 2px;
        padding-bottom: 2px;
        height: 25px;
      }
      &.texttype { width: 120px; }
      .mdi { font-size: 20px; }
    }
    .expandform {
      margin-top: 5px;
      .input {
        background-color: #444;
        border-width: 0px;
        color: $darkbg-input;
        font-size: 12px;
        height: 25px;
        font-weight: 500;
        width: calc(100% - 100px);
        float: left;
      }
      .button {
        margin-left: 5px;
      }
    }
    
  }
</style>
