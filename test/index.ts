//import { RCTouch } from "../lib/devices";
import { XLight } from "../lib/devices";
import { Hub } from "../lib/hub";

var hub = new Hub("YOUR_BRIDGE_IP_HERE","AUTH_KEY_HERE");

hub.start();

// To change RC touch mode, uncomment this:
// setTimeout(()=> {
//     var rc =hub.devices.get(53) as RCTouch;        
//     rc.log();
//     rc.setmode(3); //Comfort=3,  Eco=2, FrostGuard=1
//     rc.log();
    
// },10000);

// List all devices
setTimeout(()=> {
    console.log("Devices:");
    hub.devices.forEach((dev) => {        
        dev.log();        
    });
    },
    5000);

// Turn on a specific light:
// setTimeout(()=> {        
//     var light =hub.devices.get(11) as XLight;
//     light.switchLight(true);                         
//     },
//     10000);    

// Just to keep nodejs from exiting;
hub.on('stop',reason => {
    console.log("Hub stopped, reason was " + reason);
});
