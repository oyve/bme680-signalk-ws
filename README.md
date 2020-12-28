# bme680-signalk-ws
Send bme680 data to SignalK server from edge device

## Prerequisites
- Requires a bme680-sensor
- Optional: Setup a new user different from your admin user in SignalK

## Use
Create a new file `.env`-file in the project root folder to store your personal configuration.

Add the following,  replace IP, USERNAME, PASSWORD and MMSI number
```
SIGNALK_URL=ws://IP:3000/signalk/v1/stream?subscribe=none
SIGNALK_USERNAME=USERNAME
SIGNALK_PASSWORD=PASSWORD
MMSI=123456789
```

Now everything should be setup.

Run the script as normal `node index.js`, or with logging output: `node index.js log`

## Contribute
Feel free to contribute by creating a *Pull Request*