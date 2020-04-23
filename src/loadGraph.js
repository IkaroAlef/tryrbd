import {
  mxGraph,
  mxConstants,
  mxConnectionHandler,
  mxGraphModel,
  mxDivResizer,
  mxStackLayout,
  mxSwimlane,
  mxRectangle,
  mxEditor,
  mxClient,
  mxImage,
  mxCell,
  mxOutline,
  mxEffects,
  mxEdgeStyle,
  mxPerimeter,
  mxGeometry,
  mxUtils,
  mxCodec,
  mxWindow,
  mxForm,
  mxEvent,
} from 'mxgraph-js';

import './common.css';

export default function loadGraph(
  container,
  outline,
  toolbar,
  sidebar,
  status,
) {
  // Checks if the browser is supported
  if (!mxClient.isBrowserSupported()) {
    // Displays an error message if the browser is not supported.
    mxUtils.error('Browser is not supported!', 200, false);
  } else {
    // Specifies shadow opacity, color and offset
    mxConstants.SHADOW_OPACITY = 0.5;
    mxConstants.SHADOWCOLOR = '#C0C0C0';
    mxConstants.SHADOW_OFFSET_X = 5;
    mxConstants.SHADOW_OFFSET_Y = 6;

    // Table icon dimensions and position
    mxSwimlane.prototype.imageSize = 20;
    mxSwimlane.prototype.imageDx = 16;
    mxSwimlane.prototype.imageDy = 4;

    // Changes swimlane icon bounds
    mxSwimlane.prototype.getImageBounds = function (x, y, w, h) {
      return new mxRectangle(
        x + this.imageDx,
        y + this.imageDy,
        this.imageSize,
        this.imageSize,
      );
    };

    // Defines an icon for creating new connections in the connection handler.
    // This will automatically disable the highlighting of the source vertex.
    mxConnectionHandler.prototype.connectImage = new mxImage(
      'images/connector.gif',
      16,
      16,
    );

    // Prefetches all images that appear in colums
    // to avoid problems with the auto-layout
    const keyImage = new Image();
    keyImage.src = 'images/key.png';

    const plusImage = new Image();
    plusImage.src = 'images/plus.png';

    const checkImage = new Image();
    checkImage.src = 'images/check.png';

    // Workaround for Internet Explorer ignoring certain CSS directives
    if (mxClient.IS_QUIRKS) {
      document.body.style.overflow = 'hidden';
      new mxDivResizer(container);
      new mxDivResizer(outline);
      new mxDivResizer(toolbar);
      new mxDivResizer(sidebar);
      new mxDivResizer(status);
    }

    // Creates the graph inside the given container. The
    // editor is used to create certain functionality for the
    // graph, such as the rubberband selection, but most parts
    // of the UI are custom in this example.
    const editor = new mxEditor();
    const { graph } = editor;
    const { model } = graph;

    // Disables some global features
    graph.setConnectable(true);
    graph.setCellsDisconnectable(false);
    graph.setCellsCloneable(false);
    graph.swimlaneNesting = false;
    graph.dropEnabled = true;

    // Does not allow dangling edges
    graph.setAllowDanglingEdges(false);

    // Forces use of default edge in mxConnectionHandler
    graph.connectionHandler.factoryMethod = null;

    // Only tables are resizable
    graph.isCellResizable = function (cell) {
      return this.isSwimlane(cell);
    };

    // Only tables are movable
    graph.isCellMovable = function (cell) {
      return this.isSwimlane(cell);
    };

    // Sets the graph container and configures the editor
    editor.setGraphContainer(container);
    const config = mxUtils
      .load('editors/config/keyhandler-minimal.xml')
      .getDocumentElement();
    editor.configure(config);

    // Configures the automatic layout for the table columns
    editor.layoutSwimlanes = true;
    editor.createSwimlaneLayout = function () {
      const layout = new mxStackLayout(this.graph, false);
      layout.fill = true;
      layout.resizeParent = true;

      // Overrides the function to always return true
      layout.isVertexMovable = function (cell) {
        return true;
      };

      return layout;
    };

    // Text label changes will go into the name field of the user object
    graph.model.valueForCellChanged = function (cell, value) {
      if (value.name != null) {
        return mxGraphModel.prototype.valueForCellChanged.apply(
          this,
          arguments
        );
      }

      const old = cell.value.name;
      cell.value.name = value;
      return old;
    };

    // Columns are dynamically created HTML labels
    graph.isHtmlLabel = function (cell) {
      return !this.isSwimlane(cell) && !this.model.isEdge(cell);
    };

    // Edges are not editable
    graph.isCellEditable = function (cell) {
      return !this.model.isEdge(cell);
    };

    // Returns the name field of the user object for the label
    graph.convertValueToString = function (cell) {
      if (cell.value != null && cell.value.name != null) {
        return cell.value.name;
      }

      return mxGraph.prototype.convertValueToString.apply(this, arguments); // "supercall"
    };

    // Returns the type as the tooltip for column cells
    graph.getTooltip = function (state) {
      if (this.isHtmlLabel(state.cell)) {
        return `Type: ${state.cell.value.type}`;
      }
      if (this.model.isEdge(state.cell)) {
        const source = this.model.getTerminal(state.cell, true);
        const parent = this.model.getParent(source);

        return `${parent.value.name}.${source.value.name}`;
      }

      return mxGraph.prototype.getTooltip.apply(this, arguments); // "supercall"
    };

    // Creates a dynamic HTML label for column fields
    graph.getLabel = function (cell) {
      if (this.isHtmlLabel(cell)) {
        let label = '';

        if (cell.value.primaryKey) {
          label +=
            '<img title="Primary Key" src="images/key.png" width="16" height="16" align="top">&nbsp;';
        } else {
          label += '<img src="images/spacer.gif" width="16" height="1">&nbsp;';
        }

        if (cell.value.autoIncrement) {
          label +=
            '<img title="Auto Increment" src="images/plus.png" width="16" height="16" align="top">&nbsp;';
        } else if (cell.value.unique) {
          label
            += '<img title="Unique" src="images/check.png" width="16" height="16" align="top" alt=""/>&nbsp;';
        } else {
          label += '<img src="images/spacer.gif" width="16" height="1">&nbsp;';
        }

        return `${
          label + mxUtils.htmlEntities(cell.value.name, false)
        }: ${mxUtils.htmlEntities(cell.value.type, false)}`;
      }

      return mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
    };

    // Removes the source vertex if edges are removed
    graph.addListener(mxEvent.REMOVE_CELLS, function (sender, evt) {
      const cells = evt.getProperty('cells');

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        if (this.model.isEdge(cell)) {
          const terminal = this.model.getTerminal(cell, true);
          const parent = this.model.getParent(terminal);
          this.model.remove(terminal);
        }
      }
    });

    // Disables drag-and-drop into non-swimlanes.
    graph.isValidDropTarget = function (cell, cells, evt) {
      return this.isSwimlane(cell);
    };

    // Installs a popupmenu handler using local function (see below).
    graph.popupMenuHandler.factoryMethod = function (menu, cell, evt) {
      createPopupMenu(editor, graph, menu, cell, evt);
    };

    // Adds all required styles to the graph (see below)
    configureStylesheet(graph);

    // Adds sidebar icon for the table object
    const tableObject = new Table('TABLENAME');
    const table = new mxCell(
      tableObject,
      new mxGeometry(0, 0, 200, 28),
      'table',
    );

    table.setVertex(true);
    addSidebarIcon(graph, sidebar, table, 'images/icons48/table.png');

    // Adds sidebar icon for the column object
    const columnObject = new Column('COLUMNNAME');
    const column = new mxCell(columnObject, new mxGeometry(0, 0, 0, 26));

    column.setVertex(true);
    column.setConnectable(false);

    addSidebarIcon(graph, sidebar, column, 'images/icons48/column.png');

    // Adds primary key field into table
    const firstColumn = column.clone();

    firstColumn.value.name = 'TABLENAME_ID';
    firstColumn.value.type = 'INTEGER';
    firstColumn.value.primaryKey = true;
    firstColumn.value.autoIncrement = true;

    table.insert(firstColumn);

    // Adds child columns for new connections between tables
    graph.addEdge = function (edge, parent, source, target, index) {
      // Finds the primary key child of the target table
      let primaryKey = null;
      const childCount = this.model.getChildCount(target);

      for (let i = 0; i < childCount; i++) {
        const child = this.model.getChildAt(target, i);

        if (child.value.primaryKey) {
          primaryKey = child;
          break;
        }
      }

      if (primaryKey == null) {
        mxUtils.alert('Target table must have a primary key');
        return;
      }

      this.model.beginUpdate();
      try {
        const col1 = this.model.cloneCell(column);
        col1.value.name = primaryKey.value.name;
        col1.value.type = primaryKey.value.type;

        this.addCell(col1, source);
        source = col1;
        target = primaryKey;

        return mxGraph.prototype.addEdge.apply(this, arguments); // "supercall"
      } finally {
        this.model.endUpdate();
      }

      return null;
    };

    // Displays useful hints in a small semi-transparent box.
    const hints = document.createElement('div');
    hints.style.position = 'absolute';
    hints.style.overflow = 'hidden';
    hints.style.width = '230px';
    hints.style.bottom = '56px';
    hints.style.height = '86px';
    hints.style.right = '20px';

    hints.style.background = 'black';
    hints.style.color = 'white';
    hints.style.fontFamily = 'Arial';
    hints.style.fontSize = '10px';
    hints.style.padding = '4px';

    mxUtils.setOpacity(hints, 50);

    mxUtils.writeln(hints, '- Drag an image from the sidebar to the graph');
    mxUtils.writeln(hints, '- Doubleclick on a table or column to edit');
    mxUtils.writeln(hints, '- Shift- or Rightclick and drag for panning');
    mxUtils.writeln(hints, '- Move the mouse over a cell to see a tooltip');
    mxUtils.writeln(hints, '- Click and drag a table to move and connect');
    mxUtils.writeln(hints, '- Shift- or Rightclick to show a popup menu');
    document.body.appendChild(hints);

    // Creates a new DIV that is used as a toolbar and adds
    // toolbar buttons.
    const spacer = document.createElement('div');
    spacer.style.display = 'inline';
    spacer.style.padding = '8px';

    addToolbarButton(
      editor,
      toolbar,
      'properties',
      'Properties',
      'images/properties.gif'
    );

    // Defines a new export action
    editor.addAction('properties', (editor, cell) => {
      if (cell == null) {
        cell = graph.getSelectionCell();
      }

      if (graph.isHtmlLabel(cell)) {
        showProperties(graph, cell);
      }
    });

    addToolbarButton(editor, toolbar, 'delete', 'Delete', 'images/delete2.png');

    toolbar.appendChild(spacer.cloneNode(true));

    addToolbarButton(editor, toolbar, 'undo', '', 'images/undo.png');
    addToolbarButton(editor, toolbar, 'redo', '', 'images/redo.png');

    toolbar.appendChild(spacer.cloneNode(true));

    addToolbarButton(editor, toolbar, 'show', 'Show', 'images/camera.png');
    addToolbarButton(editor, toolbar, 'print', 'Print', 'images/printer.png');

    toolbar.appendChild(spacer.cloneNode(true));

    // Defines a create SQK action
    editor.addAction('showSql', (editor, cell) => {
      const sql = createSql(graph);

      if (sql.length > 0) {
        const textarea = document.createElement('textarea');
        textarea.style.width = '400px';
        textarea.style.height = '400px';

        textarea.value = sql;
        showModalWindow('SQL', textarea, 410, 440);
      } else {
        mxUtils.alert('Schema is empty');
      }
    });

    addToolbarButton(
      editor,
      toolbar,
      'showSql',
      'Show SQL',
      'images/export1.png'
    );

    // Defines export XML action
    editor.addAction('export', (editor, cell) => {
      const textarea = document.createElement('textarea');
      textarea.style.width = '400px';
      textarea.style.height = '400px';
      const enc = new mxCodec(mxUtils.createXmlDocument());
      const node = enc.encode(editor.graph.getModel());
      textarea.value = mxUtils.getPrettyXml(node);
      showModalWindow('XML', textarea, 410, 440);
    });

    addToolbarButton(
      editor,
      toolbar,
      'export',
      'Export XML',
      'images/export1.png'
    );

    // Adds toolbar buttons into the status bar at the bottom
    // of the window.
    addToolbarButton(
      editor,
      status,
      'collapseAll',
      'Collapse All',
      'images/navigate_minus.png',
      true
    );
    addToolbarButton(
      editor,
      status,
      'expandAll',
      'Expand All',
      'images/navigate_plus.png',
      true
    );

    status.appendChild(spacer.cloneNode(true));

    addToolbarButton(editor, status, 'zoomIn', '', 'images/zoom_in.png', true);
    addToolbarButton(
      editor,
      status,
      'zoomOut',
      '',
      'images/zoom_out.png',
      true
    );
    addToolbarButton(
      editor,
      status,
      'actualSize',
      '',
      'images/view_1_1.png',
      true
    );
    addToolbarButton(editor, status, 'fit', '', 'images/fit_to_size.png', true);

    // Creates the outline (navigator, overview) for moving
    // around the graph in the top, right corner of the window.
    const outln = new mxOutline(graph, outline);

    // Fades-out the splash screen after the UI has been loaded.
    const splash = document.getElementById('splash');
    if (splash != null) {
      try {
        mxEvent.release(splash);
        mxEffects.fadeOut(splash, 100, true);
      } catch (e) {
        // mxUtils is not available (library not loaded)
        splash.parentNode.removeChild(splash);
      }
    }
  }
}

