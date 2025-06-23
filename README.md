# Aviator

A flightly clone (but worse) app made to track your flights (and those of your friends).
Mainly built for android but can in theory work on iOS too (too lazy to build a native app)

## How to run it locally for dev

1. Set your mapbox token for the map to work:

- In the eas.json file you should have:
```json
{
  "build": {
    "development": {
      "env": {
        "MAPBOX_TOKEN": "pk.ey..Q",
        "RNMapboxMapsDownloadToken": "sk.ey...w"
      }
    }
  }
}
```

2. Install the dependencies:

```bash
bun i
```

3. Start the development server:

```bash
bunx expo run:android
```

4. Connect your phone to your computer with adb and enjoy!

## Backend

See [this repo](https://github.com/espcaa/aviator-backend) for the backend code.
