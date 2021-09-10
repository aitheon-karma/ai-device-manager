import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DetectedDevice } from '../autodetect-modal/detected-device';
import { OrganizationsService } from '../../shared/services/organizations.service';
import { DriveUploaderComponent, ModalService, AuthService } from '@aitheon/core-client';
import { DevicesRestService, Device, DeviceTypesRestService, DeviceType } from '@aitheon/device-manager';
import { SharedService } from '../../shared/services/shared.service';
import * as _ from 'lodash';

@Component({
  selector: 'ai-device-form',
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.scss']
})
export class DeviceFormComponent implements OnInit, OnDestroy {
  @Input() editMode: boolean;
  @Input() device: Device;
  @Output() quitEditMode: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('testConnectionButton') testConnectionButton: ElementRef;
  @ViewChild('uploaderInput') uploaderInput: ElementRef;
  @ViewChild('driveUploader') driveUploader: DriveUploaderComponent;
  deviceForm: FormGroup;
  subscriptions: Subscription[] = [];
  emptyStation: boolean;
  typesList: Array<{ name: string, value: string }> = [];

  driverSoftwareList = [
    { value: 'AITHEON.INTERFACE', name: 'Aitheon Interface' },
    { value: 'AXIS.CAMERA.COMMON', name: 'Common AXIS camera' },
    { value: 'VR_DEVICE.HTC.VIVE', name: 'HTC Vive' },
    { value: 'AOS.NVIDIA', name: 'AOS Nvidia' }
  ];

  communicationTypeList = [
    // { value: "WIFI", name: "Wi-Fi" },
    { value: 'USB', name: 'USB Port' },
    // { value: "SERIAL", name: "Serial Port"},
    // { value: "ETHERNET", name: "Ethernet" },
  ];

  protocolTypeList = [
    { value: 'SERIAL', name: 'USB Serial' },
    { value: 'HID', name: 'USB HID' },
    { value: 'ZPL', name: 'Zebra Printer ZPI' },
  ];

  controllersList = [] as Device[];

