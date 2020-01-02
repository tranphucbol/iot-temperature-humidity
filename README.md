# Deployment

## Run Server

Add file `.env`

```sh
PORT=3000
MQTT_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
DATABASE_HOST=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=
SECRET= (secret is encrypted by bcrypt)
```

```sh
npm install
npm start
```

Access address: localhost:3000

## Run ESP

File: `iot-final.ino`
