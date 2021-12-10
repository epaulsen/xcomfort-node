import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import bridgeCrypto  from './bridge.js';

const bc = bridgeCrypto();


// const signature = bc.createSignature("0x0000AD");
// console.log("signature: %s",signature);


const wss = new WebSocketServer({ port: 8080 });



wss.on('connection', function connection(wsclient) {
    
    var deviceId;
    var publicKey;

    console.log('Client connected');
    var wsserver = new WebSocket('ws://192.168.1.166');
    
    wsclient.on('message', function message(data) {
    
        var dataString = data.toString();
        if(dataString.charAt(0) === '{')
        {
            console.log('client: %s', dataString);
            while(dataString.charAt(dataString.length-1)!='}')
            {
                dataString = dataString.substring(0,dataString.length-1);
            }
            
            var msg = JSON.parse(dataString);
            if(msg["type_int"] == 16)
            {
                bc.rsaDecrypt(msg["payload"]["secret"]);
                console.log("Re-encrypting with publickey: %s",publicKey);
                msg["payload"]["secret"] = bc.rsaEncrypt(publicKey);
                data = Buffer.from(JSON.stringify(msg));
                //console.log("corrected message: %s",JSON.stringify(msg));
            }
            data = Buffer.from(JSON.stringify(msg));        
            
        } 
        
        //console.log('client: %s', bc.getcontent(data));                    
        wsserver.send(data);
        
    });

  wsserver.on('message', function message(data) {
    var dataString = data.toString();
    if(dataString.charAt(0) === '{')
    {
        //console.log("server: %s",dataString);
        while(dataString.charAt(dataString.length-1)!='}')
        {
            dataString = dataString.substring(0,dataString.length-1);
        }
        
        var msg = JSON.parse(dataString);
        if(msg["type_int"] == 10)
        {
            deviceId = msg["payload"]["device_id"];
        }

        if(msg["type_int"] == 15)
        {
            publicKey = msg["payload"]["public_key"];
            console.log("Using publickey %s \nwhen communicating with server",publicKey);
            msg["payload"]["public_key"] = bc.publicKey;
            msg["payload"]["device_signature"] = bc.createSignature(deviceId);
            //console.log("corrected message: %s",JSON.stringify(msg)); // Remove this afterwards.
        }

        data = Buffer.from(JSON.stringify(msg));        
    }  
    console.log("server: %s", bc.getcontent(data));
    wsclient.send(data);      
  });  
});


console.log("Started, listening on port 8080");