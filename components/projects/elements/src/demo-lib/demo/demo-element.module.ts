import { NgModule, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElementModule } from '../../abstract/element.module';
import { DemoModule, DemoComponent } from '../../../../demo-lib/src/public-api';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DemoModule
  ],
  entryComponents: [DemoComponent]
})
export class DemoElementModule extends ElementModule {
  constructor(injector: Injector) {
    super(injector, DemoComponent, 'demo');
  }

  ngDoBootstrap() {

  }

}
