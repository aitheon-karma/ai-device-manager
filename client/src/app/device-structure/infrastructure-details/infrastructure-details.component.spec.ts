import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrastructureDetailsComponent } from './infrastructure-details.component';

describe('InfrastructureDetailsComponent', () => {
  let component: InfrastructureDetailsComponent;
  let fixture: ComponentFixture<InfrastructureDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfrastructureDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfrastructureDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
