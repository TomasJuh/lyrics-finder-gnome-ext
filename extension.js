const Animation = imports.ui.animation;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Pango = imports.gi.Pango;
const Manager = Me.imports.dbus_manager;
const Lyrics = Me.imports.lyrics_api;

const LyricsPanel = new Lang.Class({
    Name: 'Popup',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function () {
        this.parent({
            hover: false,
            activate: false,
            can_focus: true,
        });
        this.lyrics = '... No lyrics ...';

        this.label = new St.Label({ text: this.lyrics, style: 'padding:5px' });
        this.label.clutter_text.line_wrap = true;
        this.label.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        this.box = new St.BoxLayout({
            vertical: true,
            width: 400,
            style: 'spacing: 5px;'
        });
        this.actor.add(this.box);
        this.box.add(this.label, { x_fill: false, x_align: St.Align.MIDDLE });
    },

    set_lyrics: function (l) {
        this.lyrics = l;
        this.label.text = this.lyrics;
    }
});

const Popup = new Lang.Class({
    Name: 'Popup',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function () {
        this.parent({
            hover: false,
            activate: false,
            can_focus: true,
        });

        this.lyrics_finder = new Lyrics.LyricsFinder();

        this.createUi();

    },

    createUi: function () {
        this.box = new St.BoxLayout({
            vertical: true,
            width: 400,
            style: 'spacing: 5px;'
        });
        this.actor.add(this.box);

        this.search_label = new St.Label({
            text: "Search lyrics",
            style: 'font-weight: bold',
        });

        this.titleEntry = new St.Entry({
            name: "Title",
            hint_text: 'Song Title...',
            track_hover: true,
            can_focus: true
        });

        this.artistEntry = new St.Entry({
            name: "Artist",
            hint_text: 'Artist...',
            track_hover: true,
            can_focus: true
        });

        this.box.add(this.search_label, { x_fill: false, x_align: St.Align.MIDDLE });
        this.box.add_child(this.titleEntry);
        this.box.add_child(this.artistEntry);

        this.search_btn = new St.Button({
            label: 'Search',
            reactive: true,
            style_class: 'system-menu-action'
        });

        this.search_btn.connect('clicked', Lang.bind(this, () => {
            let title = this.titleEntry.text;
            let artist = this.artistEntry.text;

            if (title.trim().length < 3) {
                return;
            }

            if (search_menu) {
                search_menu.destroy();
                search_menu = null;
            }
            this.lyrics_finder.find_lyrics(title, artist,
                Lang.bind(this, (songs) => {
                    search_menu = new PopupMenu.PopupSubMenuMenuItem(`Found: ${songs.length}`);
                    if (songs.length > 0) {
                        songs.forEach((song) => {
                            search_menu.menu.addMenuItem(new Lyrics.LyricsItem(song.name , song.album.blurPicUrl || song.album.picUrl || ''));
                        });
                    }
                    button.add_item(search_menu);

                }));
        }));

        this.box.add(this.search_btn, { x_fill: false, x_align: St.Align.MIDDLE });

        this.manager = new Manager.PlayerManager(Lang.bind(this, (title, artist) => {
            if (!title || !artist) {
                title = artist = '';
            }
            this.titleEntry.text = title;
            this.artistEntry.text = artist;
        }));

    },

    disconnect: function () {
        this.manager.disconnect_all();
    }

});

const Button = new Lang.Class({
    Name: 'Button',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, "LyricsFinder");

        let box = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        let icon = new St.Icon({
            // gicon: Gio.icon_new_for_string(Extension.path + '/radio-symbolic.svg'),
            icon_name: 'gtk-refresh',
            style_class: 'system-status-icon',
        });
        box.add_actor(icon);
        this.actor.add_actor(box);
        this.actor.add_style_class_name('panel-status-button');

        popup = new Popup();
        this.menu.addMenuItem(popup);
        //this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // let channelsMenu = new PopupMenu.PopupSubMenuMenuItem('Channels');
        // this.menu.addMenuItem(channelsMenu);
    },
    add_item: function (item) {
        this.menu.addMenuItem(item);
    }
});


function init() {
}

let button;
let popup;
let search_menu;
let lyrics_panel;

function enable() {
    button = new Button();
    Main.panel.addToStatusArea('lyrics-finder', button);
}

function disable() {
    popup.disconnect();
    popup.destroy();
    button.destroy();
}