function addToolbarButton(
  editor,
  toolbar,
  action,
  label,
  image,
  isTransparent
) {
  const button = document.createElement('button');
  button.style.fontSize = '10';
  if (image != null) {
    const img = document.createElement('img');
    img.setAttribute('src', image);
    img.style.width = '16px';
    img.style.height = '16px';
    img.style.verticalAlign = 'middle';
    img.style.marginRight = '2px';
    button.appendChild(img);
  }
  if (isTransparent) {
    button.style.background = 'transparent';
    button.style.color = '#FFFFFF';
    button.style.border = 'none';
  }
  mxEvent.addListener(button, 'click', (evt) => {
    editor.execute(action);
  });
  mxUtils.write(button, label);
  toolbar.appendChild(button);
}

function showModalWindow(title, content, width, height) {
  const background = document.createElement('div');
  background.style.position = 'absolute';
  background.style.left = '0px';
  background.style.top = '0px';
  background.style.right = '0px';
  background.style.bottom = '0px';
  background.style.background = 'black';
  mxUtils.setOpacity(background, 50);
  document.body.appendChild(background);

  if (mxClient.IS_QUIRKS) {
    new mxDivResizer(background);
  }

  const x = Math.max(0, document.body.scrollWidth / 2 - width / 2);
  const y = Math.max(
    10,
    (document.body.scrollHeight || document.documentElement.scrollHeight) / 2 -
      (height * 2) / 3
  );
  const wnd = new mxWindow(title, content, x, y, width, height, false, true);
  wnd.setClosable(true);

  // Fades the background out after after the window has been closed
  wnd.addListener(mxEvent.DESTROY, (evt) => {
    mxEffects.fadeOut(background, 50, true, 10, 30, true);
  });

  wnd.setVisible(true);

  return wnd;
}

