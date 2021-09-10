import { SharedService } from './../../shared/services/shared.service';
import { Router } from '@angular/router';
import { AuthService } from '@aitheon/core-client';
import { Component, Input, OnInit, QueryList, ViewChild, ViewChildren, OnDestroy } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Subscription } from 'rxjs';
import { GraphsRestService, Graph } from '@aitheon/system-graph';
@Component({
  selector: 'ai-infrastructure-details',
  templateUrl: './infrastructure-details.component.html',
  styleUrls: ['./infrastructure-details.component.scss']
})
export class InfrastructureDetailsComponent implements OnInit, OnDestroy {
    subscriptions$ = new Subscription();
    private _window: Window = window;
    @ViewChild(GoogleMap, { static: false }) map: GoogleMap
    @ViewChild(MapInfoWindow, { static: false }) info: MapInfoWindow
    @Input() googleMapMarkers: any;
    @ViewChildren('markerElem') markerElem!: QueryList<any>;
    currentOrg: any;
    zoom = 7;
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
    markers = [{
        position: {
            lat: 34.052235,
            lng: -118.243683,
        },
        label: {
            color: 'white',
            text: 'Dodger Stadium, LA',
        }
    }];
  markerContent: any;
  prev: any;
  receivedGoogleMapMarkers: any;
  infoClicked = false;
  selectedMarkerId = '';
  system: any;
  graphUrl: any;
  constructor(private authService: AuthService,
              private sharedService: SharedService,
              private graphsRestService: GraphsRestService,
              private router: Router) { }

  ngOnInit() {
    this.subscriptions$.add(this.authService.activeOrganization.subscribe(org => {
			this.currentOrg = org;
			this.graphsRestService.defaultHeaders = this.graphsRestService.defaultHeaders.set('organization-id', org._id)
    }));

    this.subscriptions$.add(this.sharedService.getChosenSystem().subscribe( system => {
      if (system) {
        this.system = system;
        this.setCoreURL();
      }
    }));
  }

  setCoreURL(): void {

    this.subscriptions$.add(
			this.graphsRestService.getReferenceType(this.system?.reference?._id, 'INFRASTRUCTURE').subscribe((graph: Graph) => {

				if (graph && graph._id) {
						this.graphUrl = `/system-graph/graphs/organization/service/SMART_INFRASTRUCTURE/sub-graph/${graph._id}`;
				}
    }));
  }

  openCore(): void {
    this._window.open(this.graphUrl, '_blank');
	}

	openInfra() {
		this._window.open(`/smart-infrastructure/infrastructure/${this.system?.reference?._id}/structure`, '_blank');
	}

  openInfo(marker: MapMarker, content) {
    this.selectedMarkerId = content._id;
    this.markerContent = {...content.data};
    this.info.open(marker);
    this.infoClicked = true;
    // this.dashboardService.markerSelected(content.data);
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

  setMarkerBounce() {
    const markerBounds = this.map.getBounds();
    this.markerElem.forEach(marker => {
      markerBounds.extend(marker.getPosition())
    });
    this.map.fitBounds(markerBounds, 30);
    this.zoom = this.map.getZoom();
  }

  getMarkersCenter() {
    const latArr = [];
    const lngArr = [];

    this.receivedGoogleMapMarkers.map(marker => {
      latArr.push(marker.position.lat);
      lngArr.push(marker.position.lng);
    });
    return {
      lat: (Math.min(...latArr) + Math.max(...latArr)) / 2,
      lng: (Math.min(...lngArr) + Math.max(...lngArr)) / 2
    };
  }

  openInfrastructure(markerData: any){
    let data = {
      Id : markerData._id,
      name : markerData.name
    }
    localStorage.setItem('infrastructure', JSON.stringify(data));
    this.router.navigate(['/infrastructure/' + markerData._id + '/dashboard']);
  }

  zoomIn() {
    if (this.zoom <= this.options.maxZoom) this.zoom++
  }

  zoomOut() {
    if (this.zoom >= this.options.minZoom) this.zoom--
  }

  switchView() {
    console.log('Switch View');
  }

  ngOnDestroy():void {
    try {
        this.subscriptions$.unsubscribe();
      } catch (e) {
    }
  }
}
