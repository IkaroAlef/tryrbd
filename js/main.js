var myDiagram = null;
function initDiagram() {
  var GO = go.GraphObject.make;
  myDiagram = GO(go.Diagram, "myDiagramDiv", {
    "undoManager.isEnabled": true,
  });

  // This is the actual HTML context menu:
  var cxElement = document.getElementById("contextMenu");

  // Since we have only one main element, we don't have to declare a hide method,
  // we can set mainElement and GoJS will hide it automatically
  var myContextMenu = GO(go.HTMLInfo, {
    show: showContextMenu,
    hide: hideContextMenu,
  });

  var myModel = GO(go.GraphLinksModel);
  myModel.nodeDataArray = [
    { key: "Inicio", category: "simple" },
    { key: "Fim", category: "simple" },
    { key: "Alpha", reliability: 0 },
    { key: "Beta", reliability: 0 },
    { key: "Gamma", reliability: 0 },
    { key: "India", reliability: 0 },
    { key: "Zeta", reliability: 0 },
  ];
  myModel.linkDataArray = [
    { from: "Inicio", to: "Alpha" },
    { from: "Alpha", to: "Beta" },
    { from: "Beta", to: "Gamma" },
    { from: "Beta", to: "India" },
    { from: "India", to: "Zeta" },
    { from: "Gamma", to: "Zeta" },
    { from: "Zeta", to: "Fim" },
  ];

  myDiagram.layout = GO(go.TreeLayout, { layerSpacing: 35 });
  myDiagram.model = myModel;
  myDiagram.contextMenu = myContextMenu;

  var blockTemplate = GO(
    go.Node,
    "Vertical",
    { locationSpot: go.Spot.Center, contextMenu: myContextMenu },
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
      new go.Binding("text", "key")
    )
  );

  var simpletemplate = GO(
    go.Node,
    "Auto",
    GO(go.TextBlock, new go.Binding("text", "key"))
  );

  var templMap = new go.Map();
  templMap.add("simple", simpletemplate);
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

  function hideCX() {
    if (myDiagram.currentTool instanceof go.ContextMenuTool) {
      myDiagram.currentTool.doCancel();
    }
  }

  function showContextMenu(obj, diagram, tool) {
    // Show only the relevant buttons given the current state.
    var cmd = diagram.commandHandler;
    var hasMenuItem = false;
    function maybeShowItem(elt, pred) {
      if (pred) {
        elt.style.display = "block";
        hasMenuItem = true;
      } else {
        elt.style.display = "none";
      }
    }
    maybeShowItem(document.getElementById("cut"), cmd.canCutSelection());
    maybeShowItem(document.getElementById("copy"), cmd.canCopySelection());
    maybeShowItem(
      document.getElementById("paste"),
      cmd.canPasteSelection(diagram.toolManager.contextMenuTool.mouseDownPoint)
    );
    maybeShowItem(document.getElementById("delete"), cmd.canDeleteSelection());
    maybeShowItem(document.getElementById("color"), obj !== null);

    // Now show the whole context menu element
    if (hasMenuItem) {
      cxElement.classList.add("show-menu");
      // we don't bother overriding positionContextMenu, we just do it here:
      var mousePt = diagram.lastInput.viewPoint;
      cxElement.style.left = mousePt.x + 5 + "px";
      cxElement.style.top = mousePt.y + "px";
    }

    // Optional: Use a `window` click listener with event capture to
    //           remove the context menu if the user clicks elsewhere on the page
    window.addEventListener("click", hideCX, true);
  }

  function hideContextMenu() {
    cxElement.classList.remove("show-menu");
    // Optional: Use a `window` click listener with event capture to
    //           remove the context menu if the user clicks elsewhere on the page
    window.removeEventListener("click", hideCX, true);
  }
}

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
    case "add": {
      addNodeAndLink(diagram);
      break;
    }
  }
  diagram.currentTool.stopTool();
}

function addNodeAndLink(type) {
  var model = myDiagram.model;
  switch (type) {
    case "serie":
      myDiagram.startTransaction("addSerie");
      newBlock = { reliability: 0 };
      model.addNodeData(newBlock);
      myDiagram.commitTransaction("addSerie");

      break;
    case "paralel":
      console.log("paralel", diagram.selection);
      break;
  }
  /*var fromNode = obj.part;
  var diagram = myDiagram;
  diagram.startTransaction("Add State");
  // get the node data for which the user clicked the button
  var fromData = fromNode.data;
  // create a new "State" data object, positioned off to the right of the fromNode
  var p = fromNode.location.copy();
  p.x += diagram.toolManager.draggingTool.gridSnapCellSize.width;
  var toData = {
    text: "new",
    loc: go.Point.stringify(p),
  };
  // add the new node data to the model
  var model = diagram.model;
  model.addNodeData(toData);
  // create a link data from the old node data to the new node data
  var linkdata = {
    from: model.getKeyForNodeData(fromData),
    to: model.getKeyForNodeData(toData),
  };
  // and add the link data to the model
  model.addLinkData(linkdata);
  // select the new Node
  var newnode = diagram.findNodeForData(toData);
  diagram.select(newnode);
  // snap the new node to a valid location
  newnode.location = diagram.toolManager.draggingTool.computeMove(newnode, p);
  // then account for any overlap
  shiftNodesToEmptySpaces();
  diagram.commitTransaction("Add State"); */
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
