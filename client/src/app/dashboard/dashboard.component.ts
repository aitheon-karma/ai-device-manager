import { OrganizationsService } from './../shared/services/organizations.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  AuthService,
  ModalService,
  ApplicationBuildService,
  ApplicationsService,
  ApplicationType,
  GraphRefType,
  ApplicationProjectType
} from '@aitheon/core-client';
import { switchMap, take, tap, catchError, delay } from 'rxjs/operators';
import { Subscription, Subject, combineLatest, Observable, OperatorFunction, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { GraphsRestService } from '@aitheon/system-graph';

interface Deploy {
  graphNodeId?: string;
  publish?: boolean;
  updateToLatestRelease?: boolean;
  error?: any;
}

@Component({
  selector: 'ai-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [
    './dashboard.component.scss',
    './dashboard.component.dark.scss'
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  deploySubject: Subject<void>;
  currentOrganization: any;
  currentUser: any;
  application: any;
  isLoading = true;
  graphUrl: string;
  serviceKey = 'DEVICE_MANAGER';
  projectsService: any;
  applications: any[];
  isAppsDropdownOpened: boolean = false;
  selectedApplication: any;
  selectedApplicationId: any;

  constructor(
    public authService: AuthService,
    public modalService: ModalService,
    private applicationBuildService: ApplicationBuildService,
    private toastr: ToastrService,
    private applicationsService: ApplicationsService,
    private graphsRestService: GraphsRestService,
    private organizationsService: OrganizationsService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    combineLatest([
      this.organizationsService.currentOrganization$,
      this.authService.currentUser,
    ]).pipe(take(1), switchMap(([organization, user]) => {
      this.currentOrganization = organization;
      this.currentUser = user;
      this.organizationsService.setHeaders(this.graphsRestService);

      return this.getDashboardApplications();
    })).subscribe();
  }

  toggleAppsDropdown(): void {
    this.isAppsDropdownOpened = !this.isAppsDropdownOpened;
  }

  getDashboardApplications(): Observable<any> {
    return this.applicationsService.getApplicationsByService(ApplicationType.DASHBOARD)
      .pipe(tap(graphData => {
        this.applications = graphData?.applications;
        this.checkForSelectedApp();
        if (graphData?.graphId) {
          this.graphUrl = `/system-graph/graphs/organization/service/DEVICE_MANAGER/sub-graph/${graphData?.graphId}`;
        }
        this.applicationBuildService.setBuildStatus$(null);
        this.isLoading = false;
      }), this.handleError('Unable to load applications'));
  }

  checkForSelectedApp(): void {
    if (this.applications?.length) {
      let application;
      if (this.selectedApplicationId) {
        application = this.selectedApplication;
      }
      if (!application) {
        application = this.applications[0];
      }
      this.selectApplication(application);
    } else {
      this.selectedApplicationId = null;
      this.selectedApplication = null;
    }
  }

  public goToCore(): void {
    if (this.graphUrl) {
      window.open(this.graphUrl, '_blank');
    }
  }

  selectApplication(application: any): void {
    this.selectedApplicationId = application?.graphNodeId;
    this.selectedApplication = application;
  }

  openApplicationsFlowModal() {
    this.modalService.openModal('AUTOMATE_MODAL', { reference: this.serviceKey, referenceType: GraphRefType.SERVICE });
  }

  onCreateNode({ name, type }: { name: string; type: ApplicationProjectType } = {} as any) {
    this.applicationsService.service$.pipe(take(1), switchMap(service => {
      this.applicationBuildService.createApplication({
        name,
        service,
        type,
        subType: ApplicationType.DASHBOARD,
        meta: {
          service,
        } as any,
      });
      return this.onBuildFinish() as Observable<any>;
    })).subscribe();
  }

  onBuildFinish(subscribe?: boolean): Observable<any> | void {
    const observable$ = this.applicationBuildService.buildFinished$.pipe(take(1), switchMap(() => {
      this.isLoading = true;
      return this.getDashboardApplications();
    }));

    if (subscribe) {
      observable$.subscribe();
      return;
    }
    return observable$;
  }

  onEditDashboardApp(): void {
    this.applicationBuildService.editApplication(this.selectedApplication.project?._id);
    this.onBuildFinish(true);
  }

  deployApplication(deployData: Deploy): void {
    this.isLoading = true;
    this.applicationsService.deployNode(deployData).pipe(
      this.handleError('Unable to deploy application'),
      delay(300),
      switchMap(this.getDashboardApplications.bind(this))
    ).subscribe();
  }

  deployDashboardApplications(graphNodes: any[]): void {
    if (graphNodes) {
      const [dashboardNode] = graphNodes;
      if (dashboardNode) {
        this.deployApplication({
          graphNodeId: dashboardNode?._id,
          publish: true,
          updateToLatestRelease: false,
        });
      }
    }
  }

  onDeleteDashboardApplication({ graphNodeId }: { graphNodeId: string }): void {
    let removedIndex = this.applications.findIndex(app => app.graphNodeId === graphNodeId);
    this.applications.splice(removedIndex, 1);
    this.selectedApplication = null;
    this.selectedApplicationId = null;
    this.checkForSelectedApp();
    this.isLoading = false;
    this.toastr.success('Dashboard application successfully removed!');
  }

  private handleError(message: string, executor?: (error: Error) => void): OperatorFunction<any, any> {
    return catchError((error) => {
      this.toastr.error(message);
      executor?.(error);
      return of(undefined);
    });
  }


  ngOnDestroy() {
    try {
      this.subscriptions$.unsubscribe();
    } catch (e) {
    }
  }
}
