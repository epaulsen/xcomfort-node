import { EventEmitter } from "events";
import { BridgeCrypto } from "./bridgecrypto";
import * as WebSocket from 'ws';
import randomBytes from "randombytes";

export class XComfortBridgeClient extends EventEmitter {

    private requestBase:string;    
    private authKey:string;

    private crypto: BridgeCrypto;
    private ws!:WebSocket.WebSocket;
    private MC: number =0;

    constructor(ipOrHostName:string,authKey:string) {
		super();
        this.requestBase =  `ws://${ipOrHostName}:80/`;		
        this.authKey = authKey;        
        this.crypto = new BridgeCrypto();
    }

    public async connect()
    {
        var deviceId:string;
        var connectionId:string;
        var token:string;

        this.ws = new WebSocket.WebSocket(this.requestBase);
        this.ws.on('close',(code:Number,reason:Buffer) => {
            this.emit('closed', code, reason);
        });
        this.ws.on('message', (message: Buffer) => {                               
            if(message[0] != 123) {
                message = this.crypto.decrypt(message);
            }           
            let idx = message.byteLength-1;
            while(idx >= 0 && message[idx] != 125) {
                idx--;
            }

            let msg = JSON.parse(message.slice(0,idx+1).toString('utf8'));               
            
            if(msg["type_int"]==10) {
                deviceId = msg["payload"]["device_id"];
                connectionId = msg['payload']['connection_id']
                let clientId = randomBytes(8).toString("hex");
                this.ws.send(JSON.stringify({
                    "type_int":11,
                    "mc":-1,
                    "payload":{
                        "client_type":"shl-app",
                        //"client_id":"c956e43f999f8005",
                        "client_id":clientId,
                        "client_version":"2.0.0",
                        "connection_id":connectionId
                        }
                    }));
                return;         
            }

            if(msg["type_int"]==12) {
                this.ws.send(JSON.stringify({"type_int":14,"mc":-1}));
                return;
            }        

            if(msg["type_int"]==15) {
                var pubKey = msg["payload"]["public_key"];
                        
                var secret = this.crypto.rsaEncrypt(pubKey);                
                this.ws.send(JSON.stringify({"type_int":16,"mc":-1,"payload":{"secret": secret}}));      
                return;
            }
            
            if(msg["type_int"]==17) {
                var salt = randomBytes(6).toString('hex');
                var password = this.crypto.hash(deviceId,this.authKey,salt);
                
                this.send_message(30,{
                    "username":"default",
                    "password":password,
                    "salt": salt});
                return;
            }

            if(msg["type_int"]==32) {
                token = msg["payload"]["token"];                      
                this.send_message(33, {"token":token});      
                return;
            }

            if(msg["type_int"]==34) {
                this.send_message(37,{"token":token});                            
                return;
            }

            if(msg["type_int"]==38) {                  
                this.send_message(240,{});                                
                this.send_message(242,{});
                this.send_message(2,{});
                return;
            }                        

            if(msg["mc"])
            {
               this.send(JSON.stringify({"type_int":1,"ref":msg["mc"]}));
            }

            this.emit('message',msg["type_int"],msg["payload"]);
         });
    }

    public async send_message(messageType:number,payload:object)
    {         
        this.MC++; 
        var json = JSON.stringify({"type_int":messageType,"mc":this.MC,"payload":payload});
       
        await this.send(json);
    }

    private async send(payload:string)
    {       
       var encrypted = this.crypto.encrypt(payload);
       await this.ws.send(encrypted);   
    }
}