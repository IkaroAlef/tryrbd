var myDiagram = null;
function initDiagram() {
  var GO = go.GraphObject.make;
  myDiagram = GO(go.Diagram, "myDiagramDiv", {
    "undoManager.isEnabled": true,
  });

  // This is the actual HTML context menu:
  var cxElement = document.getElementById("contextMenu");

  var myModel = GO(go.GraphLinksModel);
  myModel.nodeDataArray = [
    { key: "Inicio", category: "simple" },
    { key: "Fim", category: "simple" },
    { key: "1", text: "Alpha", reliability: 0 },
  ];
  myModel.linkDataArray = [
    { from: "Inicio", to: "1" },
    { from: "1", to: "Fim" },
  ];

  myDiagram.layout = GO(go.TreeLayout, { layerSpacing: 35 });
  myDiagram.model = myModel;

  var blockTemplate = GO(
    go.Node,
    "Vertical",
    { locationSpot: go.Spot.Center },
    new go.Binding("location", "loc"),
    GO(
      go.Shape,
      "RoundedRectangle",
      { width: 80, height: 40 },
      new go.Binding("figure", "fig"),
      new go.Binding("fill", "color")
    ),
    GO(
      go.TextBlock,
      "default text",
      { margin: 5 },
      new go.Binding("text", "text")
    )
  );

  myDiagram.linkTemplate = GO(
    go.Link,
    { routing: go.Link.AvoidsNodes, corner: 10 }, // rounded corners
    GO(go.Shape),
    GO(go.Shape, { toArrow: "Standard" })
  );

  blockTemplate.contextMenu = GO(
    "ContextMenu",
    GO("ContextMenuButton", GO(go.TextBlock, "Adicionar Bloco em série"), {
      click: function (e, obj) {
        addNodeAndLink(e, obj, "serie");
      },
    }),
    GO("ContextMenuButton", GO(go.TextBlock, "Adicionar Bloco em paralelo"), {
      click: function (e, obj) {
        addNodeAndLink(e, obj, "paralel");
      },
    }),
    GO("ContextMenuButton", GO(go.TextBlock, "Copiar"), {
      click: function (e, obj) {
        e.diagram.commandHandler.copySelection();
      },
    }),
    GO("ContextMenuButton", GO(go.TextBlock, "Colar"), {
      click: function (e, obj) {
        e.diagram.commandHandler.pasteSelection(
          e.diagram.toolManager.contextMenuTool.mouseDownPoint
        );
      },
    }),
    GO("ContextMenuButton", GO(go.TextBlock, "Cortar"), {
      click: function (e, obj) {
        e.diagram.commandHandler.cutSelection();
      },
    }),
    GO(
      "ContextMenuButton",
      GO(go.TextBlock, "Delete"),
      {
        click: function (e, obj) {
          e.diagram.commandHandler.deleteSelection();
        },
      },
      new go.Binding("visible", "", function (o) {
        return o.diagram && o.diagram.commandHandler.canDeleteSelection();
      }).ofObject()
    )
  );

  var simpleTemplate = GO(
    go.Node,
    "Auto",
    GO(go.TextBlock, new go.Binding("text", "key"))
  );

  var templMap = new go.Map();

  templMap.add("simple", simpleTemplate);
  templMap.add("", blockTemplate);

  myDiagram.nodeTemplateMap = templMap;

  $(function () {
    $("#paletteDraggable")
      .draggable({ handle: "#paletteDraggableHandle" })
      .resizable({
        // After resizing, perform another layout to fit everything in the palette's viewport
        stop: function () {
          myPalette.layoutDiagram(true);
        },
      });

    $("#infoDraggable").draggable({ handle: "#infoDraggableHandle" });

    var inspector = new Inspector("myInfo", myDiagram, {
      properties: {
        // key would be automatically added for nodes, but we want to declare it read-only also:
        key: { readOnly: true, show: Inspector.showIfPresent },
        // fill and stroke would be automatically added for nodes, but we want to declare it a color also:
        fill: { show: Inspector.showIfPresent, type: "color" },
        stroke: { show: Inspector.showIfPresent, type: "color" },
      },
    });
  });

  // We don't want the div acting as a context menu to have a (browser) context menu!
  cxElement.addEventListener(
    "contextmenu",
    function (e) {
      e.preventDefault();
      return false;
    },
    false
  );
}
// end initDiagram

