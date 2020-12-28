# bme680-signalk-ws
Send bme680-sensor data to a SignalK server from an edge device using a Web Socket connection.

## Prerequisites
- Requires a bme680-sensor
- (optional) Setup a new user different from your admin user in SignalK

## Use
Create a new  `.env`-file ([npm dotenv](https://www.npmjs.com/package/dotenv)) in the project root folder to store your personal configuration.

Add the following,  replace IP, USERNAME, PASSWORD and the MMSI number for your vessel.
```
SIGNALK_URL=ws://IP:3000/signalk/v1/stream?subscribe=none
SIGNALK_USERNAME=USERNAME
SIGNALK_PASSWORD=PASSWORD
MMSI=123456789
```

Now everything should be setup.

Run the script as normal `node index.js`, or with logging output to console: `node index.js log`

If you use a SSH connection, like Putty, run the script as following, to allow it run in the background:

`nohup node index.js &`

`exit` (close terminal window)

## Contribute
Feel free to contribute by creating a *Pull Request*