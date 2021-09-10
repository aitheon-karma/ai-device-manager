import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceGeneralComponent } from './device-general.component';

describe('DeviceGeneralComponent', () => {
  let component: DeviceGeneralComponent;
  let fixture: ComponentFixture<DeviceGeneralComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceGeneralComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
