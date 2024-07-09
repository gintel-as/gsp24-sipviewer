import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { SessionTableComponent } from './session-table/session-table.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'upload', component: SessionTableComponent },
];
export default routes;
