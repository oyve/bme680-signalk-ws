# bme680-signalk-ws
Send bme680 data to SignalK server from edge device

## Use
- Requires a bme680-sensor
- Setup a new user in SignalK
- Provide user name and password to the script, where [USER] and [PWD] is defined
- Edit the URL IP address to the SignalK server where [IP] is defined
- Run the script as normal `node index.js`, or with logging output: `node index.js log`

**Disclaimer:** This code DOES WORK, but is still VERY BETA

**Points to improve**
- Discovery of SignalK server
- Reconnect on disconnect or restart of server

## Contribute
Feel free to contribute by creating a *Pull Request*