import { Component, Input, OnInit, SimpleChanges, ViewChild, OnChanges } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps'
import { AuthService } from '@aitheon/core-client';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ToastrService } from "ngx-toastr";
import { InfrastructureMarkerModel } from '../shared/models/infrastructure-marker.model';


@Component({
  selector: 'ai-infrastructure-google-map',
  templateUrl: './infrastructure-google-map.component.html',
  styleUrls: ['./infrastructure-google-map.component.scss']
})
export class InfrastructureGoogleMapComponent implements OnInit, OnChanges {
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap
  @ViewChild(MapInfoWindow, { static: false }) info: MapInfoWindow
  @Input() infrastructure: any;
  @ViewChild('markerElem') markerElem!: MapMarker;

  //
  // Google Map Settings
  //
  zoom = 16;
  center = { lat: 44.63, lng: 28.77 };
  options: google.maps.MapOptions = {
    zoomControl: false,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    maxZoom: 18,
    minZoom: 3,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    backgroundColor: '#2b2b2b',
    styles: [
      {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "saturation": 36
          },
          {
            "color": "#000000"
          },
          {
            "lightness": 40
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "visibility": "on"
          },
          {
            "color": "#000000"
          },
          {
            "lightness": 16
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 20
          }
        ]
      },
      {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 17
          },
          {
            "weight": 1.2
          }
        ]
      },
      {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 20
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 21
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 17
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 29
          },
          {
            "weight": 0.2
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 18
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 16
          }
        ]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 19
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          },
          {
            "lightness": 17
          }
        ]
      }
    ]
  };
  markerOptions = {
    animation: google.maps.Animation.DROP,
    icon: {
      url: 'assets/img/icons/circle.svg',
      size: new google.maps.Size(12, 12),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(0, 0)
    }
  }
  //
  // /Google Map Settings
  //
  infoClicked = false;
  selectedMarkerId = '';
  loading: boolean;
  noAddress = false;
  markerContent: any;
  infrastructureMapMarker: InfrastructureMarkerModel;

  constructor(private authService: AuthService,
              private router: Router,
              private toastr: ToastrService,
              private http: HttpClient) { }

  ngOnInit() {
    this.loadMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadMap();
  }

  openInfo(marker: MapMarker, content) {
    this.selectedMarkerId = content._id;
    this.markerContent = {...content.data};
    this.info.open(marker);
    this.infoClicked = true;
  }

  openHoverInfo(marker: MapMarker, content) {
    if (this.info && !this.infoClicked) {
      this.markerContent = {...content.data};
      this.info.open(marker);
    }
  }

  click($event: google.maps.MouseEvent | google.maps.IconMouseEvent) {
    if (this.info && this.infoClicked) {
      this.info.close();
      this.infoClicked = false;
    }
  }

  hoverOut() {
    if (this.info && !this.infoClicked) {
      this.info.close();
      this.infoClicked = false;
    }
  }

  openInfrastructure(markerData: any){
    this.router.navigate(['/smart-infrastructure/infrastructure/' + markerData._id + '/dashboard']);
  }

  async getCoords() {
    let address = Object.values(this.infrastructure?.location?.address).join(' ');
    const data = await this.http.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${environment.googleMapKey}`)

    data.subscribe((res: any) => {
      if (res.status === 'OK') {
        const googleMapData = res.results[0];
        this.infrastructureMapMarker = this.getMarker(this.infrastructure, googleMapData);
        this.center = this.infrastructureMapMarker.position;
        this.noAddress = false;
        localStorage.setItem(`map-marker-${this.infrastructure._id}`, JSON.stringify(this.infrastructureMapMarker));
      } else if (res.status === 'ZERO_RESULTS') {
        this.noAddress = true;
        console.log('Cant`t find current Infrastructure address');
      }
    });
  }

  private loadMap() {
    this.loading = true;
    if (localStorage.getItem(`map-marker-${this.infrastructure._id}`)) {
      this.infrastructureMapMarker = JSON.parse(localStorage.getItem(`map-marker-${this.infrastructure._id}`));
      this.center = this.infrastructureMapMarker.position;
      this.loading = false;
    } else {
      this.getCoords().finally(() => {
        this.loading = false;
      });
    }
  }

  getMarker(data: any, coords: any) {
    if (data.location) {
      return {
        position: {
          lat: coords.geometry.location.lat,
          lng: coords.geometry.location.lng
        },
        label: {
          color: 'white',
          text: coords.formatted_address
        },
        data: {
          _id: data._id,
          type: data?.type,
          name: data?.name,
          address: coords.formatted_address
        },
        options: this.markerOptions
      }
    }
  }
}
