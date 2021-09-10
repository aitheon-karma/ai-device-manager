export const environment = {
  service: 'DEVICE_MANAGER',
  production: true,
  baseApi: '',
  googleMapKey: 'AIzaSyB_ZvlX7m7YRan99TyJ1qmy_VPQjN1dcOI',
  iceServers: [
    {
      urls: "turn:ice.dev.aitheon.com",
      username: "user",
      credential: "root"
    }
  ],
  webSignallingWebsocket: '/webrtc-signalling'
};
