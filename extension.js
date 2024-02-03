const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Clutter = imports.gi.Clutter;



let panelButton, panelButtonText, data, popup;
let timefile = Gio.File.new_for_path(Me.path + "/data.json");

const Mypopup = GObject.registerClass(
  class Mypopup extends PanelMenu.Button {


    _init() {
      data == null;
      super._init(0.5);


      panelButtonText = new St.Label({
        text: "Screentime",
        y_align: Clutter.ActorAlign.CENTER
      });

      this.add_child(panelButtonText);


    }
  }
);

function init() {
  timefile.load_contents_async(null, (file, res) => {
    let [, content] = timefile.load_contents_finish(res);
    
    data = JSON.parse(content.toString());
    changenumber();
    })
}


function enable() {
  popup = new Mypopup();
  Main.panel.addToStatusArea('popup', popup, 0)


}

function disable() {
  popup.destroy();

}




function changenumber() {


  let currentDate = new GLib.DateTime();
  let formattedDate = currentDate.format("%Y-%m-%d");

  if (!data[formattedDate]) {
    data[formattedDate] = {
      time: 0,
      application: {}
    }
    if (data.length > 2){
      const firstKey = Object.keys(data)[0];    
      delete data[firstKey];
    }
  }
  
  data[formattedDate].time = data[formattedDate].time + 1;

  let hours = Math.floor(data[formattedDate].time/3600);
  let minutes = Math.floor(data[formattedDate].time%3600/60);
  let seconds = Math.floor(data[formattedDate].time%60);

  const [, output, ] = GLib.spawn_command_line_sync("xdotool getwindowfocus getwindowname", null);

  commandOutput = output.toString("UTF-8").trim();
  let formatedoutput = commandOutput.split(/[-—]/).map(item => item.trim());
  
  finaloutput =  formatedoutput[formatedoutput.length - 1];
  
  if (finaloutput == ""){
    finaloutput = "Unknown";
  };

  if(!data[formattedDate].application[finaloutput]){
    data[formattedDate].application[finaloutput] = [finaloutput, 0];
  } else {
    data[formattedDate].application[finaloutput][1] = data[formattedDate].application[finaloutput][1] + 1;
  };

  popup.menu.removeAll();
  
  let list = []
  for (let app in data[formattedDate].application){
    list.push([data[formattedDate].application[app][0], data[formattedDate].application[app][1]]);
  };

  list.sort((a, b) => b[1] - a[1]);

  let sublist = list.slice(0, 5);
  let item = new PopupMenu.PopupMenuItem(`Total time: ${hours}h ${minutes}m ${seconds}s`, {reactive: false});
  popup.menu.addMenuItem(item);

  let spacebetween = new PopupMenu.PopupMenuItem(`--------------------`, {reactive: false});
  popup.menu.addMenuItem(spacebetween);

  for (let top of sublist){
    let hours = Math.floor(top[1]/3600);
    let minutes = Math.floor(top[1]%3600/60);
    let seconds = Math.floor(top[1]%60);
  
    let item = new PopupMenu.PopupMenuItem(`${top[0]}: ${hours}h ${minutes}m ${seconds}s`, {reactive: false});
    popup.menu.addMenuItem(item);
    
  };

  let content = JSON.stringify(data, null, 2);
  timefile.replace_contents(content, null, false, Gio.FileCreateFlags.NONE, null);

  setTimeout(changenumber, 1000);
}

