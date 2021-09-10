import { AuthService } from '@aitheon/core-client';
import { SharedService } from './../../services/shared.service';
import { NavMenuItem } from './../../models/nav-menu-item.model';
import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ai-service-navigation',
  templateUrl: './service-navigation.component.html',
  styleUrls: ['./service-navigation.component.scss']
})
export class ServiceNavigationComponent {
  currentUser: any;
  constructor(public router: Router,
              private route: ActivatedRoute,
              private sharedService: SharedService,
              private authService: AuthService) {
                this.authService.currentUser.subscribe((user: any) => {
                  this.currentUser = user;
                });
              }

    public menuData: NavMenuItem[] = [
      new NavMenuItem(
        'Dashboard',
        ['dashboard'],
      ),
      new NavMenuItem(
        'Device structure',
        ['device-structure'],
      ),
      new NavMenuItem(
        'Admin',
        ['admin']
      ),
      new NavMenuItem(
        'Manufactory registration',
        ['manufactory-registration'],
      )
    ];
    changeTab(event: Event, routerLink: string[]): void {
      event.stopPropagation();
      event.preventDefault();
      if (routerLink[0] === '/') {
        this.router.navigate(routerLink);
        return;
      }
      this.router.navigate(routerLink, {
        relativeTo: this.route,
      });
      this.sharedService.chooseDevice(null);
      this.sharedService.chooseSystem(null);
    }
}
