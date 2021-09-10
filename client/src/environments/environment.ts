// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  service: 'DEVICE_MANAGER',
  production: false,
  baseApi: 'https://dev.aitheon.com',
  googleMapKey: 'AIzaSyCvbpFXw0Npp-7cXeBunUClUWh0KF9CPLo',
  iceServers: [
    {
      urls: 'turn:ice.dev.aitheon.com',
      username: 'user',
      credential: 'root'
    }
  ],
  webSignallingWebsocket: 'wss://dev.aitheon.com/webrtc-signalling'
};

