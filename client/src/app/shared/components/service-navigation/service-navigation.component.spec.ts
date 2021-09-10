import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceNavigationComponent } from './service-navigation.component';

describe('ServiceNavigationComponent', () => {
  let component: ServiceNavigationComponent;
  let fixture: ComponentFixture<ServiceNavigationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceNavigationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
