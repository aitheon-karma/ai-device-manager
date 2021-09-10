import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemTypeFormComponent } from './system-type-form.component';

describe('SystemTypeFormComponent', () => {
  let component: SystemTypeFormComponent;
  let fixture: ComponentFixture<SystemTypeFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemTypeFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
