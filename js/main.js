function createBlock(name, reliability) {
  var block = { Nome: name, Confiabilidade: reliability };
  return block;
}

var myDiagram = null;
function initDiagram() {
  var GO = go.GraphObject.make;
  myDiagram = GO(go.Diagram, "myDiagramDiv", {
    "undoManager.isEnabled": true,
    allowMove: false,
    layout: GO(go.TreeLayout, {
      layerSpacing: 35,
      alignment: go.TreeLayout.AlignmentCenterChildren,
      compaction: go.TreeLayout.CompactionNone,
    }),
  });

  var myModel = GO(go.GraphLinksModel);
  myModel.nodeDataArray = [
    { key: "Inicio", category: "simple" },
    { key: "Fim", category: "simple" },
    { key: "1", Nome: "Alpha", Confiabilidade: 0 },
  ];
  myModel.linkDataArray = [
    { from: "Inicio", to: "1" },
    { from: "1", to: "Fim" },
  ];

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
      new go.Binding("text", "Nome")
    )
  );

  myDiagram.linkTemplate = GO(
    go.Link,
    { routing: go.Link.AvoidsNodes, corner: 10 }, // rounded corners
    GO(go.Shape),
    GO(go.Shape, { toArrow: "Standard" })
  );

  myDiagram.addDiagramListener("ChangedSelection", hideInspector);

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

    var inspector = new Inspector("DataInspector", myDiagram, {
      properties: {
        // key would be automatically added for nodes, but we want to declare it read-only also:
        key: { readOnly: true, show: false },
        // fill and stroke would be automatically added for nodes, but we want to declare it a color also:

        fill: { show: Inspector.showIfPresent, type: "color" },
        stroke: { show: Inspector.showIfPresent, type: "color" },
      },
    });
  });
}
// end initDiagram

function addNodeAndLink(e, obj, type) {
  var model = myDiagram.model;
  var fromNode = obj.part;
  var fromData = fromNode.data;
  switch (type) {
    case "serie":
      myDiagram.startTransaction("addSerie");

      var p = fromNode.location.copy();
      p.x += myDiagram.toolManager.draggingTool.gridSnapCellSize.width;
      var toData = createBlock("Bloco", 0);
      model.addNodeData(toData);

      var nextNodeKey;
      var it = myDiagram.findLinksByExample({ from: fromNode.key });
      var addedLink = false;
      console.log(it.count);
      while (it.next()) {
        console.log(it.value.data);
        nextNodeKey = it.value.data.to;
        model.removeLinkData(it.value.data);

        //console.log(fromNode.key);

        var linkdata = {
          from: model.getKeyForNodeData(fromData),
          to: model.getKeyForNodeData(toData),
        };
        var linknext = {
          from: model.getKeyForNodeData(toData),
          to: nextNodeKey,
        };
        if (!addedLink) {
          //evitar linkar duas vezes quando o proximo link é em paralelo
          model.addLinkData(linkdata);
          addedLink = true;
        }
        model.addLinkData(linknext);
      }
      myDiagram.commitTransaction("addSerie");

      break;

    case "paralel":
      myDiagram.startTransaction("addSerie");

      var p = fromNode.location.copy();
      p.x += myDiagram.toolManager.draggingTool.gridSnapCellSize.width;
      var toData = createBlock("Bloco", 0);
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

function hideInspector(e) {
  var sel = myDiagram.selection.first();
  if (sel == null || sel.data.category == "simple") {
    document.getElementById("infoDraggable").style.visibility = "hidden";
  } else {
    document.getElementById("infoDraggable").style.visibility = "visible";
  }
}

function calcReliability() {
  myDiagram.clearSelection();
  var totalReliability = 1;
  myDiagram.nodes.each(function (n) {
    //if (n.data.text ... && n.data.key ...) { ... do something ... }

    if (n.data.category != "simple") {
      totalReliability *= n.data.Confiabilidade;
    }
  });
  totalReliability = totalReliability / 100;
  console.log("total= ", totalReliability, "%");
}