function addSidebarIcon(graph, sidebar, prototype, image) {
  // Function that is executed when the image is dropped on
  // the graph. The cell argument points to the cell under
  // the mousepointer if there is one.
  const funct = function (graph, evt, cell) {
    graph.stopEditing(false);

    const pt = graph.getPointForEvent(evt);

    let parent = graph.getDefaultParent();
    const model = graph.getModel();

    const isTable = graph.isSwimlane(prototype);
    var name = null;

    if (!isTable) {
      parent = cell;
      const pstate = graph.getView().getState(parent);

      if (parent == null || pstate == null) {
        mxUtils.alert('Drop target must be a table');
        return;
      }

      pt.x -= pstate.x;
      pt.y -= pstate.y;

      const columnCount = graph.model.getChildCount(parent) + 1;
      name = mxUtils.prompt(
        'Enter name for new column',
        `COLUMN${columnCount}`
      );
    } else {
      let tableCount = 0;
      const childCount = graph.model.getChildCount(parent);

      for (let i = 0; i < childCount; i++) {
        if (!graph.model.isEdge(graph.model.getChildAt(parent, i))) {
          tableCount++;
        }
      }

      var name = mxUtils.prompt(
        'Enter name for new table',
        `TABLE${tableCount + 1}`
      );
    }

    if (name != null) {
      const v1 = model.cloneCell(prototype);

      model.beginUpdate();
      try {
        v1.value.name = name;
        v1.geometry.x = pt.x;
        v1.geometry.y = pt.y;

        graph.addCell(v1, parent);

        if (isTable) {
          v1.geometry.alternateBounds = new mxRectangle(
            0,
            0,
            v1.geometry.width,
            v1.geometry.height
          );
          v1.children[0].value.name = `${name}_ID`;
        }
      } finally {
        model.endUpdate();
      }

      graph.setSelectionCell(v1);
    }
  };

  // Creates the image which is used as the sidebar icon (drag source)
  const img = document.createElement('img');
  img.setAttribute('src', image);
  img.style.width = '48px';
  img.style.height = '48px';
  img.title = 'Drag this to the diagram to create a new vertex';
  sidebar.appendChild(img);

  // Creates the image which is used as the drag icon (preview)
  const dragImage = img.cloneNode(true);
  const ds = mxUtils.makeDraggable(img, graph, funct, dragImage);

  // Adds highlight of target tables for columns
  ds.highlightDropTargets = true;
  ds.getDropTarget = function (graph, x, y) {
    if (graph.isSwimlane(prototype)) {
      return null;
    }

    const cell = graph.getCellAt(x, y);

    if (graph.isSwimlane(cell)) {
      return cell;
    }

    const parent = graph.getModel().getParent(cell);

    if (graph.isSwimlane(parent)) {
      return parent;
    }
  };
}

