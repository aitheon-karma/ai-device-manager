import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoComponent } from './components/demo/demo.component';
import { BrowserModule } from '@angular/platform-browser';



@NgModule({
  declarations: [DemoComponent],
  imports: [
    CommonModule,
    BrowserModule
  ],
  exports: [DemoComponent]
})
export class DemoModule { }
