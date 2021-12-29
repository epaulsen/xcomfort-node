import { XComfortBridgeClient } from "./lib/bridgeclient";

var client = new XComfortBridgeClient("192.168.1.166","DZXBSBFV2VRP");

var devices: Array<any>;

devices = new Array<any>();

client.connect();
client.on('message', function(messageType:number,payload:any) {
    //console.log("Got messageType %s with payload %s",messageType,JSON.stringify(payload));
    switch(messageType)
    {
        case 300:
            if(payload["devices"]) {
                console.log("Devices:")
                console.log(JSON.stringify(payload));
                for(let i=0;i<payload["devices"].length;i++) {
                    devices[payload["devices"][i].deviceId] = payload["devices"][i];
                    console.log("deviceId: " + payload["devices"][i].deviceId + ", name: " + payload["devices"][i].name + ", devType: " + payload["devices"][i].devType);
                } 
            }
            if(payload["rooms"]) {
                console.log("Rooms:");
                for(let i=0;i<payload["rooms"].length;i++) {
                    console.log("roomId: " + payload["rooms"][i].roomId + ", name: " + payload["rooms"][i].name);
                } 
            } 

            if(payload["scenes"]) {
                console.log("Scenes:");
                for(let i=0;i<payload["scenes"].length;i++) {
                    console.log("sceneId: " + payload["scenes"][i].sceneId + ", name: " + payload["scenes"][i].name);
                } 
            } 

            else {
                console.log("Type 300: %s",JSON.stringify(payload));
            }

            break;
        case 310:
            //console.log("Type 310: %s",JSON.stringify(payload));
            if(payload["item"].deviceId)
            {
                var deviceName = devices[payload["item"].deviceId].name;
                console.log("Device: " + deviceName + " Temperature: " + payload["item"].temp + " Power: " + payload["item"].power + "W");
            } else {
                console.log("Type 310: %s",JSON.stringify(payload));
            }
            // if(payload["item"])  {                
            //     for(let i=0;i<payload["item"].length;i++)
            //     {
            //         if(payload["item"][i].deviceId) {
            //             console.log("deviceId: " + payload["item"][i].deviceId + ", name: " + payload["devices"][i].name + ", devType: " + payload["devices"][i].devType);
            //         }
                    
            //     } 
            // }
            break;
    }
});

client.on('closed', function ()  {
    console.log("connection closed by server");
    
});