  loading = false;
  textConnection = {
    title: 'Test Connection',
    text: '',
    colorStatus: ''
  };
  controllerId: string;
  initialFormData: any;
  controllerListSubscription: Subscription;
  selectedController = [];
  payloadWithNotAosDevice: Device;
  notAosDeviceAdded = false;
  isController = false;
  deviceImage: any;
  serviceKey: any;
  currentOrg: any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private modalService: ModalService,
    private organizationsService: OrganizationsService,
    private sharedService: SharedService,
    private devicesRestService: DevicesRestService,
    private deviceTypesRestService: DeviceTypesRestService,
    ) {
    this.route.queryParamMap.subscribe(params => {
      this.controllerId = params.get('controllerId');
      this.isController = params.get('isController') === 'true';
    });
  }

  ngOnInit(): void {
    this.loading = true;

    this.subscriptions.push(
      this.organizationsService.currentOrganization$.subscribe(org => {
        this.serviceKey = {
          _id: 'DEVICE_MANAGER',
          key: `${org._id}`
        };
        this.devicesRestService.defaultHeaders = this.devicesRestService.defaultHeaders.set('organization-id', org._id);
        this.deviceTypesRestService.defaultHeaders = this.deviceTypesRestService.defaultHeaders.set('organization-id', org._id);
      })
    );

    this.subscriptions.push(
      this.deviceTypesRestService.listAll().subscribe((deviceTypes: DeviceType[]) => {
        this.typesList = deviceTypes.map((type: DeviceType) => {
          return {
            value: type.name,
            name: this.sharedService.humanize(type.name)
          };
        });
      })
    );

    this.getControllers();

    this.buildForm();

    this.initialFormData = this.formControls;
  }

  get formControls() { return this.deviceForm.controls as any; }

  arrayUnique(arr) {
    return arr.filter((e, i, a) => a.indexOf(e) === i);
  }

  buildForm() {
    this.deviceForm = this.fb.group({
      name: [this.device?.name || '', Validators.required],
      type: [this.device?.type.name || null, Validators.required],
      serialNumber: [this.device?.serialNumber || ''],
      address: [this.device?.address || ''],
      port: [this.device?.port || ''],
      communicationType: [this.device?.communicationType || null],
      controller: [(this.device?.controller && this.device?.controller[0]) || null, { disabled: true }],
    });

    this.setSerialNumberValidation();
    this.setIsCommunicationTypeValidation();

    this.subscriptions.push(
      this.formControls.type.valueChanges.subscribe(field => {
        this.setSerialNumberValidation();
        this.setIsCommunicationTypeValidation();
        if (field !== 'AOS_DEVICE' && field !== 'ROBOT') {
          this.deviceForm.get('communicationType').patchValue('USB');
          this.formControls.controller.setValidators([Validators.required]);
        } else {
          this.deviceForm.get('communicationType').patchValue(null);
          this.formControls.controller.clearValidators([Validators.required]);
        }

        this.deviceForm.updateValueAndValidity();
      })
    );

    this.subscriptions.push(
      this.formControls.controller.valueChanges.subscribe(field => {
        if (field) {
          this.selectedController = this.controllersList.filter(controller => field === controller._id);
        }
      })
    );

    this.subscriptions.push(
      this.formControls.communicationType.valueChanges.subscribe(field => {
        this.setSerialNumberValidation();
      })
    );

    if (this.device?.communicationType) {
      this.deviceForm.get('communicationType').patchValue(this.device?.communicationType);
    }

      this.getControllers();

    if (this.controllerId) {
      this.formControls.type.setValue('CAMERA');
      this.typesList = this.typesList.filter((type: {name: string, value: string}) => {
        return type.value !== 'AOS_DEVICE' && type.value !== 'ROBOT';
      });
      this.formControls.controller.setValue(this.controllerId);
    }
  }

  onModalClose(cancelLoading: boolean) {
    this.loading = !cancelLoading;
  }

  onDetect(data: DetectedDevice) {
    const payload = {
      ...this.deviceForm.value,
      product: data.deviceName,
      manufacturer: data.manufacturer,
      productId: data.productId,
      serialNumber: data.serialNumber,
      vendorId: data.vendorId,
      path: data.path,
      protocol: data.protocol,
      isController: false
    } as Device;
    // For registration new serialNumber
    payload.isSoftDevice = true;
    this.payloadWithNotAosDevice = payload;
    this.notAosDeviceAdded = true;
  }

  saveForm() {
    const payload = this.deviceForm.value;

    if (this.device?.image || this.deviceImage) {
      payload.image = this.device?.image ? this.device.image : this.deviceImage;
    }

    if (payload.controller) {
      const controller = this.controllersList.find(c => c._id === payload.controller);
      payload.system = controller.system;
    }
    payload.isController = payload.type === 'AOS_DEVICE';

    Object.keys(payload).forEach((key) => (payload[key] == null) && delete payload[key]);
    this.processSavingDevice(payload);
  }

  processSavingDevice(payload: Device) {
    let deviceToCreate = payload;

    if (this.payloadWithNotAosDevice) {
      deviceToCreate = {
        ...payload,
        ..._.pick(this.payloadWithNotAosDevice, ['communicationType', 'manufacturer', 'path', 'product', 'productId', 'protocol', 'serialNumber', 'vendorId'])
      };
    }

    this.subscriptions.push(
      this.devicesRestService.register('EMPTY', deviceToCreate).subscribe((device: Device) => {
        this.toastr.success('Device registered successfully.');
        this.closeNewDeviceForm();
      },
      err => this.toastr.error(err.error?.message || 'Error in creating device'))
    );

  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      try {
        subscription.unsubscribe();
      } catch (e) {}
    }
  }


  runTestConnection() {
    this.testConnectionButton.nativeElement.disabled = true;
    this.textConnection = {
      title: 'Testing...',
      text: 'Sending packages…',
      colorStatus: '#ed9438'
    };

    // Test in Progress
    setTimeout(() => {
      this.textConnection = {
        title: 'Test is done',
        text: 'A connection is setted up and ready to use',
        colorStatus: '#67b231'
      };
      this.testConnectionButton.nativeElement.disabled = true;
    }, 3000);


    // If Test Failed
    // this.textConnection = {
    //   title: 'Retry',
    //   text: 'Connection failed',
    //   colorStatus: '#e96058'
    // };
    // this.testConnectionButton.nativeElement.disabled = false;
  }

  openAutoDetectModal(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.loading = true;
    this.modalService.openModal('AUTODETECT_MODAL', { form: this.deviceForm.value });
  }

  closeNewDeviceForm() {
    const isFromController = !!this.controllerId;
    const routeToNavigate = isFromController ? `../device/${this.controllerId}` : `../`;

    if (this.editMode) {
      this.quitEditMode.emit(true);
    } else {
      this.deviceForm.reset();
      this.router.navigate([routeToNavigate], { relativeTo: this.route });
    }
  }

  private setSerialNumberValidation() {
    this.deviceForm.get('serialNumber').patchValue(this.device?.serialNumber || '');

    if (this.formControls.type.value === 'AOS_DEVICE' ||
      this.formControls.communicationType.value === 'WIFI' ||
      this.formControls.communicationType.value === 'ETHERNET') {
      this.formControls.serialNumber.setValidators([Validators.required]);
    } else {
      this.formControls.serialNumber.clearValidators();
    }
    this.formControls.serialNumber.updateValueAndValidity();
  }

  private setIsCommunicationTypeValidation() {
    if (this.formControls.type.value !== 'AOS_DEVICE' && this.formControls.type.value !== 'ROBOT') {
      this.formControls.communicationType.setValidators([Validators.required]);
    } else {
      this.formControls.communicationType.setValidators([]);
    }
    this.deviceForm.get('communicationType').patchValue(null);
    this.formControls.communicationType.updateValueAndValidity();
  }

  private getControllers() {
    this.subscriptions.push(
      this.devicesRestService.listAll('AOS_DEVICE').subscribe((devices: Device[]) => {
        this.controllersList = devices.filter((device: Device) => device.isController && !device.infrastructure);
      })
    );
  }

  // private createNotAosDevice(payload: Device) {
  //   this.infrastructureRestService.createNotAosDevice(payload).subscribe((device: Device) => {
  //       this.loading = false;
  //       this.toastr.success('Device registered');
  //       this.onCancel();
  //     },

  //     err => {
  //       this.loading = false;
  //       this.toastr.error(err.error.message || err);
  //     });
  // }

  openUploadWindow() {
    this.uploaderInput.nativeElement.click();
  }

  failedUpload(event: any) {
    this.toastr.error('File upload failed');
  }

  onSuccessUpload(event: any) {
    this.deviceImage = {
      signedUrl: event.signedUrl,
      name: event.name,
      contentType: event.contentType
    };
  }

  onAfterAdd(event: any) {
    let sizeNotAllowed = false;
    let typeNotAllowed = false;
    let errorMessage = '';
    if (!(event.file.size / 1000 / 1000 < 3)) {
      sizeNotAllowed = true;
      errorMessage = 'File size limit exceeded, should be less than 3 MB.';
    }
    if (!event.file.type.match('image.*')) {
      typeNotAllowed = true;
      errorMessage = 'File type unknown, only JPG/PNG allowed.';
    }
    if (sizeNotAllowed || typeNotAllowed) {
      this.driveUploader.uploader.cancelAll();
      this.driveUploader.uploader.clearQueue();
      this.toastr.error(errorMessage);
    }
  }
}
