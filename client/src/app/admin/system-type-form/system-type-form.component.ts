import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ModalService, AuthService } from '@aitheon/core-client';
import { Component, OnInit, TemplateRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { SystemTypesRestService, SystemType } from '@aitheon/device-manager';

@Component({
  selector: 'ai-system-type-form',
  templateUrl: './system-type-form.component.html',
  styleUrls: ['./system-type-form.component.scss']
})
export class SystemTypeFormComponent implements OnInit {
  @ViewChild('systemTypeModal') systemTypeModal: TemplateRef<any>;
  @Output() close: EventEmitter<boolean> = new EventEmitter<boolean>();
  modalType = 'SYSTEM_TYPE';
  systemTypeModalRef: BsModalRef;
  systemTypeForm: FormGroup;
  submitted: boolean = false;
  currentOrg: any;
  systemType: SystemType;
  constructor(private modalService: ModalService,
              private bsModalService: BsModalService,
              private fb: FormBuilder,
              private systemTypesRestService: SystemTypesRestService,
              private authService: AuthService,
              private toastr: ToastrService) { }

  ngOnInit(): void {
    this.authService.activeOrganization.subscribe(org => {
			this.currentOrg = org;
			this.systemTypesRestService.defaultHeaders = this.systemTypesRestService.defaultHeaders.set('organization-id', org._id)
    });

    this.modalService.openModal$.subscribe(({type, data}) => {
      if (type === this.modalType) {
        if (data) {
          this.systemType = data;
        }

        this.show();
        this.buildForm();
      }
    });
  }

  buildForm() {
    this.submitted = false;
    this.systemTypeForm = this.fb.group({
      name: [this.systemType ? this.systemType.name : '', [ Validators.required ]],
      description: [this.systemType ? this.systemType.description : '', [ Validators.maxLength(300) ]],
      commands: null
    })
  }

  public show() {
    this.systemTypeModalRef = this.bsModalService.show(
      this.systemTypeModal,
      Object.assign({}, {class: 'create-modal'})
    );
  }

  public closeModal() {
    this.modalService.onModalClose(this.modalType);
    this.systemTypeModalRef.hide();
    this.systemType = null;
  }

  removeSystemType() {
    this.systemTypesRestService.remove(this.systemType._id).subscribe( res => {
      this.toastr.success('System type successfully removed');
      this.close.emit(true);
      this.closeModal();
    });
  }

  onSubmit() {
    this.submitted = true;

    if (!this.systemTypeForm.valid) {
      return
    }

    if (this.systemType) {
      this.systemTypesRestService.update(this.systemType._id, this.systemTypeForm.value).subscribe( res => {
        this.toastr.success('System type successfully updated');
        this.close.emit(true);
        this.closeModal();
      });
    } else {
      this.systemTypesRestService.create(this.systemTypeForm.value).subscribe( res => {
        this.toastr.success('System type successfully created');
        this.close.emit(true);
        this.closeModal();
      });
    }
  }
}
