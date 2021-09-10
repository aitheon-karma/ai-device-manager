import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceNavigationComponent } from './components/service-navigation/service-navigation.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { DisableControlDirective } from './directives/disable-control.directive';

@NgModule({
  declarations: [
    ServiceNavigationComponent,
    ClickOutsideDirective,
    DisableControlDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ServiceNavigationComponent,
    ClickOutsideDirective,
    DisableControlDirective
  ]
})
export class SharedModule { }
