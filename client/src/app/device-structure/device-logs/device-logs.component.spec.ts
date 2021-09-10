import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceLogsComponent } from './device-logs.component';

describe('DeviceLogsComponent', () => {
  let component: DeviceLogsComponent;
  let fixture: ComponentFixture<DeviceLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
