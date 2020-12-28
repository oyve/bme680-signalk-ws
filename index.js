#!/usr/bin/env node
require('dotenv').config()
var uuid = require('uuid');
const WebSocket = require('ws');
const { Bme680 } = require('bme680-sensor');

const bme680 = new Bme680(1, 0x76);
const logEnabled = process.argv[2] === "log";


function connect() {
    let ws = new WebSocket(process.env.SIGNALK_URL);

    ws.onopen = () => {
        console.info('Web Socket opened to: ' + process.env.SIGNALK_URL);

        let message = createMessage();

        message.login = {
            username: process.env.SIGNALK_USERNAME,
            password: process.env.SIGNALK_PASSWORD
        }

        send(message);
    };

    ws.on('ping', validateToken);

    const token = {
        key: null,
        timeToLive: 5000
    }

    ws.on('message', function incoming(response) {
        log("Received message: " + response);
        let responseJSON = JSON.parse(response);

        if (responseJSON !== null &&
            responseJSON !== undefined &&
            responseJSON.state === "COMPLETED" &&
            responseJSON.statusCode === 200) {

            if (responseJSON.hasOwnProperty('login')) {
                token.key = responseJSON.login.token;
                //token.timeToLive = responseJSON.login.timeToLive; //not supported in SignalK yet

                readSensor();
                validateToken();
            }

            if (responseJSON.hasOwnProperty('validate')) {
                token.key = responseJSON.validate.token;
                log('Token updated: ' + token.key);
            }
        }
    });

    ws.onclose = function(e) {
        log('Socket closed: ' + e.reason);

        setTimeout(function() {
            log('Trying to reconnect', e.reason);
            connect();
        }, 5000);
    };

    ws.onerror = function(err) {
        log(err);
      };

    function send(message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            log('Sent message to server: ' + JSON.stringify(message));
        }
    }

    function validateToken() {
        setInterval(() => {
            let message = createMessage();
            message.validate = {
                token: token.key
            }

            send(message);
        }, token.timeToLive * 0.9); //10% left the token time margin
    }

    function createMessage() {
        return {
            requestId: uuid.v4()
        };
    }

    function readSensor() {
        log('Start initialize sensor');
        bme680.initialize().then(async () => {
            console.info('Sensor initialized')
            setInterval(async () => {
                var message = signalkMessage(await bme680.getSensorData());
                send(message);
            }, 2000);
        });
    }
}

connect();

function signalkMessage(sensorJSON) {
    var payload = {
        context: 'vessels.urn:mrn:imo:mmsi:' + process.env.MMSI,
        updates: [{
            source: {
                type: 'bme680',
                src: 'rpisensors',
                pgn: 123,
                label: 'bme680-sensor'
            },
            timestamp: new Date().toISOString(),
            values: [
                {
                    path: 'environment.outside.temperature',
                    value: toKelvin(sensorJSON.data.temperature)
                },
                {
                    path: 'environment.outside.pressure',
                    value: toPascal(sensorJSON.data.pressure)
                },
                {
                    path: 'environment.outside.humidity',
                    value: sensorJSON.data.humidity
                },
                {
                    path: 'environment.outside.gas_resistance',
                    value: round(sensorJSON.data.gas_resistance, 1)
                }]
        }]
    }

    return payload;
}

function toKelvin(celcius) {
    return round(celcius + 273.15, 1);
}

function toPascal(hPa) {
    return hPa * 100;
}

function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

function log(message) {
    if (logEnabled) {
        console.log(message);
    }
}



