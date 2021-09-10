import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceAosViewerComponent } from './device-aos-viewer.component';

describe('DeviceAosViewerComponent', () => {
  let component: DeviceAosViewerComponent;
  let fixture: ComponentFixture<DeviceAosViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceAosViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceAosViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
