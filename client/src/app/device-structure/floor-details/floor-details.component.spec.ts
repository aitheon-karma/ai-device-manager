import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FloorDetailsComponent } from './floor-details.component';

describe('FloorDetailsComponent', () => {
  let component: FloorDetailsComponent;
  let fixture: ComponentFixture<FloorDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FloorDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FloorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
