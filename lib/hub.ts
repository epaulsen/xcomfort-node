import { EventEmitter } from "stream";
import { XComfortBridgeClient } from "./bridgeclient";
import { RCTouch, RoomHeatMapping, XDevice, XLight } from "./devices";


export class Hub extends EventEmitter {

    private client:XComfortBridgeClient;
    private map:RoomHeatMapping= new RoomHeatMapping();

    devices:Map<number,XDevice> = new Map<number,XDevice>();

    constructor(ipOrHostName:string,authKey:string) {
        super();
        this.client = new XComfortBridgeClient(ipOrHostName, authKey);        
    }

    public async start()
    {
        let instance = this;
        await this.client.connect();
        this.client.on('message',function(messageType:number, payload:any) {
            switch(messageType) {
                case 300:
                    if(payload["roomHeating"])
                    {
                        for(let i=0;i<payload["roomHeating"].length;i++) { 
                            instance.map.add(payload["roomHeating"][i].roomId, payload["roomHeating"][i]);
                        } 
                    }
                    if(payload["devices"]) {                                        
                        for(let i=0;i<payload["devices"].length;i++) {  
                            if(payload["devices"][i].devType == 100 || payload["devices"][i].devType == 101) {  // Lights
                                let device = new XLight(instance.client, payload["devices"][i].deviceId, payload["devices"][i]);
                                instance.devices.set(device.deviceId, device);
                            }
    
                            if(payload["devices"][i].devType == 450) { // RC touch
                                let device = new RCTouch(instance.client,instance.map, payload["devices"][i].deviceId, payload["devices"][i]);
                                instance.devices.set(device.deviceId, device);
                            }                     
                        } 
                    }                   
                    break;
    
                case 310:                      
                    //console.log("310: %s", JSON.stringify(payload));                             
                    for(let i=0;i<payload.item.length;i++) {
                        if(payload.item[i].deviceId) {                
                            let deviceId=payload.item[i].deviceId;
                            
                            if(instance.devices.has(deviceId)) {                    
                                let device = instance.devices.get(deviceId);
                                device?.update(payload);
                            }             
                        }
                    }                                                 
                    break;
    
                default:    
                    if(messageType != 2 && messageType != 1 && messageType != 310) // Heartbeat, ignore
                    {
                        console.log("%d: %s",messageType,JSON.stringify(payload))            
                    }
                }
        });
    }    
}

