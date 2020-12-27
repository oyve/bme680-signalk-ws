#!/usr/bin/env node
require('dotenv').config()
var uuid = require('uuid');
const WebSocket = require('ws');
const { Bme680 } = require('bme680-sensor');

const bme680 = new Bme680(1, 0x76);
const logEnabled = process.argv[2] === "log";

const client = new WebSocket(config.url);

client.on('open', function open() {
    console.info('Web Socket opened to: ' + process.env.SIGNALK_URL);

    let message = createMessage();

    message.login = {
        username: process.env.SIGNALK_USERNAME,
        password: process.env.SIGNALK_PASSWORD
    }

    send(message);
});

client.on('ping', validateToken);

const token = {
    key: null,
    timeToLive = null
}

client.on('message', function incoming(response) {
    let responseJSON = JSON.parse(response);
    log("Received message: " + responseJSON);

    if (responseJSON !== null &&
        responseJSON !== undefined &&
        responseJSON.state === "COMPLETED" &&
        responseJSON.result === 200) {

        if (responseJSON.login !== null) {
            //if (response.search('token') != -1) {
            token.key = responseJSON.login.token;
            token.timeToLive = responseJSON.login.timeToLive;
            log('First token received: ' + token.key);

            readSensor();

            validateToken();
            //}
        }

        if (responseJSON.validate.token !== null) {
            token.key = responseJSON.validate.token;
            log('Token updated: ' + token.key);
        }
    }
});

client.on('close', function close() {
    clearTimeout(this.pingTimeout);
    log('Disconnected');
});

function validateToken() {
    setTimeout(() => {
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

function send(message) {
    client.send(JSON.stringify(message));
    log('Sent message to server: ' + message);
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

function signalkMessage(sensorJSON) {
    var payload = {
        context: 'vessels.urn:mrn:imo:mmsi:219019288',
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



