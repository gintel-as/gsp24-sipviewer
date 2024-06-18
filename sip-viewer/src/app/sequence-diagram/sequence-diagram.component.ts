import { Component, AfterViewInit, ElementRef } from '@angular/core';

declare const Diagram: any;

@Component({
  selector: 'app-sequence-diagram',
  standalone: true,
  imports: [],
  templateUrl: './sequence-diagram.component.html',
  styleUrl: './sequence-diagram.component.css'
})
export class SequenceDiagramComponent implements AfterViewInit{
  constructor(private elementRef: ElementRef) {}
  
  ngAfterViewInit() {
    const diagramDefinition = `
      Alice->Bob: Hello Bob, how are you?
      Note right of Bob: Bob thinks
      Bob-->Alice: I am good thanks!
      Alice->Bob: What about you?
      Bob-->Alice: I'm great!
    `;

    const diagramContainer = this.elementRef.nativeElement.querySelector('#diagram');
    console.log(diagramContainer); // Check if this is not null and points to the correct element
    if (diagramContainer) {
      Diagram.parse(diagramDefinition).drawSVG(diagramContainer, {theme: 'simple'});
    }
  }

}
