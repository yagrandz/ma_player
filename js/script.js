class PlayerStat {
	constructor() {
		this.id = this.getParam('id') ? this.getParam('id') : location.hash.substr(1);
		$.getScript('https://mybulletecho.ru/ma/stats/player/?id=' + this.id)
			.done(this.onDataLoad.bind(this))
			.fail(function (jqxhr, settings, exception) {
				alert('Data load Error');
			});
		$('.chart_init_btn').click(this.onChatInitBtnClick.bind(this));
	}

	getParam(name) {
		if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
			return decodeURIComponent(name[1]);
	}

	onDataLoad() {
		this.setData();
		this.createTable();
		$('body').append(bodyEndHtml);
	}

	reinitPopovers() {
		var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
		popoverTriggerList.map(function (popoverTriggerEl) {
			return new bootstrap.Popover(popoverTriggerEl)
		})
	}

	openBattleModal(battleId, roundId) {
		var modalId = 'modal_battle_' + battleId + '_r_' + roundId;
		if ($('#' + modalId).length > 0) {
			$('#' + modalId).modal('show');
		} else {
			$.getScript('https://mybulletecho.ru/ma/stats/player/battle_modal/?battleId=' + battleId + '&roundId=' + roundId)
			.done(()=>{
				$('body').append(window[modalId]);
				$('[data-bs-toggle="popover"]', $('#' + modalId)).each((i,e)=>new bootstrap.Popover(e));
				$('#' + modalId).modal('show');
			})
			.fail(function (jqxhr, settings, exception) {
				alert('Data load Error');
			});
		}

	}

	setData() {
		$('title').text(player.name + ' | Статистика игрока');
		Object.keys(player).forEach(key => {
			$('.data-player-' + key).html(player[key]);
		})
	}

	createTable() {
		$('#deck_table').DataTable({
			responsive: true,
			data: deckStatsData,
			columns: deckStatsHeader,
			order: [[deckStatsHeader.length - 1, "desc"]],
			pageLength: 10,
			dom: 'tp',
		});
		let updateColumnIndex = 0;
		battleTableHeader.forEach((column, index) => column.data=='UPDATED'&&(updateColumnIndex = index));
		$('#battle_table').DataTable({
			responsive: true,
			//data: battleTableData,
			"ajax": function (data, callback, settings) {
				var params = [];
				settings.aaSorting.forEach(sort => params.push('sort['+settings.aoColumns[sort[0]].data+']='+sort[1]));
				settings.aoColumns.forEach(column => params.push('fields[]='+column.data));
				params.push('search='+data.search.value);
				params.push('limit='+data.length);
				params.push('draw='+data.draw);
				params.push('offset='+data.start);
				params.push('playerId='+this.id);
				$.getScript('https://mybulletecho.ru/ma/stats/player/battle_table/?' + params.join('&'))
				.done(() => {
					callback(
						battle_table_data
					);
				})
				.fail(function (jqxhr, settings, exception) {
					alert('Data load Error');
				});
			}.bind(this),
			processing: true,
			serverSide: true,
			searching: false,
			columns: battleTableHeader,
			order: [[updateColumnIndex, "desc"]],
			pageLength: 10,
			dom: 'ftp',
		});
		let dateColumnIndex = 0;
		clanLogTableHeader.forEach((column, index) => column.data=='DATE'&&(dateColumnIndex = index));
		$('#clan_log_table').DataTable({
			responsive: true,
			//data: battleTableData,
			"ajax": function (data, callback, settings) {
				var params = [];
				settings.aaSorting.forEach(sort => params.push('sort['+settings.aoColumns[sort[0]].data+']='+sort[1]));
				settings.aoColumns.forEach(column => params.push('fields[]='+column.data));
				params.push('search='+data.search.value);
				params.push('limit='+data.length);
				params.push('draw='+data.draw);
				params.push('offset='+data.start);
				params.push('playerId='+this.id);
				$.getScript('https://mybulletecho.ru/ma/stats/player/clan_log/?' + params.join('&'))
				.done(() => {
					callback(
						battle_table_data
					);
				})
				.fail(function (jqxhr, settings, exception) {
					alert('Data load Error');
				});
			}.bind(this),
			processing: true,
			serverSide: true,
			searching: false,
			columns: clanLogTableHeader,
			order: [[dateColumnIndex, "desc"]],
			pageLength: 10,
			dom: 'ftp',
		});
		$('#tournament_table').DataTable({
			responsive: true,
			data: tournamentsData,
			columns: tournamentsHeaders,
			order: [[tournamentsHeaders.length - 1, "asc"]],
			pageLength: 10,
			dom: 'ftp',
		});
	}

	createCharts() {
		this.createChart('clan_members_power_chart', chart_data.power);
		this.createChart('clan_members_rating_chart', chart_data.rating);
	}

	onChatInitBtnClick(e) {
		var btn = $(e.currentTarget);
		btn.slideUp();
		$('#clan_members_' + btn.data('id') + '_chart').show();
		this.createChart('clan_members_' + btn.data('id') + '_chart', chart_data[btn.data('id')]);
	}

	createChart(id, data) {
		var root = am5.Root.new(id);
		root.container.set({
			paddingBottom: 0,
			paddingTop: 0,
			paddingLeft: 0,
			paddingRight: 0,
		})
		root.setThemes([
			am5themes_Animated.new(root)
		]);
		var chart = root.container.children.push(am5xy.XYChart.new(root, {
			layout: root.verticalLayout,
			panX: true,
			panY: false,
			wheelX: "panX",
			wheelY: "zoomX",
			maxTooltipDistance: 0,
			pinchZoomX: true
		}));

		var xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
			baseInterval: {
				timeUnit: "day",
				count: 1
			},
			renderer: am5xy.AxisRendererX.new(root, {}),
			tooltip: am5.Tooltip.new(root, {}),
			groupData: true,
			groupCount: $(window).width() > 500 ? 500 : 20,
		}));

		var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
			renderer: am5xy.AxisRendererY.new(root, {})
		}));

		data.forEach(u => {
			var series = chart.series.push(am5xy.LineSeries.new(root, {
				name: u.name,
				xAxis: xAxis,
				yAxis: yAxis,
				valueYField: "value",
				valueXField: "date",
				legendValueText: "{valueY}",
				tooltip: am5.Tooltip.new(root, {
					pointerOrientation: "horizontal",
					labelText: u.name + ": {valueY}"
				})
			}));

			series.data.setAll(u.data);
			series.appear();
		});

		var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
			behavior: "none"
		}));
		cursor.lineY.set("visible", false);


		chart.set("scrollbarX", am5.Scrollbar.new(root, {
			orientation: "horizontal"
		}));


		var legend = chart.children.push(am5.Legend.new(root, {
			paddingTop: 15,
			centerX: am5.percent(50),
			x: am5.percent(50),
			layout: am5.GridLayout.new(root, {
				maxColumns: 6,
				fixedWidthGrid: true
			}),
			height: am5.percent(40),
			width: am5.percent(100),
			verticalScrollbar: am5.Scrollbar.new(root, {
				orientation: "vertical"
			})
		}));
		legend.labels.template.setAll({
			fontSize: 12,
		});

		legend.data.setAll(chart.series.values);
		chart.appear(1000, 100);
	}
}
