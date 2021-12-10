
import crypto  from "crypto";
import fs from 'fs';
import KJUR from 'jsrsasign';

class bc {
    constructor() {
        this.privateKey = fs.readFileSync('./private.pem','utf8');
        this.publicKey = fs.readFileSync('./public.pem','utf8');
    }

    rsaEncrypt(publicKey) {        
        const keyIv = this.key.toString('hex') + ":::" + this.iv.toString('hex');
        //console.log("KeyIv: %s",keyIv);
        const buffer = Buffer.from(keyIv);
        return (crypto.publicEncrypt( { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING } , buffer)).toString('base64');
    }

    rsaDecrypt(encrypted)
    {
        const buffer = Buffer.from(encrypted, 'base64');
        var pk = Buffer.from(this.privateKey);        
        var decrypted = (crypto.privateDecrypt({key: pk, padding: crypto.constants.RSA_PKCS1_PADDING } , buffer)).toString('utf8');
        //console.log("Decrypted secret: %s",decrypted);
        var split = decrypted.split(':::');                
        this.key = Buffer.from(split[0], 'hex');
        this.iv = Buffer.from(split[1], 'hex');
        //console.log("keylength:%s", this.key.byteLength);
        //console.log("ivlength:%s", this.iv.byteLength);       
    }

    createSignature(deviceId) {
        var signature = deviceId + ":::" + this.publicKey.replace("\n","");
        // const sign = crypto.sign("SHA256", signature , this.privateKey);
        var o = new KJUR.crypto.Signature({'alg':"SHA256withRSA"});
        o.init(this.privateKey);
        o.updateString(signature);
        return o.sign();        
    }

    decrypt(encrypted) {
        let decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
        
        var buffer = Buffer.from(encrypted, 'base64');
        decipher.setAutoPadding(false);
        let decrypted = decipher.update(buffer, 'base64', 'utf8');
        //console.log("decrypted: %s",decrypted);   
        decrypted += decipher.final('utf8');

        //console.log("Decrypted: %s",decrypted);
        return decrypted;
    }

    sanitize(data)
    {
        for(let i=data.byteLength;i>=0;i--)
        {
            if(data[i] == 125)
            {
                let r = class {
                    constructor(buf,pad) {
                        this.padding = pad;
                        this.Message = JSON.parse(buf.toString('utf8'));
    
                        this.unSanitize = function() {                        
                            return Buffer.concat([Buffer.from(JSON.stringify(this.Message)),this.padding]);
                        }
                    }                
                }
                return new r(data.slice(0,i+1),data.slice(i+1));
            }
        }
        return null;
    }


    getcontent(data)
    {
        data = data.toString();
        if(data.charAt(0) === '{')
        {
            return data;
        }
        var decrypted =  this.decrypt(data);
        if(decrypted.toString().charAt(0) == '{')
        {
            return decrypted;
        }
        return "(Unable to decrypt)";
    }

}

export default function () { return new bc() }        
