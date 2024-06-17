import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TestJsonComponent } from "./test-json/test-json.component";


@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [RouterOutlet, TestJsonComponent]
})
export class AppComponent {
  title = 'sip-viewer';
}
