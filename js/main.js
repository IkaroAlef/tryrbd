function createBlock(name, reliability, group) {
  var block = {
    Nome: name,
    Confiabilidade: reliability,
    category: "block",
    group: group,
  };
  return block;
}

function createKOutOfN() {
  var block = {};
  return block;
}

x0p.setDefault({
  buttonTextConfirm: "Confirmar",
  buttonTextCancel: "Cancelar",
});

var groupKeyCounter = 0;
function groupKey() {
  groupKeyCounter--;
  return groupKeyCounter;
}

var myDiagram = null;
function initDiagram() {
  var GO = go.GraphObject.make;
  myDiagram = GO(go.Diagram, "myDiagramDiv", {
    "undoManager.isEnabled": true,
    allowMove: true,
    layout: GO(ParallelLayout, { layerSpacing: 20 }),
  });

  var myModel = GO(go.GraphLinksModel);
  myModel.nodeDataArray = [
    { key: -1, isGroup: true },

    { key: "Inicio", category: "Split" },
    { key: "Fim", category: "Merge" },
    {
      key: "1",
      Nome: "Alpha",
      Confiabilidade: 0,
      category: "block",
      group: -1,
    },
  ];
  myModel.linkDataArray = [
    { from: "Inicio", to: -1 },
    { from: -1, to: "Fim" },
  ];

  myDiagram.model = myModel;

  var simpleTemplate = GO(
    go.Node,
    "Spot",
    { selectable: false },
    GO(go.TextBlock, new go.Binding("text", "key"), { margin: 5 })
  );

  var nodeTemplate = GO(
    go.Node,
    "Vertical",
    GO(go.TextBlock, { margin: 5 }), //used for equilibrate node height with the textblock of Nome
    GO(
      go.Panel,
      "Spot",
      GO(
        go.Shape,
        "RoundedRectangle",
        { portId: "" },
        { width: 80, height: 40 }
      ),

      GO(go.Shape, "LineH", {
        alignment: go.Spot.Left,
        alignmentFocus: go.Spot.Right,
        width: 20,
        height: 0,
      }),
      GO(go.Shape, "LineH", {
        alignment: go.Spot.Right,
        alignmentFocus: go.Spot.Left,
        width: 20,
        height: 0,
      })
    ),
    GO(go.TextBlock, { margin: 5 }, new go.Binding("text", "Nome"))
  );

  var kOutOfNTemplate = GO(
    go.Node,
    "Vertical",
    { locationSpot: go.Spot.Center },
    GO(go.Shape, "Circle", { portId: "" }, { width: 40, height: 40 }),
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
    { selectable: false, routing: go.Link.Orthogonal },
    GO(go.Shape)
  );

  myDiagram.groupTemplate = GO(
    go.Group,
    "Auto",
    {
      selectable: false,
      layout: GO(go.GridLayout, {
        wrappingColumn: 1,
        cellSize: new go.Size(1, 1),
      }),
    },
    GO(go.Shape, { fill: "transparent" }), // draws vertical segments as if links connecting each node
    GO(go.Placeholder, { padding: new go.Margin(-44, 0, -44, 0) }) // half the node height
  );

  myDiagram.addDiagramListener("ChangedSelection", hideInspector);

  nodeTemplate.contextMenu = GO(
    "ContextMenu",
    GO("ContextMenuButton", GO(go.TextBlock, "Adicionar Bloco em série"), {
      click: function (e, obj) {
        let location = obj.part.location.copy();
        let partData = obj.part.data;
        x0p({
          title: "Quantos blocos?",
          type: "warning",
          inputType: "text",
          inputPlaceholder: "Digite um número maior que 0",
          inputColor: "#F29F3F",
          inputPromise: function (button, value) {
            var p = new Promise(function (resolve, reject) {
              if (value == "" || isNaN(value) || value <= 0)
                resolve("Digite um número maior que 0.");
              resolve(null);
            });
            return p;
          },
        }).then(handleUserPrompt.bind(null, e, partData, location, "serie"));
      },
    }),
    GO("ContextMenuButton", GO(go.TextBlock, "Adicionar Bloco em paralelo"), {
      click: function (e, obj) {
        let location = obj.part.location.copy();
        let partData = obj.part.data;
        x0p({
          title: "Quantos blocos?",
          type: "warning",
          inputType: "text",
          inputPlaceholder: "Digite um número maior que 0",
          inputColor: "#F29F3F",
          inputPromise: function (button, value) {
            var p = new Promise(function (resolve, reject) {
              if (value == "" || isNaN(value) || value <= 0)
                resolve("Digite um número maior que 0.");
              resolve(null);
            });
            return p;
          },
        }).then(handleUserPrompt.bind(null, e, partData, location, "parallel"));
      },
    }),
    GO("ContextMenuButton", GO(go.TextBlock, "Adicionar Bloco K-out-of-n"), {
      click: function (e, obj) {
        let location = obj.part.location.copy();
        let partData = obj.part.data;
        x0p({
          title: "Quantos blocos?",
          type: "warning",
          inputType: "text",
          inputPlaceholder: "Digite um número maior que 0",
          inputColor: "#F29F3F",
          inputPromise: function (button, value) {
            var p = new Promise(function (resolve, reject) {
              if (value == "" || isNaN(value) || value <= 0)
                resolve("Digite um número maior que 0.");
              resolve(null);
            });
            return p;
          },
        }).then(handleUserPrompt.bind(null, e, partData, location, "koutofn"));
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
  templMap.add("block", nodeTemplate);
  templMap.add("kOutOfN", kOutOfNTemplate);

  myDiagram.nodeTemplateMap = templMap;

  myDiagram.nodeTemplateMap.add(
    "Split",
    GO(
      go.Node,
      "Auto",
      { locationSpot: go.Spot.Center },
      GO(go.Shape, "Diamond", {
        fill: "deepskyblue",
        stroke: null,
        strokeWidth: 0,
        desiredSize: new go.Size(28, 28),
      }),
      GO(go.TextBlock, new go.Binding("text"))
    )
  );

  myDiagram.nodeTemplateMap.add(
    "Merge",
    GO(
      go.Node,
      "Auto",
      { locationSpot: go.Spot.Center },
      GO(go.Shape, "Circle", {
        fill: "deepskyblue",
        stroke: null,
        strokeWidth: 0,
        desiredSize: new go.Size(28, 28),
      }),
      GO(go.TextBlock, new go.Binding("text"))
    )
  );

  $(function () {
    $("#paletteDraggable")
      .draggable({ handle: "#paletteDraggableHandle" })
      .resizable({
        stop: function () {
          myPalette.layoutDiagram(true);
        },
      });

    $("#infoDraggable").draggable({ handle: "#infoDraggableHandle" });

    var inspector = new Inspector("DataInspector", myDiagram, {
      properties: {
        key: { show: false },
        category: { show: false },
        group: { show: true },
        // fill and stroke would be automatically added for nodes, but we want to declare it a color also:

        fill: { show: Inspector.showIfPresent, type: "color" },
        stroke: { show: Inspector.showIfPresent, type: "color" },
      },
    });
  });
}
// end initDiagram

function addNodeAndLink(e, obj, location, type, qtd) {
  var model = myDiagram.model;
  var fromData = obj;
  switch (type) {
    case "serie":
      let selectedGroup = fromData.group;
      let lastAddedGroup;
      let nextGroupKeyFromSelected;
      let currentGroup = fromData.group;

      var itFrom = myDiagram.findLinksByExample({ from: selectedGroup });
      while (itFrom.next()) {
        //console.log(itFrom.value);
        nextGroupKeyFromSelected = itFrom.value.data.to;
      }
      //console.log(nextGroupKeyFromSelected);

      for (var i = 0; i < qtd; i++) {
        console.log("currentGroup");
        console.log(currentGroup);
        const localGroupKey = groupKey() - 1;
        lastAddedGroup = localGroupKey;

        //console.log(localGroupKey);
        var groupData = { key: localGroupKey, isGroup: true }; //group for new block
        //console.log(groupData);

        myDiagram.startTransaction("addGroup");
        model.addNodeData(groupData);
        // model.set(fromData, "group", localGroupKey);

        var linkdata = {
          from: currentGroup, //previous group
          to: localGroupKey, //model.getKeyForNodeData(toData),
        };

        //console.log(linkdata);
        model.addLinkData(linkdata);
        //model.addLinkData(linknext);

        //var node = myDiagram.findNodeForData(fromData);
        //myDiagram.removeParts(node.findLinksConnected());

        var toData = createBlock("Bloco", 0, localGroupKey);
        model.addNodeData(toData);

        //var nextNodeKey;
        //var it = myDiagram.findLinksByExample({ from: fromData.key });
        //var addedLink = false;
        /*while (it.next()) {
          nextNodeKey = it.value.data.to;
          model.removeLinkData(it.value.data);

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
        } */
        currentGroup = localGroupKey;
        myDiagram.commitTransaction("addGroup");
      }

      myDiagram.startTransaction("linkLast");

      var oldLink = {
        //used for delete oldLink on the selected after add in series
        from: selectedGroup,
        to: nextGroupKeyFromSelected,
      };
      myDiagram.removeParts(myDiagram.findLinksByExample(oldLink));

      var linkLast = {
        from: lastAddedGroup, //model.getKeyForNodeData(toData),
        to: nextGroupKeyFromSelected,
      };

      model.addLinkData(linkLast);

      myDiagram.commitTransaction("linkLast");

      console.log(model.linkDataArray);
      break;

    case "parallel":
      const localGroupKey = fromData.group;
      //var groupData = { key: localGroupKey, isGroup: true }; //group for new parallel blocks
      //console.log(groupData);

      myDiagram.startTransaction("addGroup");
      //model.addNodeData(groupData);
      //model.set(fromData, "group", localGroupKey);

      var nextNodeKey;
      var prevNodeKey;
      var itFrom = myDiagram.findLinksByExample({ from: fromData.key });
      var itTo = myDiagram.findLinksByExample({ to: fromData.key });

      while (itFrom.next()) nextNodeKey = itFrom.value.data.to;

      while (itTo.next()) prevNodeKey = itTo.value.data.from;

      var linkdata = {
        from: prevNodeKey,
        to: localGroupKey, //model.getKeyForNodeData(toData),
      };
      var linknext = {
        from: localGroupKey, //model.getKeyForNodeData(toData),
        to: nextNodeKey,
      };
      model.addLinkData(linkdata);
      model.addLinkData(linknext);

      var node = myDiagram.findNodeForData(fromData);
      myDiagram.removeParts(node.findLinksConnected());
      myDiagram.commitTransaction("addGroup");

      for (var i = 0; i < qtd; i++) {
        myDiagram.startTransaction("addParallel");

        var toData = createBlock("Bloco", 0, localGroupKey);
        //console.log(toData);

        model.addNodeData(toData);

        // select the new Node
        //var newnode = myDiagram.findNodeForData(toData);
        //myDiagram.select(newnode);
        myDiagram.commitTransaction("addParallel");
      }
      break;

    case "koutofn":
      myDiagram.startTransaction("addKOutOfN");

      var toData = { category: "kOutOfN", K: 1, N: 2 };
      model.addNodeData(toData);

      var nextNodeKey;
      var it = myDiagram.findLinksByExample({ from: fromData.key });
      var addedLink = false;

      while (it.next()) {
        nextNodeKey = it.value.data.to;
        model.removeLinkData(it.value.data);

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

function handleUserPrompt(e, obj, location, type, data) {
  // o parametro data vem da promise onde a função é chamada
  // ele é usado para recuperar dados do prompt ao usuário
  // TODO incluir data.text que é
  if (data.button === "warning") {
    qtd = parseInt(data.text);
    addNodeAndLink(e, obj, location, type, qtd);
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
