import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UploadPortalComponent } from './upload-portal/upload-portal.component';

const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'upload', component: UploadPortalComponent },
];
export default routes;
