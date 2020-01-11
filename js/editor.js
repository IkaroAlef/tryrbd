let mxUtilsPath = 'mxgraph/javascript/examples/';

function main(container) {
	// Checks if the browser is supported
	if (!mxClient.isBrowserSupported()) {
		mxUtils.error('Browser is not supported!', 200, false);
	}
	else {
		// Disables built-in context menu
		mxEvent.disableContextMenu(document.body);

		// Note that these XML nodes will be enclosing the
		// mxCell nodes for the model cells in the output
		var doc = mxUtils.createXmlDocument();

		var inicio = doc.createElement("inicio");
		inicio.setAttribute('nome', 'INICIO');

		var fim = doc.createElement('fim');
		fim.setAttribute('nome', 'FIM');

		var bloco1 = doc.createElement('bloco');
		bloco1.setAttribute('nome', 'b1');
		bloco1.setAttribute('disponibilidade', '98');

		var conexaoInicio = doc.createElement('conecta');
		conexaoInicio.setAttribute(inicio.getAttribute('nome'), bloco1.getAttribute('nome'));

		var conexaoFim = doc.createElement('conecta');
		conexaoFim.setAttribute(bloco1.getAttribute('nome'), fim.getAttribute('nome'));

		// cria o gráfico dentro do container dado
		var graph = new mxGraph(container);
		
		// desabilitar movimentação dos elementos
		graph.setCellsResizable(false);
		graph.setAllowDanglingEdges(false);
		graph.setCellsMovable(false);

		graph.setResizeContainer(true);
		graph.minimumContainerSize = new mxRectangle(0, 0, 500, 380);
		graph.setBorder(60);

		graph.alternateEdgeStyle = 'elbow=vertical';

		// Overrides method to disallow edge label editing
		graph.isCellEditable = function (cell) {
			return !this.getModel().isEdge(cell);
		};

		// método override para mostrar um label no bloco
		graph.convertValueToString = function (cell) {
			if (mxUtils.isNode(cell.value)) {
				if (cell.value.nodeName.toLowerCase() == 'bloco') {
					var nome = cell.getAttribute('nome', '');
					var disponibilidade = cell.getAttribute('disponibilidade', '');

					if (disponibilidade != null && disponibilidade.length > 0) {
						return nome + ', ' + disponibilidade;
					}
					return nome;
				}
				else if (cell.value.nodeName.toLowerCase() == 'inicio') {
					return cell.getAttribute('nome');
				}
				else if (cell.value.nodeName.toLowerCase() == 'fim') {
					return cell.getAttribute('nome');
				}
				else if (cell.value.nodeName.toLowerCase() == 'knows') {
					return cell.value.nodeName + ' (Since '
						+ cell.getAttribute('since', '') + ')';
				}
			}
			return '';
		};

		// Overrides method to store a cell label in the model
		var cellLabelChanged = graph.cellLabelChanged;
		graph.cellLabelChanged = function (cell, newValue, autoSize) {
			if (mxUtils.isNode(cell.value) &&
				cell.value.nodeName.toLowerCase() == 'bloco') {
				var pos = newValue.indexOf(' ');

				var nome = (pos > 0) ? newValue.substring(0,
					pos) : newValue;
				var disponibilidade = (pos > 0) ? newValue.substring(
					pos + 1, newValue.length) : '';

				// Clones the value for correct undo/redo
				var elt = cell.value.cloneNode(true);

				elt.setAttribute('nome', nome);
				elt.setAttribute('disponibilidade', disponibilidade);

				newValue = elt;
				autoSize = true;
			}
			cellLabelChanged.apply(this, arguments);
		};

		// metodo Override para criar valores editaveis
		var getEditingValue = graph.getEditingValue;
		graph.getEditingValue = function (cell) {
			if (mxUtils.isNode(cell.value) &&
				cell.value.nodeName.toLowerCase() == 'bloco') {
				var nome = cell.getAttribute('nome', '');
				var disponibilidade = cell.getAttribute('disponibilidade', '');

				return nome + ' ' + disponibilidade;
			}
		};

		// Enables tooltips
		graph.setTooltips(true);

		var getTooltipForCell = graph.getTooltipForCell;
		graph.getTooltipForCell = function (cell) {
			// Adds some conexao details for edges
			if (graph.getModel().isEdge(cell)) {
				var src = this.getLabel(this.getModel().getTerminal(cell, true));
				var trg = this.getLabel(this.getModel().getTerminal(cell, false));

				return src + ' ' + cell.value.nodeName + ' ' + trg;
			}

			return getTooltipForCell.apply(this, arguments);
		};

		// Enables rubberband (marquee) selection and a handler
		// for basic keystrokes (eg. return, escape during editing).
		var rubberband = new mxRubberband(graph);
		var keyHandler = new mxKeyHandler(graph);

		// Installs a popupmenu handler using local function (see below).
		graph.popupMenuHandler.factoryMethod = function (menu, cell, evt) {
			return createPopupMenu(graph, menu, cell, evt);
		};

		// Adds an option to view the XML of the graph
		document.body.appendChild(mxUtils.button('View XML', function () {
			var encoder = new mxCodec();
			var node = encoder.encode(graph.getModel());
			mxUtils.popup(mxUtils.getPrettyXml(node), true);
		}));

		document.body.appendChild(mxUtils.button('Calcular', function (){
			calcular(graph)}));

		// Changes the style for match the markup
		// Creates the default style for vertices
		var style = graph.getStylesheet().getDefaultVertexStyle();
		style[mxConstants.STYLE_STROKECOLOR] = 'gray';
		style[mxConstants.STYLE_ROUNDED] = true;
		style[mxConstants.STYLE_SHADOW] = true;
		style[mxConstants.STYLE_FILLCOLOR] = '#DFDFDF';
		style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
		style[mxConstants.STYLE_FONTCOLOR] = 'black';
		style[mxConstants.STYLE_FONTSIZE] = '12';
		style[mxConstants.STYLE_SPACING] = 4;

		// Creates the default style for edges
		style = graph.getStylesheet().getDefaultEdgeStyle();
		style[mxConstants.STYLE_STROKECOLOR] = '#0C0C0C';
		style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
		style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
		style[mxConstants.STYLE_ROUNDED] = true;
		style[mxConstants.STYLE_FONTCOLOR] = 'black';
		style[mxConstants.STYLE_FONTSIZE] = '10';

		// Gets the default parent for inserting new cells. This
		// is normally the first child of the root (ie. layer 0).
		var parent = graph.getDefaultParent();

		// Adds cells to the model in a single step
		graph.getModel().beginUpdate();
		try {
			var vInicio = graph.insertVertex(parent, null, inicio, 10, 120, 50, 30, 'strokeColor=none;fillColor=none;resizable=0;autosize=1;');
			var v1 = graph.insertVertex(parent, null, bloco1, 100, 120, 80, 30);
			var vFim = graph.insertVertex(parent, null, fim, 230, 120, 25, 30, 'strokeColor=none;fillColor=none;resizable=0;autosize=1;');
			
			var eInicio = graph.insertEdge(parent, null, conexaoInicio, vInicio, v1);
			var eFim = graph.insertEdge(parent, null, conexaoFim, v1, vFim);
			
		}
		finally {
			// Updates the display
			graph.getModel().endUpdate();
		}

		// Implements a properties panel that uses
		// mxCellAttributeChange to change properties
		graph.getSelectionModel().addListener(mxEvent.CHANGE, function (sender, evt) {
			selectionChanged(graph);
		});

		selectionChanged(graph);
	}

	// método para calcular a disponibilidade do RBD
	function calcular(graph){
			var encoder = new mxCodec();
			var node = encoder.encode(graph.getModel());
			var text = mxUtils.getXml(node);		
			text = mxUtils.parseXml(text);
			let t = text.getElementsByTagName('bloco');
			let produto = 1;
			for(let i=0; i<t.length; i++){
				produto = produto * t[i].getAttribute('disponibilidade')/100;
			}
			mxUtils.popup("A disponibilidade é "+produto*100+"%.", true);
			console.log(produto);
		};


	/**
	 * Updates the properties panel
	 */
	function selectionChanged(graph) {
		var div = document.getElementById('properties');

		// Forces focusout in IE
		graph.container.focus();

		// Clears the DIV the non-DOM way
		div.innerHTML = '';

		// Gets the selection cell
		var cell = graph.getSelectionCell();

		if (cell == null) {
			mxUtils.writeln(div, 'Nothing selected.');
		}
		else {
			// Writes the title
			var center = document.createElement('center');
			mxUtils.writeln(center, cell.value.nodeName + ' (' + cell.id + ')');
			div.appendChild(center);
			mxUtils.br(div);

			// Creates the form from the attributes of the user object
			var form = new mxForm();

			var attrs = cell.value.attributes;

			for (var i = 0; i < attrs.length; i++) {
				createTextField(graph, form, cell, attrs[i]);
			}

			div.appendChild(form.getTable());
			mxUtils.br(div);
		}
	}

	/**
	 * Creates the textfield for the given property.
	 */
	function createTextField(graph, form, cell, attribute) {
		var input = form.addText(attribute.nodeName + ':', attribute.nodeValue);

		var applyHandler = function () {
			var newValue = input.value || '';
			var oldValue = cell.getAttribute(attribute.nodeName, '');

			if (newValue != oldValue) {
				graph.getModel().beginUpdate();

				try {
					var edit = new mxCellAttributeChange(
						cell, attribute.nodeName,
						newValue);
					graph.getModel().execute(edit);
					//graph.updateCellSize(cell);
				}
				finally {
					graph.getModel().endUpdate();
				}
			}
		};

		mxEvent.addListener(input, 'keypress', function (evt) {
			// Needs to take shift into account for textareas
			if (evt.keyCode == /*enter*/13 &&
				!mxEvent.isShiftDown(evt)) {
				input.blur();
			}
		});

		if (mxClient.IS_IE) {
			mxEvent.addListener(input, 'focusout', applyHandler);
		}
		else {
			// Note: Known problem is the blurring of fields in
			// Firefox by changing the selection, in which case
			// no event is fired in FF and the change is lost.
			// As a workaround you should use a local variable
			// that stores the focused field and invoke blur
			// explicitely where we do the graph.focus above.
			mxEvent.addListener(input, 'blur', applyHandler);
		}
	}

function addChild(graph, cell)
{
	var model = graph.getModel();
	var parent = graph.getDefaultParent();
	var vertex;
	var geo = graph.getCellGeometry(cell);
	var b = doc.createElement('bloco');
	b.setAttribute('nome', 'bloco');
	b.setAttribute('disponibilidade', '0');

	model.beginUpdate();
	try{
		vertex = graph.insertVertex(parent, null, b, geo.x, geo.y, 80, 30);
		var geometry = model.getGeometry(vertex);

		// Updates the geometry of the vertex with the
		// preferred size computed in the graph
		var size = graph.getPreferredSizeForCell(vertex);
		geometry.width = size.width;
		geometry.height = size.height;

		//conectar o bloco selecionado com o novo bloco
		let e1 = graph.insertEdge(parent, null, '', cell, vertex);

		//ligar o novo bloco com "target" do bloco selecionado
		let e2 = graph.insertEdge(parent, null, '', vertex, cell.edges[1].target);
		
		//remover a conexão antiga do bloco
		graph.getModel().remove(cell.edges[1]); 
		var layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);
		//funcao adaptada para criar animação dos blocos se movendo ao adicionar um novo bloco
		var executeLayout = function (change, post) {
			graph.getModel().beginUpdate();
			try {
				if (change != null) {
					change();
				}
				layout.execute(graph.getDefaultParent());
			}
			catch (e) {
				throw e;
			}
			finally {
				// New API for animating graph layout results asynchronously
				var morph = new mxMorphing(graph);
				morph.addListener(mxEvent.DONE, mxUtils.bind(this, function () {
					graph.getModel().endUpdate();
					if (post != null) {
						post();
					}
				}));

				morph.startAnimation();
			}
		};
		executeLayout();
	}
	finally
	{
		model.endUpdate();
	}
	
	return vertex;
};

	// Função dos submenus
	function createPopupMenu(graph, menu, cell, evt) {
		if (cell != null) {

			let subInserir = menu.addItem('Inserir bloco', null, null); //submenu inserir
			let subSerie = menu.addItem('Série', null, null, subInserir);
			let subParalelo = menu.addItem('Paralelo', null, null, subInserir);

			//Configuração do menu "add bloco simples em série"
			menu.addItem('Simples', null, function () {
				addChild(graph, cell);
			}, subSerie);

			//Configuração do menu add bloco k-out-of-n em série
			menu.addItem('K-out-of-N', null, function () {
				graph.clearSelection();
				var geo = graph.getCellGeometry(cell);

				var v2;

				executeLayout(function () {
					v2 = graph.insertVertex(parent, null, 'World!', geo.x, geo.y, 80, 30);
					graph.view.refresh(v2);
					var e1 = graph.insertEdge(parent, null, '', cell, v2);
				}, function () {
					graph.scrollCellToVisible(v2);
				});
			}, subSerie);

			//Configuração do menu add bloco simples em paralelo
			//menu.addItem('Simples', null, addParaleloSimples, subParalelo);

			//Configuração do menu add bloco k-out-of-n em paralelo
			//menu.addItem('K-out-of-N', null, addParaleloKN, subParalelo);

		}
	};
};