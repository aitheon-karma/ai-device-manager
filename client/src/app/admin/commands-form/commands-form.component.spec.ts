import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandsFormComponent } from './commands-form.component';

describe('CommandsFormComponent', () => {
  let component: CommandsFormComponent;
  let fixture: ComponentFixture<CommandsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommandsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
