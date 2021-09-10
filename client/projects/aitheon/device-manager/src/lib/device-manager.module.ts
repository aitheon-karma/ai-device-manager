import { NgModule, Optional, ModuleWithProviders, SkipSelf } from '@angular/core';
import { ApiModule } from './rest/api.module';
import { Configuration } from './rest/configuration';

@NgModule({
  declarations: [
  ],
  imports: [
    ApiModule
  ],
  providers: [
  ],
  exports: [
    ApiModule
  ]
})
export class DeviceManagerModule {
  public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
    return {
      ngModule: DeviceManagerModule,
      providers: [
        { provide: Configuration, useFactory: configurationFactory }
      ]
    };
  }
  constructor(@Optional() @SkipSelf() parentModule: DeviceManagerModule) {
    if (parentModule) {
      throw new Error('DeviceManagerModule is already loaded. Import in your base AppModule only.');
    }
  }
}
// dist
