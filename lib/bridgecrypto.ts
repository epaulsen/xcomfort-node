import * as crypto from "crypto";
import randomBytes from "randombytes";

export class BridgeCrypto
{
    private key:Buffer;
    private iv:Buffer;

    constructor()
    {        
        this.key = randomBytes(32);
        this.iv = randomBytes(16);
    }

    public rsaEncrypt(publicKey:string) : string {
        const keyIv = this.key.toString('hex') + ":::" + this.iv.toString('hex');        
        const buffer = Buffer.from(keyIv);
        return (crypto.publicEncrypt( { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING } , buffer)).toString('base64');
    }

    public decrypt(encrypted:Buffer) : Buffer {
        
        let decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);        
        var buffer = Buffer.from(encrypted.toString(),'base64');                    
        decipher.setAutoPadding(false);
        let decrypted = decipher.update(buffer).toString("utf8");
        
        decrypted += decipher.final('utf8');

        //console.log("Decrypted: %s",decrypted);                
        return Buffer.from(decrypted);
    }

    public encrypt(plaintext:string):string {
        let cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
        cipher.setAutoPadding(false);

        var buffer = Buffer.from(plaintext);
        var padLength = 16 - buffer.length % 16; // AES block size=16   
        
        var padBuffer = Buffer.alloc(padLength);
        
        let encrypted = cipher.update(Buffer.concat([buffer,padBuffer]));        
        encrypted = Buffer.concat([encrypted, cipher.final()]);
                
        return encrypted.toString('base64') + '\u0004';
    }

    public hash(deviceId:string, authKey:string, salt:string) : string
    {
        var hasher = crypto.createHash('sha256');
        hasher.update(deviceId);
        hasher.update(authKey);
        var inner = hasher.digest('hex');
        hasher = crypto.createHash('sha256');
        hasher.update(salt);
        hasher.update(inner);
        return hasher.digest('hex');
    }
}