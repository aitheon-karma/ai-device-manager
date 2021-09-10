
import { NgModule } from '@angular/core';
import { CoreClientModule } from '@aitheon/core-client';
import { SmartInfrastructureModule } from '@aitheon/smart-infrastructure';
import { CreatorsStudioModule } from '@aitheon/creators-studio';
import { SystemGraphModule } from '@aitheon/system-graph';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { DeviceManagerModule, Configuration, ConfigurationParameters } from '@aitheon/device-manager';
import { TemplateModule as OrchestratorModule } from '@aitheon/orchestrator';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export function apiConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath: '.'
  };
  return new Configuration(params);
}

export function apiOrchestratorConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${ environment.production ? '' : environment.baseApi }/orchestrator`
  };
  return new Configuration(params);
}

export function apiSmartInfrastructureConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${ environment.production ? '' : environment.baseApi }/smart-infrastructure`
  };
  return new Configuration(params);
}

export function apiCreatorsStudioConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${ environment.production ? '' : environment.baseApi }/creators-studio`
  };
  return new Configuration(params);
}

export function apiSystemGraphConfigFactory (): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${ environment.production ? '' : environment.baseApi }/system-graph`
  };
  return new Configuration(params);
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreClientModule.forRoot({
      service: environment.service,
      baseApi: environment.baseApi,
      production: environment.production
    }),
    AppRoutingModule,
    SharedModule,
    DeviceManagerModule.forRoot(apiConfigFactory),
    OrchestratorModule.forRoot(apiOrchestratorConfigFactory),
    SmartInfrastructureModule.forRoot(apiSmartInfrastructureConfigFactory),
    SystemGraphModule.forRoot(apiSystemGraphConfigFactory),
    CreatorsStudioModule.forRoot(apiCreatorsStudioConfigFactory)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
