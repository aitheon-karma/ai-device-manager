export interface InfrastructureMarkerModel {
  position: {
    lat: number,
    lng: number
  },
  label: {
    color: string,
    text: string
  },
  data: {
    _id: string,
    type: string,
    name: string,
    address: string
  },
  options: {
    animation: number,
    icon: {
      url: string,
      size: any,
      origin: any,
      anchor: any
    }
  }
}
