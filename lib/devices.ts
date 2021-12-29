import { XComfortBridgeClient } from "./bridgeclient";

export interface XDevice
{
    deviceId : number;
    name : string;
    type : string;
    update(payload:any):any;
    log() : any;
}

export class XLight implements XDevice {
    
    deviceId : number;
    type : string = "XLight";
    name : string;
    dimmable : boolean;
    dimvalue : number;
    switch : boolean;
    client : XComfortBridgeClient;

    constructor(client:XComfortBridgeClient,deviceId:number, payload:any) {
        this.client = client;
        this.deviceId = deviceId;
        this.name = payload["name"];								
        this.dimmable = payload["dimmable"];
        this.dimvalue = payload["dimmvalue"];
        this.switch = payload["switch"];
    }    

    update(payload:any) {
        this.dimvalue = payload["dimmvalue"];
        this.switch = payload["switch"];        
    }

    switchLight(state:boolean)
    {
        this.client.send_message(281, {
            deviceId:this.deviceId,
            switch: state
        });
    }

    dimLight(value:number)
    {
        if(value<0 || value > 100)
        {
            throw "Invalid value";
        }

        this.client.send_message(281, {
            deviceId:this.deviceId,
            dimmvalue: value
        });

    }

    log() : any {
        console.log("ID:" + this.deviceId +" name=" + this.name + ", dimvalue=" + this.dimvalue + ", switch="+this.switch);
    }
}

export class RoomHeatMapping {
    rooms : Map<number,RoomHeating> = new Map<number,RoomHeating>();

    add(roomId:number,payload:any)
    {
        this.rooms.set(roomId, new RoomHeating(roomId,payload));
    }

    getRoomBySensor(sensorId:number):RoomHeating {
        
        let val : RoomHeating = new RoomHeating(-1,{roomSensorId:-1,currentMode:-1,state:-1});
        
        this.rooms.forEach((rh) => {
            if(rh.sensorId == sensorId) {
                val = rh;                
            }            
        });
        
        return val;
    }

}

export class RoomHeating {
    sensorId : number;
    roomId : number;
    currentMode:number;
    state:number;
    setpoint:number;

    constructor(roomId:number,payload:any) {
        this.roomId = roomId;
        this.sensorId = payload["roomSensorId"];
        this.currentMode = payload["currentMode"];
        this.state = payload["state"];
        this.setpoint = payload["setpoint"];
    }
    
}


export class RCTouch implements XDevice {
    
    deviceId : number;
    name : string;
    type : string = "RC Touch";
    temperature! : number;
    humidity! : number;
    power! : number;
    private map:RoomHeatMapping;
    private client:XComfortBridgeClient;

    constructor(client:XComfortBridgeClient,map:RoomHeatMapping,deviceId:number, payload:any) {
        this.client = client;
        this.deviceId = deviceId;        
        this.name = payload["name"];
        this.map = map;
        if(payload["info"])
        {
            try {                              
                for(let i=0;i<payload.info.length;i++) {
                    if(payload.info[i].text == "1222") { // temperature
                        this.temperature = parseFloat(payload.info[i].value);
                    }

                    if(payload.info[i].text == "1223") { // temperature
                        this.humidity = parseFloat(payload.info[i].value);
                    }
                }
            } catch (error) {
                console.log("Error parsing " + JSON.stringify(payload));
            }         
        } 
        else {
            this.temperature = 0;
            this.humidity = 0;
        }
        
        this.power = 0;
    }

    update(payload:any) {        
        for(let i=0;i<payload.item.length;i++) {
            try {
                if(payload.item[i].roomId)
                {
                    if(payload.item[i].temp) {
                        this.temperature = payload.item[i].temp;
                    }
                    if(payload.item[i].humidity) {
                        this.humidity = payload.item[i].humidity;
                    }                
                    this.power = payload.item[i].power;
                    if(this.map.rooms.has(payload.item[i].roomId))
                    {
                        let room = this.map.rooms.get(payload.item[i].roomId);
                        room!.currentMode = payload.item[i].mode;
                        room!.setpoint = payload.item[i].setpoint;
                    }                
                }
                
                if(payload.item[i].deviceId && payload.item[i].curstate != 0)
                {
                    this.temperature = parseFloat(payload.item[i].info[0].value);
                    this.humidity = parseFloat(payload.item[i].info[1].value);
                }
            } catch(error) {
                console.log("Error parsing " + JSON.stringify(payload));
            }
            this.log();
        }

    }

    log() : any {
        let message = "ID:" + this.deviceId + " name=" + this.name + ", Temperature=" + this.temperature + "C, humidity=" + this.humidity +"%, power=" + this.power+"W";
        
        var rh = this.map.getRoomBySensor(this.deviceId);
        if(rh.roomId != -1)
        {
            message += ", state=" + rh.state + ", mode=" + rh.currentMode + ", setpoint="+rh.setpoint;
        }

        console.log(message);
    }

    setmode(mode:number)
    {
        if(mode < 1 || mode > 3)
        {
            console.log("Illegal mode!");
            return;
        }

        var rh = this.map.getRoomBySensor(this.deviceId);

        if(rh.currentMode == -1)
        {
            console.log("Cannot set mode as I don't know current state yet.");
            return;
        }
        this.client.send_message(353,{
            "roomId" :rh.roomId,
            "mode" :mode,
            "state" : rh.state,
            "confirmed": false});

        rh.currentMode = mode;
    }

    alterSetpoint(newsetpoint:number)
    {
        var rh = this.map.getRoomBySensor(this.deviceId);
        this.client.send_message(353, {
            "roomId" :rh.roomId,
            "mode" :rh.currentMode,
            "state" : rh.state,
            "setpoint" : newsetpoint,
            "confirmed": false
        });
    }
}

