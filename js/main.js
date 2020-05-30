function initDiagram() {
  var GO = go.GraphObject.make;
  var myDiagram = GO(go.Diagram, "myDiagramDiv", {
    "undoManager.isEnabled": true,
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

  var blockTemplate = GO(
    go.Node,
    "Vertical",
    { locationSpot: go.Spot.Center },
    new go.Binding("location", "loc"),
    GO(
      go.Shape,
      "RoundedRectangle",
      { width: 80, height: 40 },
      new go.Binding("figure", "fig")
    ),
    GO(
      go.TextBlock,
      "default text",
      {
        /* set TextBlock properties here */
      },
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
}
