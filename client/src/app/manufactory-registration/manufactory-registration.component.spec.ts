import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManufactoryRegistrationComponent } from './manufactory-registration.component';

describe('ManufactoryRegistrationComponent', () => {
  let component: ManufactoryRegistrationComponent;
  let fixture: ComponentFixture<ManufactoryRegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManufactoryRegistrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManufactoryRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
