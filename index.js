#!/usr/bin/env node

var uuid = require('uuid');
const WebSocket = require('ws');
const { Bme680 } = require('bme680-sensor');

const bme680 = new Bme680(1, 0x76);
const ws = new WebSocket('ws://[IP]:3000/signalk/v1/stream?subscribe=none')

var loggingEnabled = process.argv[2] == "log";

console.info('server started');

ws.on('open', function open() {
    ws.send(JSON.stringify({
        requestId: uuid.v4(),
        login: {
            username: '[USER]', //signalk user
            password: '[PWD]' //password
        }
    }));
    log('login sent');
});

var hasToken = false;
var token = '';


ws.on('message', function incoming(data) {
    var result = JSON.parse(data)

    if (!hasToken) {
        var pos = data.search('token');
        if (pos != -1) {
            token = result.login.token;
            hasToken = true;
            readSensor();
            log('token received')
        }
    }
});

ws.on('close', function close() {
    log('disconnected');
});


function readSensor() {
    log('start initialize sensor');
    bme680.initialize().then(async () => {
        console.info('sensor initialized')
        setInterval(async () => {
            var payload = signalkMessage(await bme680.getSensorData());
            ws.send(payload);
            log("payload sent");
        }, 1000);
    });
}

function signalkMessage(sensorJSON) {
    var payload = JSON.stringify({
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
    });

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
    if (loggingEnabled) {
        console.log(message);
    }
}



