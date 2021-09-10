import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { DemoElementModule } from './demo-element.module';


enableProdMode();

platformBrowserDynamic()
   .bootstrapModule(DemoElementModule)
   .catch(err => console.error(err));
