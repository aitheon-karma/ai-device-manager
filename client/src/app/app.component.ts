import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'ai-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  serviceName = 'Device Manager';
  googleMapScript: HTMLScriptElement;
  constructor(
    public authService: AuthService,
    public toastr: ToastrService, vcr: ViewContainerRef
  ) {
    // this.toastr.setRootViewContainerRef(vcr);
    this.googleMapScript = document.createElement('script');
    this.googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapKey}`;
    document.head.appendChild(this.googleMapScript);
  }

  ngOnInit() {
    this.authService.loggedIn.subscribe((loggedIn: boolean) => {
      console.log('loggedIn ', loggedIn);
    });
  }

}