// This is the general menu command handler, parameterized by the name of the command.
function cxcommand(event, val) {
  if (val === undefined) val = event.currentTarget.id;
  var diagram = myDiagram;
  switch (val) {
    case "cut":
      diagram.commandHandler.cutSelection();
      break;
    case "copy":
      diagram.commandHandler.copySelection();
      break;
    case "paste":
      diagram.commandHandler.pasteSelection(
        diagram.toolManager.contextMenuTool.mouseDownPoint
      );
      break;
    case "delete":
      diagram.commandHandler.deleteSelection();
      break;
    case "color": {
      var color = window.getComputedStyle(event.target)["background-color"];
      changeColor(diagram, color);
      break;
    }
  }
  diagram.currentTool.stopTool();
}

function addNodeAndLink(e, obj, type) {
  var model = myDiagram.model;
  var fromNode = obj.part;
  var fromData = fromNode.data;
  switch (type) {
    case "serie":
      myDiagram.startTransaction("addSerie");

      var p = fromNode.location.copy();
      p.x += myDiagram.toolManager.draggingTool.gridSnapCellSize.width;
      var toData = {
        text: "Bloco",
        reliability: 0,
        loc: go.Point.stringify(p),
      };
      model.addNodeData(toData);

      var nextNodeKey;
      var it = myDiagram.findLinksByExample({ from: fromNode.key });
      while (it.next()) {
        nextNodeKey = it.value.data.to;
        model.removeLinkData(it.value.data);
      }
      //console.log(fromNode.key);

      var linkdata = {
        from: model.getKeyForNodeData(fromData),
        to: model.getKeyForNodeData(toData),
      };
      var linknext = {
        from: model.getKeyForNodeData(toData),
        to: nextNodeKey,
      };
      model.addLinkData(linkdata);
      model.addLinkData(linknext);
      // select the new Node
      var newnode = myDiagram.findNodeForData(toData);
      myDiagram.select(newnode);
      // snap the new node to a valid location
      newnode.location = myDiagram.toolManager.draggingTool.computeMove(
        newnode,
        p
      );
      myDiagram.commitTransaction("addSerie");

      break;

    case "paralel":
      myDiagram.startTransaction("addSerie");

      var p = fromNode.location.copy();
      p.x += myDiagram.toolManager.draggingTool.gridSnapCellSize.width;
      var toData = {
        text: "Bloco",
        reliability: 0,
        loc: go.Point.stringify(p),
      };
      model.addNodeData(toData);

      var nextNodeKey;
      var prevNodeKey;
      var itFrom = myDiagram.findLinksByExample({ from: fromNode.key });
      var itTo = myDiagram.findLinksByExample({ to: fromNode.key });

      while (itFrom.next()) nextNodeKey = itFrom.value.data.to;

      while (itTo.next()) prevNodeKey = itTo.value.data.from;
      //console.log(fromNode.key);

      var linkdata = {
        from: prevNodeKey,
        to: model.getKeyForNodeData(toData),
      };
      var linknext = {
        from: model.getKeyForNodeData(toData),
        to: nextNodeKey,
      };
      model.addLinkData(linkdata);
      model.addLinkData(linknext);

      // select the new Node
      var newnode = myDiagram.findNodeForData(toData);
      myDiagram.select(newnode);
      // snap the new node to a valid location
      newnode.location = myDiagram.toolManager.draggingTool.computeMove(
        newnode,
        p
      );
      // then account for any overlap
      //shiftNodesToEmptySpaces();
      myDiagram.commitTransaction("addSerie");
      break;
  }
}

// A custom command, for changing the color of the selected node(s).
function changeColor(diagram, color) {
  // Always make changes in a transaction, except when initializing the diagram.
  diagram.startTransaction("change color");
  diagram.selection.each(function (node) {
    if (node instanceof go.Node) {
      // ignore any selected Links and simple Parts
      // Examine and modify the data, not the Node directly.
      var data = node.data;
      // Call setDataProperty to support undo/redo as well as
      // automatically evaluating any relevant bindings.
      diagram.model.setDataProperty(data, "color", color);
    }
  });
  diagram.commitTransaction("change color");
}