function configureStylesheet(graph) {
  let style = new Object();
  style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
  style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
  style[mxConstants.STYLE_FONTCOLOR] = '#000000';
  style[mxConstants.STYLE_FONTSIZE] = '11';
  style[mxConstants.STYLE_FONTSTYLE] = 0;
  style[mxConstants.STYLE_SPACING_LEFT] = '4';
  style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
  style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
  graph.getStylesheet().putDefaultVertexStyle(style);

  style = new Object();
  style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
  style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
  style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
  style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
  style[mxConstants.STYLE_GRADIENTCOLOR] = '#41B9F5';
  style[mxConstants.STYLE_FILLCOLOR] = '#8CCDF5';
  style[mxConstants.STYLE_SWIMLANE_FILLCOLOR] = '#ffffff';
  style[mxConstants.STYLE_STROKECOLOR] = '#1B78C8';
  style[mxConstants.STYLE_FONTCOLOR] = '#000000';
  style[mxConstants.STYLE_STROKEWIDTH] = '2';
  style[mxConstants.STYLE_STARTSIZE] = '28';
  style[mxConstants.STYLE_VERTICAL_ALIGN] = 'middle';
  style[mxConstants.STYLE_FONTSIZE] = '12';
  style[mxConstants.STYLE_FONTSTYLE] = 1;
  style[mxConstants.STYLE_IMAGE] = 'images/icons48/table.png';
  // Looks better without opacity if shadow is enabled
  // style[mxConstants.STYLE_OPACITY] = '80';
  style[mxConstants.STYLE_SHADOW] = 1;
  graph.getStylesheet().putCellStyle('table', style);

  style = graph.stylesheet.getDefaultEdgeStyle();
  style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
  style[mxConstants.STYLE_STROKEWIDTH] = '2';
  style[mxConstants.STYLE_ROUNDED] = true;
  style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
}

