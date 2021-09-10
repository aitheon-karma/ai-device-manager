import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalService } from '@aitheon/core-client';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'ai-commands-form',
  templateUrl: './commands-form.component.html',
  styleUrls: ['./commands-form.component.scss']
})
export class CommandsFormComponent implements OnInit {
  @ViewChild('commandsModal') commandsModal: TemplateRef<any>;
  modalType = 'COMMANDS';
  commandsModalRef: BsModalRef;
  commandForm: FormGroup;
  constructor(private modalService: ModalService,
              private bsModalService: BsModalService,
              private fb: FormBuilder) { }

  ngOnInit(): void {

    this.modalService.openModal$.subscribe(({type, data}) => {
      if (type === this.modalType) {
        this.show();
      }
    });
  }

  buildForm() {
    this.commandForm = this.fb.group({
      name: [''],
      code: [''],
      description: ['', Validators.maxLength(300)]
    })
  }

  public show() {
    this.commandsModalRef = this.bsModalService.show(
      this.commandsModal,
      Object.assign({}, {class: 'create-modal'})
    );
  }

  public closeModal() {
    this.modalService.onModalClose(this.modalType);
    this.commandsModalRef.hide();
  }

}
