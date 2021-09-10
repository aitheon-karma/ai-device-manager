import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GamepadMappingComponent } from './gamepad-mapping.component';

describe('GamepadMappingComponent', () => {
  let component: GamepadMappingComponent;
  let fixture: ComponentFixture<GamepadMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GamepadMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamepadMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
