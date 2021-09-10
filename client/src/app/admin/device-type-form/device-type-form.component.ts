import { ToastrService } from 'ngx-toastr';
import { DeviceTypesRestService, DeviceType } from '@aitheon/device-manager';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalService } from '@aitheon/core-client';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Component, OnInit, ViewChild, TemplateRef, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ai-device-type-form',
  templateUrl: './device-type-form.component.html',
  styleUrls: ['./device-type-form.component.scss']
})
export class DeviceTypeFormComponent implements OnInit {
  @Output() close: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('deviceTypeModal') deviceTypeModal: TemplateRef<any>;
  modalType = 'DEVICE_TYPE';
  deviceTypeModalRef: BsModalRef;
  deviceTypeForm: FormGroup;
  submitted: boolean = false;
  deviceType: DeviceType;
  existingTypes: DeviceType[] = [];
  isTypeAlreadyExist: boolean;
  constructor(private modalService: ModalService,
              private bsModalService: BsModalService,
              private fb: FormBuilder,
              private toastr: ToastrService,
              private deviceTypesRestService: DeviceTypesRestService) { }

  ngOnInit(): void {

    this.deviceTypesRestService.listAll().subscribe((types: DeviceType[]) => {
      this.existingTypes = types;
    });

    this.modalService.openModal$.subscribe(({type, data}) => {
      if (type === this.modalType) {
        if (data) {
          this.deviceType = data;
        }

        this.show();
        this.buildForm();
      }
    });

    this.buildForm();
  }

  buildForm() {
    this.submitted = false;
    this.deviceTypeForm = this.fb.group({
      name: [this.deviceType ? this.deviceType.name : '', [ Validators.required ]],
      description: [this.deviceType ? this.deviceType.description : '', [Validators.maxLength(300)]],
      command: null
    })
  }

  public show() {
    this.deviceTypeModalRef = this.bsModalService.show(
      this.deviceTypeModal,
      Object.assign({}, {class: 'create-modal'})
    );
  }

  public closeModal() {
    this.modalService.onModalClose(this.modalType);
    this.deviceTypeModalRef.hide();
    this.deviceType = null;
  }

  removeDeviceType() {
    this.deviceTypesRestService.remove(this.deviceType._id).subscribe( res => {
      this.toastr.success('Device type successfully removed');
      this.closeModal();
      this.close.emit(true);
    },
    err => this.toastr.error(err.error.message));
  }

  onSubmit() {
    this.submitted = true;

    if (!this.deviceTypeForm.valid) {
      return;
    }

    const name = this.deviceTypeForm.get('name').value;
    const convertedName = name ? name.replace(/ /g, "_").toUpperCase() : name;

    const dtoToSave = {
      ...this.deviceTypeForm.value,
      name: convertedName
    };

    if (this.deviceType) {
      this.deviceTypesRestService.update(this.deviceType._id, dtoToSave).subscribe( res => {
        this.toastr.success('Device type successfully updated');
        this.closeModal();
        this.close.emit(true);
      });
    } else {
      this.isTypeAlreadyExist = !!this.existingTypes.find((t => t.name === convertedName));
      if (this.isTypeAlreadyExist) return;
      this.deviceTypesRestService.create(dtoToSave).subscribe( res => {
        this.toastr.success('Device type successfully created');
        this.closeModal();
        this.close.emit(true);
      });
    }
  }
}