// Function to create the entries in the popupmenu
function createPopupMenu(editor, graph, menu, cell, evt) {
  if (cell != null) {
    if (graph.isHtmlLabel(cell)) {
      menu.addItem('Properties', 'images/properties.gif', () => {
        editor.execute('properties', cell);
      });

      menu.addSeparator();
    }

    menu.addItem('Delete', 'images/delete2.png', () => {
      editor.execute('delete', cell);
    });

    menu.addSeparator();
  }

  menu.addItem('Undo', 'images/undo.png', () => {
    editor.execute('undo', cell);
  });

  menu.addItem('Redo', 'images/redo.png', () => {
    editor.execute('redo', cell);
  });

  menu.addSeparator();

  menu.addItem('Show SQL', 'images/export1.png', () => {
    editor.execute('showSql', cell);
  });
}

function showProperties(graph, cell) {
  // Creates a form for the user object inside
  // the cell
  const form = new mxForm('properties');

  // Adds a field for the columnname
  const nameField = form.addText('Name', cell.value.name);
  const typeField = form.addText('Type', cell.value.type);

  const primaryKeyField = form.addCheckbox(
    'Primary Key',
    cell.value.primaryKey,
  );
  const autoIncrementField = form.addCheckbox(
    'Auto Increment',
    cell.value.autoIncrement
  );
  const notNullField = form.addCheckbox('Not Null', cell.value.notNull);
  const uniqueField = form.addCheckbox('Unique', cell.value.unique);

  const defaultField = form.addText('Default', cell.value.defaultValue || '');
  const useDefaultField = form.addCheckbox(
    'Use Default',
    cell.value.defaultValue != null
  );

  let wnd = null;

  // Defines the function to be executed when the
  // OK button is pressed in the dialog
  const okFunction = function () {
    const clone = cell.value.clone();

    clone.name = nameField.value;
    clone.type = typeField.value;

    if (useDefaultField.checked) {
      clone.defaultValue = defaultField.value;
    } else {
      clone.defaultValue = null;
    }

    clone.primaryKey = primaryKeyField.checked;
    clone.autoIncrement = autoIncrementField.checked;
    clone.notNull = notNullField.checked;
    clone.unique = uniqueField.checked;

    graph.model.setValue(cell, clone);

    wnd.destroy();
  };

  // Defines the function to be executed when the
  // Cancel button is pressed in the dialog
  const cancelFunction = function () {
    wnd.destroy();
  };
  form.addButtons(okFunction, cancelFunction);

  const parent = graph.model.getParent(cell);
  const name = `${parent.value.name}.${cell.value.name}`;
  wnd = showModalWindow(name, form.table, 240, 240);
}

