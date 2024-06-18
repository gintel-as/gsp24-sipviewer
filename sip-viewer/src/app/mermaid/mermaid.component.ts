import { Component, AfterViewInit, ElementRef } from '@angular/core';
declare const mermaid: any;


@Component({
  selector: 'app-mermaid',
  standalone: true,
  imports: [],
  templateUrl: './mermaid.component.html',
  styleUrl: './mermaid.component.css'
})
export class MermaidComponent implements AfterViewInit{
  constructor(private elementRef: ElementRef) {}
  
  ngAfterViewInit(): void {
    const diagramDefinition = `
    sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?;
    Bob-->>Alice: I am good thanks! click bob_message call onBobMessageClick;
    Note right of Bob: Bob thinks;
    Bob->>John: How about you John?;
    John-->>Bob: I am great!;

    classDef bob_message fill:#f96,stroke:#333,stroke-width:2px;
    `;

    mermaid.initialize({ startOnLoad: true, logLevel: 1, SecurityLevel: "snoop"});

    // const diagramContainer = this.elementRef.nativeElement.querySelector('#mermaid-diagram');
    // mermaid.render('mermaidSvgId', diagramDefinition, (svgCode: string) => {
    //   diagramContainer.innerHTML = svgCode;
    //   this.addClickEvents();
    // });
  }

  // addClickEvents() {
  //   const message = this.elementRef.nativeElement.querySelector('#mermaid-diagram svg .messageLine');
  //   if (message) {
  //     message.style.cursor = 'pointer';
  //     message.addEventListener('click', () => this.onMessageClick());
  //   }
  // }

  // onMessageClick() {
  //   console.log('Message clicked');
  //   // Implement further logic here, e.g., navigating to another page or displaying additional information
  // }

}
