function createBlock(name, reliability) {
  var block = { Nome: name, Confiabilidade: reliability, category: "block" };
  return block;
}

function createKOutOfN() {
  var block = {};
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
      //layeringOption: go.LayeredDigraphLayout.LayerLongestPathSource,
    }),
  });

  var myModel = GO(go.GraphLinksModel);
  myModel.nodeDataArray = [
    { key: "Inicio", category: "simple" },
    { key: "Fim", category: "simple" },
    { key: "1", Nome: "Alpha", Confiabilidade: 0, category: "block" },
  ];
  myModel.linkDataArray = [
    { from: "Inicio", to: "1" },
    { from: "1", to: "Fim" },
  ];

  myDiagram.model = myModel;

  var simpleTemplate = GO(
    go.Node,
    "Vertical",
    GO(
      go.Panel,
      "Auto",
      GO(
        go.Shape,
        "RoundedRectangle",
        {
          fill: "transparent",
          stroke: "transparent",
          portId: "",
          fromSpot: go.Spot.Right, // port properties go on the port!
          toSpot: go.Spot.Left,
        },
        { width: 50, height: 40 }
      ),
      GO(go.TextBlock, new go.Binding("text", "key"))
    ),
    GO(go.TextBlock, { margin: 4 })
  );

  var blockTemplate = GO(
    go.Node,
    "Vertical",
    { locationSpot: go.Spot.Center },
    GO(
      go.Shape,
      "RoundedRectangle",
      {
        portId: "",
        fromSpot: go.Spot.Right, // port properties go on the port!
        toSpot: go.Spot.Left,
      },
      { width: 80, height: 40 }
    ),
    GO(go.TextBlock, { margin: 4 }, new go.Binding("text", "Nome"))
  );

  var kOutOfNTemplate = GO(
    go.Node,
    "Vertical",
    { locationSpot: go.Spot.Center },
    GO(
      go.Shape,
      "Circle",
      {
        portId: "",
        fromSpot: go.Spot.Right, // port properties go on the port!
        toSpot: go.Spot.Left,
      },

      { width: 40, height: 40 }
    ),
    GO(
      go.TextBlock,
      { margin: 4 },
      new go.Binding("text", "", function (data) {
        return data.K + "/" + data.N;
      })
    )
  );

  myDiagram.toolManager.draggingTool.gridSnapCellSize = new go.Size(20, 20);

  myDiagram.linkTemplate = GO(
    go.Link,
    {
      fromSpot: go.Spot.Right,
      toSpot: go.Spot.Left,
      routing: go.Link.AvoidsNodes,
    }, // rounded corners
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
    GO("ContextMenuButton", GO(go.TextBlock, "Adicionar Bloco K-out-of-n"), {
      click: function (e, obj) {
        addNodeAndLink(e, obj, "koutofn");
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
      new go.Binding("visible", "true", function (o) {
        return o.diagram && o.diagram.commandHandler.canDeleteSelection();
      }).ofObject()
    )
  );

  var templMap = new go.Map();

  templMap.add("simple", simpleTemplate);
  templMap.add("block", blockTemplate);
  templMap.add("kOutOfN", kOutOfNTemplate);

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
        category: { readOnly: true, show: false },
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
      //console.log(it.count);
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

    case "koutofn":
      myDiagram.startTransaction("addKOutOfN");

      var toData = { category: "kOutOfN", K: 1, N: 2 };
      model.addNodeData(toData);

      var nextNodeKey;
      var it = myDiagram.findLinksByExample({ from: fromNode.key });
      var addedLink = false;

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

      myDiagram.commitTransaction("addKOutOfN");
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
