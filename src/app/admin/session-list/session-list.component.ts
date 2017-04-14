import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FileService } from '../../shared/file.service';
import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { SpeakerService } from '../../shared/speaker.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';
import { AdminService } from '../../shared/admin.service';
import { Conference, TimeSlot } from '../../shared/conference.model';

@Component({
  selector: 'session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {
  @ViewChild('toast') toast: ToastComponent;
  defaultFileString = 'Choose a file...';
  csvFileString = '';
  selectedCsvFile: File;
  defaultFilter = 'active';
  currentFilter: string;
  displaySessions: BehaviorSubject<Session[]> = new BehaviorSubject([]);
  activeConf: Conference;

  constructor(private transitionService: TransitionService,
              private adminService: AdminService,
              private sessionService: SessionService,
              private speakerService: SpeakerService,
              private fileService: FileService,
              private router: Router) {
    this.adminService.activeConference.subscribe(activeConf => {
      this.activeConf = activeConf;
    });
  }

  ngOnInit() {
    this.transitionService.transition();
    this.currentFilter = this.defaultFilter;
    this.setFilter(this.currentFilter);
    this.csvFileString = this.defaultFileString;
    this.activeConf = this.adminService.activeConference.getValue();
  }

  fileSelected(files: FileList, whichFile: string) {
      if (!files[0]) return;
      switch (whichFile) {
          case 'csv':
              this.selectedCsvFile = files[0];
              this.csvFileString = this.selectedCsvFile.name;
              break;
          default:
              break;
      }
  }

  setFilter(filter: string) {
    filter = filter.toLowerCase();
    this.currentFilter = filter;
    switch (filter) {
      case 'all':
        this.displaySessions.next(this.sessionService.sessionsUnfiltered.getValue());
        break;
      case 'active':
        this.displaySessions.next(this.sessionService.sessionsActive.getValue());
        break;
      case 'complete':
        this.displaySessions.next(this.sessionService.sessionsCompleted.getValue());
        break;
      case 'incomplete':
        this.displaySessions.next(this.sessionService.sessionsNotDone.getValue());
        break;
      case 'pending':
        this.displaySessions.next(this.sessionService.sessionsPending.getValue());
        break;
      case 'approved':
        this.displaySessions.next(this.sessionService.sessionsApproved.getValue());
        break;
      case 'denied':
        this.displaySessions.next(this.sessionService.sessionsDenied.getValue());
        break;
      default:
        break;
    }
  }

  getType(type: string) {
    let displayType = '';
    switch (type) {
      case 'casestudy':
        displayType = 'Case Study';
        break;
      case 'workshop':
        displayType = 'Workshop';
        break;
      case 'computerlab':
        displayType = 'Computer Lab';
        break;
      default:
        break;
    }
    return displayType;
  }

  gotoSession(sessionId: string) {
    this.router.navigate(['/session', {id: sessionId}]);
  }

  upload(directory: string) {
      let selectedFile: File;
      switch (directory) {
          case 'csv':
              selectedFile = this.selectedCsvFile;
              break;
          default:
              break;
      }
      if (!selectedFile) {
          this.toast.error('Please select a valid file to upload.');
          return;
      }
      let valid = this.validateFile(selectedFile);
      if (!valid) {
          this.toast.error("Please select a csv file.");
          return;
      }
      let ext = selectedFile.name.split('.').pop();
      this.transitionService.setLoading(true);
      let data = new FormData();
      data.append('userFilename', "Sessions_csv");
      data.append("confTitle", this.activeConf.title);
      data.append('file', selectedFile);
      this.fileService
          .uploadCsv(data, "uploadSessionsCsv")
          .then(res => {
              this.toast.success('File uploaded and sessions information updated.');
              this.transitionService.setLoading(false);
          });
  }

  validateFile(selectedFile: File): boolean {
    var ext = selectedFile.name.slice(-3);
    if (ext === "csv") {
      return true;
    } else {
      return false;
    }
  }
}
