import * as React from 'react';

import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';

import './teste.css';

/**
 * Diagram initialization method, which is passed to the ReactDiagram component.
 * This method is responsible for making the diagram and initializing the model and any templates.
 * The model's data should not be set here,
 * as the ReactDiagram component handles that via the other props.
 */
function initDiagram() {
  const $ = go.GraphObject.make;
  const diagram = $(go.Diagram, {
    'undoManager.isEnabled': true, // must be set to allow for model change listening
    // 'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
    'clickCreatingTool.archetypeNodeData': {
      text: 'new node',
      color: 'lightblue',
    },
    model: $(go.GraphLinksModel, {
      linkKeyProperty: 'key', // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
    }),
  });

  $(() => {
    $('#infoDraggable').draggable({ handle: '#infoDraggableHandle' });

    const inspector = new go.Inspector('myInfo', diagram, {
      properties: {
        // key would be automatically added for nodes, but we want to declare it read-only also:
        key: { readOnly: true, show: go.Inspector.showIfPresent },
        // fill and stroke would be automatically added for nodes, but we want to declare it a color also:
        fill: { show: go.Inspector.showIfPresent, type: 'color' },
        stroke: { show: go.Inspector.showIfPresent, type: 'color' },
      },
    });
  });

  // On selection changed, make sure infoDraggable will resize as necessary
  diagram.addDiagramListener('ChangedSelection', (diagramEvent) => {
    const idrag = document.getElementById('infoDraggable');
    idrag.style.width = '';
    idrag.style.height = '';
  });

  // define a simple Node template
  diagram.nodeTemplate = $(
    go.Node,
    'Auto', // the Shape will go around the TextBlock
    new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(
      go.Point.stringify
    ),
    $(
      go.Shape,
      'RoundedRectangle',
      { name: 'SHAPE', fill: 'white', strokeWidth: 0 },
      // Shape.fill is bound to Node.data.color
      new go.Binding('fill', 'color')
    ),
    $(
      go.TextBlock,
      { margin: 8, editable: true }, // some room around the text
      new go.Binding('text').makeTwoWay()
    )
  );

  return diagram;
}

/**
 * This function handles any changes to the GoJS model.
 * It is here that you would make any updates to your React state, which is dicussed below.
 */
function handleModelChange(changes) {
  alert('GoJS model changed!');
}

// render function...
export default function Teste() {
  return (
    <div>
      ...
      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="diagram-component"
        nodeDataArray={[
          {
            key: 0,
            text: 'Alpha',
            color: 'lightblue',
            loc: '0 0',
          },
          {
            key: 1,
            text: 'Beta',
            color: 'orange',
            loc: '150 0',
          },
          {
            key: 2,
            text: 'Gamma',
            color: 'lightgreen',
            loc: '0 150',
          },
          {
            key: 3,
            text: 'Delta',
            color: 'pink',
            loc: '150 150',
          },
        ]}
        linkDataArray={[
          { key: -1, from: 0, to: 1 },
          { key: -2, from: 0, to: 2 },
          { key: -3, from: 1, to: 1 },
          { key: -4, from: 2, to: 3 },
          { key: -5, from: 3, to: 0 },
        ]}
        onModelChange={handleModelChange}
      />
      <div
        id="infoDraggable"
        className="draggable"
        style={{
          display: 'inlineBlock',
          verticalAlign: 'top',
          padding: 5,
          top: 20,
          left: 380,
        }}
      >
        <div id="infoDraggableHandle" className="handle">
          Info
        </div>
        <div>
          <div id="myInfo" />
        </div>
      </div>
    </div>
  );
}