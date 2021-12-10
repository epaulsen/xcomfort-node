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
            
        if(data[0] == 123) // 123 = {
        {
            var s = bc.sanitize(data);            
                                
            if(s.Message["type_int"] == 16)
            {
                // Intercept the secret, and then re-encrypt it with the key we got from the actual bridge
                bc.rsaDecrypt(s.Message["payload"]["secret"]);                
                s.Message["payload"]["secret"] = bc.rsaEncrypt(publicKey);
                data = s.unSanitize();                
            }                        
        } 
        
        console.log('CLIENT: %s', bc.getcontent(data));                    
        wsserver.send(data);
        
    });

  wsserver.on('message', function message(data) {
    
    if(data[0] == 123) { // 123 = {
        
        var s = bc.sanitize(data);  
        if(s.Message["type_int"] == 10)
        {
            deviceId = s.Message["payload"]["device_id"];
        }

        if(s.Message["type_int"] == 15)
        {
            // Intercept the key from the actual bridge and replace it with 
            // our own keypair(private.pem/public.pem files in this folder)
            // Store the actual bridge key so that we can re-encrypt the secret
            // Using the key from the bridge.
            publicKey = s.Message["payload"]["public_key"];            
            s.Message["payload"]["public_key"] = bc.publicKey;
            s.Message["payload"]["device_signature"] = bc.createSignature(deviceId);
            data = s.unSanitize();        
        }        
    }  
    console.log("SERVER: %s", bc.getcontent(data));
    wsclient.send(data);      
  });  
});


console.log("Started, listening on port 8080");