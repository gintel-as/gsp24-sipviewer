import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as go from 'gojs';

@Component({
  selector: 'app-go',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './go.component.html',
  styleUrl: './go.component.css'
})
export class GoComponent implements OnInit {

  @ViewChild('diagramRef', { static: true }) diagramRef!: ElementRef<HTMLDivElement>;
  private diagram: go.Diagram | null = null;

  ngOnInit(): void {
    this.initDiagram();
  }

  private initDiagram(): void {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, this.diagramRef.nativeElement, {
      initialContentAlignment: go.Spot.Center,
      layout: $(go.LayeredDigraphLayout, {
        columnSpacing: 10,
        layerSpacing: 50,
        direction: 90,  // Arrange nodes left to right
        layeringOption: go.LayeredDigraphLayout.LayerLongestPathSource  // Ensures messages are drawn from top to bottom
      })
    });

    // Define actor (node) and message (link) templates
    this.diagram.nodeTemplate = $(
      go.Node,
      'Auto',
      { locationSpot: go.Spot.Center },
      $(go.Shape, 'Rectangle', { fill: 'lightblue' }),
      $(go.TextBlock, { margin: 8 }, new go.Binding('text', 'key'))
    );

    this.diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5 },
      $(go.Shape, { strokeWidth: 2 }),
      $(go.Shape, { toArrow: 'Standard' }),
      $(go.TextBlock, { segmentIndex: -2, segmentFraction: 0.5, textAlign: 'center', font: '10pt sans-serif' }, new go.Binding('text', 'text'))
    );

    // Create sample nodes (actors) and links (messages)
    this.diagram.model = new go.GraphLinksModel([
      { key: 'Actor1' },
      { key: 'Actor2' },
      { key: 'Actor3' }
    ], [
      { from: 'Actor1', to: 'Actor2', text: 'Message 1' },
      { from: 'Actor2', to: 'Actor3', text: 'Message 2' }
    ]);
  }

  constructor() { }
}