function createSql(graph) {
  const sql = [];
  const parent = graph.getDefaultParent();
  const childCount = graph.model.getChildCount(parent);

  for (let i = 0; i < childCount; i++) {
    const child = graph.model.getChildAt(parent, i);

    if (!graph.model.isEdge(child)) {
      sql.push(`CREATE TABLE IF NOT EXISTS ${child.value.name} (`);

      const columnCount = graph.model.getChildCount(child);

      if (columnCount > 0) {
        for (let j = 0; j < columnCount; j++) {
          const column = graph.model.getChildAt(child, j).value;

          sql.push(`\n    ${column.name} ${column.type}`);

          if (column.notNull) {
            sql.push(' NOT NULL');
          }

          if (column.primaryKey) {
            sql.push(' PRIMARY KEY');
          }

          if (column.autoIncrement) {
            sql.push(' AUTOINCREMENT');
          }

          if (column.unique) {
            sql.push(' UNIQUE');
          }

          if (column.defaultValue != null) {
            sql.push(` DEFAULT ${column.defaultValue}`);
          }

          sql.push(',');
        }

        sql.splice(sql.length - 1, 1);
        sql.push('\n);');
      }

      sql.push('\n');
    }
  }

  return sql.join('');
}

// Defines the column user object
function Column(name) {
  this.name = name;
}

Column.prototype.type = 'TEXT';

Column.prototype.defaultValue = null;

Column.prototype.primaryKey = false;

Column.prototype.autoIncrement = false;

Column.prototype.notNull = false;

Column.prototype.unique = false;

Column.prototype.clone = function () {
  return mxUtils.clone(this);
};

// Defines the table user object
function Table(name) {
  this.name = name;
}

Table.prototype.clone = function () {
  return mxUtils.clone(this);
};

/* // Creates a container for the splash screen
      <>
        <div
          id="splash"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'white',
            zIndex: 1,
          }}
        >
          <center id="splash" style={{ paddingTop: 230 }}>
            <img src="images/loading.gif" alt="" />
          </center>
        </div>
        <div
          id="toolbarContainer"
          style={{
            position: 'absolute',
            whitespace: 'nowrap',
            overflow: 'hidden',
            top: 0,
            left: 0,
            maxHeight: 24,
            height: 36,
            right: 0,
            padding: 6,
            backgroundImage: 'url(images/toolbar_bg.gif)',
          }}
        />
        <div
          id="sidebarContainer"
          style={{
            position: 'absolute',
            overflow: 'hidden',
            top: 36,
            left: 0,
            bottom: 36,
            maxWidth: 52,
            width: 56,
            paddingTop: 10,
            paddingLeft: 4,
            backgroundImage: 'url(images/sidebar_bg.gif)',
          }}
        />
        <div
          id="graphContainer"
          style={{
            position: 'absolute',
            overflow: 'hidden',
            top: 36,
            left: 60,
            bottom: 36,
            right: 0,
          }}
        />
        <div
          id="outlineContainer"
          style={{
            position: 'absolute',
            overflow: 'hidden',
            top: 36,
            right: 0,
            width: 200,
            height: 140,
            background: 'transparent',
            borderStyle: 'solid',
            borderColor: 'black',
          }}
        />
        <div
          id="statusContainer"
          style={{
            textAlign: 'right',
            position: 'absolute',
            overflow: 'hidden',
            bottom: 0,
            left: 0,
            maxHeight: 24,
            height: 36,
            right: 0,
            color: 'white',
            padding: 6,
            backgroundImage: 'url(images/toolbar_bg.gif)',
          }}
        >
          <div style={{ fontSize: 10, float: 'left' }}>
            Created with
            {'\n'}
            <a
              href="http://www.jgraph.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              mxGraph
            </a>
          </div>
        </div>
      </>
      */
