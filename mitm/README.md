

## Man in the middle application

This is a simple node.js application that acts as a proxy between a device and an actual bridge.  
Will intercept and print out messages sent between device and bridge.
There is also a Dockerfile present, to make it easy to run in an environment where node is not present.

*Usage:*

```sh
cd mitm/
docker build -t mitm .
docker run -e <ip-to-actual-bridge> -p 80:8080 -d mitm
```
connect your device to the ip that runs the docker container and trigger what you want to log messages for.
When you are done, logs can be retreived like this:

```sh
docker logs mitm > logs.txt
docker stop mitm
```

`logs.txt` will now contain all the traffic between the client and the bridge, for both messages sent from Server and from Client





