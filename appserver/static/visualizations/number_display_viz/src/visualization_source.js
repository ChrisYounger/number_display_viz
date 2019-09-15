define([
    'jquery',
    'api/SplunkVisualizationBase',
    'api/SplunkVisualizationUtils',
    'chart.js'
],
function(
    $,
    SplunkVisualizationBase,
    vizUtils,
    Chart
) {
    // known issues in IE11: spinners dont spin, centering doesnt work
    // TODO -  set height of panel to auto?
    var vizObj = {
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            var viz = this;
            viz.instance_id = Math.round(Math.random() * 1000000);
            var theme = 'light'; 
            if (typeof vizUtils.getCurrentTheme === "function") {
                theme = vizUtils.getCurrentTheme();
            }
            viz.colors = ["#006d9c", "#4fa484", "#ec9960", "#af575a", "#b6c75a", "#62b3b2"];
            if (typeof vizUtils.getColorPalette === "function") {
                viz.colors = vizUtils.getColorPalette("splunkCategorical", theme);
            }
            viz.$container_wrap = $(viz.el);
            viz.$container_wrap.addClass("number_display_viz-container");
        },

        formatData: function(data) {
            return data;
        },

        updateView: function(data, config) {
            var viz = this;
            viz.config = {
                style: "g1", 
                padding: "10",
                size: "",
                min: "0",
                max: "100",
                maxrows: "200",
                autopanelheight: "false",
                nodatacolor: "#0178c7",
                thresholdcol1: "#1a9035",
                thresholdcol2: "#d16f18",
                thresholdcol3: "#b22b32",
                thresholdcol4: "#ffffff",
                thresholdcol5: "#ffffff",
                thresholdcol6: "#ffffff",
                thresholdval2: "70",
                thresholdval3: "90",
                thresholdval4: "",
                thresholdval5: "",
                thresholdval6: "",
                colorprimarymode: "auto",
                colorprimary: "#000000",
                colorsecondarymode: "darker1",
                colorsecondary: "#000000",

                sparkorder: "bg",
                sparkstyle: "area",
                sparknulls: "gaps",
                sparkcolormodeline: "auto",
                sparkcolorline: "#0178c7",
                sparkcolormodefill: "auto",
                sparkcolorfill: "#009DD9",
                sparkmin: "0",
                sparkmax: "",
                sparkalign: "5",
                sparkalignv: "70",
                sparkHeight: "30",
                sparkWidth: "90",

                textshow: "yes",
                textmode: "static",
                textcolor: "#000000",
                textalign: "center",
                textalignv: "50",
                textsize: "100",
                textduration: "300",
                textprecision: "1",
                textprocessing: "",
                textunit: "",
                textunitsize: "50",
                textunitposition: "after",
                textfont: "",
                textdrop: "yes",
                textdropcolor: "#ffffff",

                titletext: "",
                titlealign: "center",
                titlealignv: "30",
                titlesize: "45",
                titlecolormode: "static",
                titlecolor: "#5C6773",
                titlefont: "",
                titledrop: "yes",
                titledropcolor: "#ffffff",

                subtitletext: "",
                subtitlealign: "center",
                subtitlealignv: "70",
                subtitlesize: "40",
                subtitlecolormode: "static",
                subtitlecolor: "#5C6773",
                subtitlefont: "",
                subtitledrop: "yes",
                subtitledropcolor: "#ffffff",

                shadowcolor: "#F2F4F5",
                bordercolor: "#ffffff",
                bordersize: "2",
                thickness: "50",
                thresholdsize: "20",

                spinnerspeedmin: "15",
                spinnerspeedmax: "1",

                pathviewbox: "0 0 100 100",
                path: "M0 10 L100 10",
                pathwidth: "3",
                pathjoin: "round",
                pathshape: "round",
                pathantsize: "1",
                pathantgap: "8",
                pathspeedmin: "1",
                pathspeedmax: "20",

                shapetexture: "solid",
                shapeshadow: "yes",
                shapedropcolor: "#ffffff",
                shapebordercolormode: "static",
                shapebordercolor: "#FFFFFF",
                shapebordersize: "1",
                pulserate: "4",

                circumference: Math.PI + 0.6,
                rotation: -Math.PI - 0.3,
                mainHeight:  0.95,
                mainWidth: 0.95,
            };

            var style_overrides = {
                g1: {
                    mainHeight:  0.7
                },
                g2: {
                    mainHeight:  0.6,
                    circumference: Math.PI,
                    rotation: -Math.PI,
                },
                g3: {
                    circumference: Math.PI * 1.5,
                    rotation: Math.PI * 0.5,
                },
                g4: {
                    circumference: Math.PI * 2,
                    rotation: Math.PI * 1.5,
                },
                a3: {mainHeight:  0.5},
                a4: {mainHeight:  0.5},
                path: {mainHeight:  1, mainWidth: 1},
            };
            // Override defaults with selected items from the UI
            for (var opt in config) {
                if (config.hasOwnProperty(opt)) {
                    viz.config[ opt.replace(viz.getPropertyNamespaceInfo().propertyNamespace,'') ] = config[opt];
                }
            }
            // Now do the style overrides
            if (style_overrides.hasOwnProperty(viz.config.style)) {
                for (opt in style_overrides[viz.config.style]) {
                    if (style_overrides[viz.config.style].hasOwnProperty(opt)) {
                        viz.config[ opt ] = style_overrides[viz.config.style][opt];
                    }
                }
            }
            if (viz.config.style === "path") {
                viz.speedmin = Number(viz.config.pathspeedmin);
                viz.speedmax = Number(viz.config.pathspeedmax);
            } else {
                viz.speedmin = Number(viz.config.spinnerspeedmin);
                viz.speedmax = Number(viz.config.spinnerspeedmax);
            }
            viz.data = data;
            viz.scheduleDraw();

            $(window).off("resize.number_display_viz").on("resize.number_display_viz", function () {
                viz.scheduleDraw();
            });
        },

        // debounce the draw
        scheduleDraw: function(){
            var viz = this;
            clearTimeout(viz.drawtimeout);
            viz.drawtimeout = setTimeout(function(){
                viz.doDraw();
            }, 300);
        },

        doDraw: function(){
            var viz = this;
            // Dont draw unless this is a real element under body
            if (! viz.$container_wrap.parents().is("body")) {
                return;
            }

            // Keep track of the container size the config used so we know if we need to redraw teh whole page
            viz.config.containerSize = viz.$container_wrap.height();
            viz.config.containerWidth = viz.$container_wrap.width();
            var serialised = JSON.stringify(viz.config);
            var doAFullRedraw = false;
            if (viz.alreadyDrawn !== serialised) {
                doAFullRedraw = true;
                viz.alreadyDrawn = serialised;
            }

            // Figure out what the supplied data looks like
            viz.datamode = 0;
            var currentRow = viz.data.rows[0];
            if (viz.data.rows.length) {
                // The data should always be an array
                if (Array.isArray(currentRow)) {
                    // At least two columns of data
                    if (currentRow.length > 1) { 
                        // Special case that looks like it is probably data from |timechart command
                        if (viz.data.fields[0].name === "_time" && viz.data.rows.length > 3) {
                            viz.datamode = 1;
                        
                        // Format: Sparkline, Value?
                        } else if (Array.isArray(currentRow[0]) && currentRow[0][0] === "##__SPARKLINE__##") {
                            viz.datamode = 2;
                            // check if there is another column that we can use for the value
                            if (! Array.isArray(currentRow[1])) {
                                viz.datamode = 3;
                            }
                        
                        // Format: Label, Sparkline, Value?
                        } else if (! Array.isArray(currentRow[0]) && Array.isArray(currentRow[1]) && currentRow[1][0] === "##__SPARKLINE__##") {
                            viz.datamode = 4;
                            viz.drilldown_field = viz.data.fields[0].name;
                            // check if there is another column that we can use for the value
                            if (currentRow.length > 2 && ! Array.isArray(currentRow[2])) {
                                viz.datamode = 5;
                            }
                            
                        // Format: Label, Value, Sparkline
                        } else if (currentRow.length > 2 && ! Array.isArray(currentRow[0]) && ! Array.isArray(currentRow[1]) && Array.isArray(currentRow[2]) && currentRow[2][0] === "##__SPARKLINE__##") {
                            viz.drilldown_field = viz.data.fields[0].name;
                            viz.datamode = 6;

                        // Format: Label, Value
                        } else if (! Array.isArray(currentRow[0]) && ! Array.isArray(currentRow[1])) {
                            viz.drilldown_field = viz.data.fields[0].name;
                            viz.datamode = 7;

                        } else {
                            // Unable to handle data format
                        }
                    // Single column, if its a sparkline
                    } else if (Array.isArray(currentRow[0]) && currentRow[0][0] === "##__SPARKLINE__##") {
                        viz.datamode = 8;
                    // Single column, it must be a value
                    } else {
                        viz.datamode = 9;
                    }
                } else {
                    // Unable to handle data format
                }
            }
            // Check to see if there is a field specifically called "title" in which case it will override
            for (var m = 0; m < viz.data.fields.length; m++) {
                if (viz.datamode !== 1 && viz.data.fields[m].name === "title") {
                    viz.drilldown_field = "title";
                }
            }
            // Can't continue becuase of data issues
            if (! viz.data.rows.length || viz.datamode === 0) {
                viz.$container_wrap.empty();
                viz.$container_wrap.append('<div style="text-align: center; width:100%; color: #818d99; line-height: 3;">Unexpected data format.</div>');
                return;
            }

            if (viz.data.rows.length !== viz.currentRows) {
                doAFullRedraw = true;
                viz.currentRows = viz.data.rows.length;
            }
            var item, i, j;

            if (doAFullRedraw) {
                if (viz.hasOwnProperty("item")) {
                    // Clear any running timers
                    for (i = 0; i < viz.item.length; i++) {
                        if (viz.item[i].hasOwnProperty("pulseInterval")) {
                            clearInterval(viz.item[i].pulseInterval);
                        }
                    }
                }
                viz.item = [];
            }

            var allowedOverrides = {
                color: "color",
                primarycolor: "primarycolor",
                secondarycolor: "secondarycolor",
                value: "value",
                sparkline: "overtimedata",
                title: "title",
                text: "text",
                subtitle: "subtitle",
                min: "min",
                max: "max",
            };

            // viz.datamode = 1 is "|timechart" data. it doesnt allow for overrides
            if (viz.datamode === 1) {
                // Last element in the _timechart array will be the _span field which is not needed
                for (j = 1; j < viz.data.fields.length; j++) {
                    if (viz.data.fields[j].name === "_span" && viz.data.fields.length - 1 === j) {
                        continue;
                    }
                    item = {
                        id: (j - 1),
                        overtimedata: [],
                        title: "",
                        value: "",
                    };
                    // viz.item array will exist if this is an already created item
                    if (viz.item.length > (j - 1)) {
                        item = viz.item[(j - 1)];
                    } else {
                        viz.item.push(item);
                    }
                    item.overtimedata = [];
                    item.title = viz.data.fields[j].name;
                    for (i = 0; i < viz.data.rows.length; i++) {
                        item.overtimedata.push(viz.data.rows[i][j]);
                    }
                    item.value = item.overtimedata[item.overtimedata.length - 1];
                }
            } else {
                for (i = 0; i < viz.data.rows.length; i++) {
                    item = {
                        id: i,
                        overtimedata: [],
                        title: "",
                        value: null,
                    };
                    // viz.item array will exist if this is an already created item
                    if (viz.item.length > i) {
                        item = viz.item[i];
                    } else {
                        viz.item.push(item);
                    }
                    currentRow = viz.data.rows[i];
                    if (viz.datamode === 2) {
                        item.overtimedata = currentRow[0].slice(1);
                    } else if (viz.datamode === 3) {
                        item.overtimedata = currentRow[0].slice(1);
                        item.value = currentRow[1];
                    } else if (viz.datamode === 4) {
                        item.title = currentRow[0];
                        item.overtimedata = currentRow[1].slice(1);
                    } else if (viz.datamode === 5) {
                        item.title = currentRow[0];
                        item.overtimedata = currentRow[1].slice(1);
                        item.value = currentRow[2];
                    } else if (viz.datamode === 6) {
                        item.title = currentRow[0];
                        item.value = currentRow[1];
                        item.overtimedata = currentRow[2].slice(1);
                    } else if (viz.datamode === 7) {
                        item.title = currentRow[0];
                        item.value = currentRow[1];
                    } else if (viz.datamode === 8) {
                        item.overtimedata = currentRow[0].slice(1);
                    } else if (viz.datamode === 9) {
                        item.value = currentRow[0];
                    }
                    // overrides are columns in the data with specific names
                    for (var k = 0; k < viz.data.fields.length; k++) {
                        if (allowedOverrides.hasOwnProperty(viz.data.fields[k].name)) {
                            if (viz.data.fields[k].name === "sparkline") {
                                if (Array.isArray(currentRow[k]) && currentRow[k][0] === "##__SPARKLINE__##") {
                                    item[allowedOverrides[viz.data.fields[k].name]] = currentRow[k].slice(1);
                                } else {
                                    item[allowedOverrides[viz.data.fields[k].name]] = [];
                                }
                            } else {
                                item[allowedOverrides[viz.data.fields[k].name]] = currentRow[k];
                            }
                        }
                    }
                    if (item.value === null) {
                        if (item.overtimedata.length) {
                            item.value = item.overtimedata[item.overtimedata.length - 1];
                        } else {
                            item.value = "";
                        }
                    }
                }
            }

            // Can't continue becuase too many rows
            if (viz.item.length > Number(viz.config.maxrows)) {
                viz.$container_wrap.empty();
                viz.$container_wrap.append('<div style="text-align: center; width:100%; color: #818d99; line-height: 3;">Too many rows of data (Total rows:' + viz.item.length + ', Limit: ' + viz.config.maxrows + ')</div>');
                return;
            }

            // Figure out the size
            if (doAFullRedraw) {

                if (viz.config.autopanelheight === "true") {
                    viz.$container_wrap.parentsUntil(".ui-resizable").parent().css("height","auto");
                }

                viz.paddingleftpercent = 0;
                viz.paddingtoppercent = null;
                var paddingparts = viz.config.padding.split(" ");
                if (paddingparts.length == 2) {
                    viz.paddingtoppercent = paddingparts[0];
                    viz.paddingleftpercent = paddingparts[1];
                } else if  (paddingparts.length == 1) {
                    viz.paddingleftpercent = paddingparts[0];
                }
                // If "full" shape is selected, we force to one row
                if (viz.config.style === "a12" || viz.config.style === "a13" || viz.config.style === "nil") {
                    // If we are auto detecting size, then only use one row viz.$container_wrap.width() viz.item.length viz.config.paddingleftpercent
                    viz.size = (viz.$container_wrap.width() / (viz.item.length * (1 + viz.paddingleftpercent / 100)));
                    var desired_height;
                    if (viz.paddingtoppercent !== null) {
                        desired_height = viz.$container_wrap.height() / (1 + viz.paddingtoppercent / 100);
                    } else {
                        desired_height = viz.$container_wrap.height();
                    }
                    if (viz.config.size > 0) {
                        desired_height = viz.config.size;
                    }
                    // If "full" shape is selected, need to set unusual item size. need to set height as a multiple of size (which is always width)
                    viz.config.mainHeight = desired_height / viz.size;

                } else if (viz.config.size > 0) {
                    viz.size = Number(viz.config.size);

                } else {
                    // If we are auto detecting size, then only use one row 
                    // When size isnt specified, and we are doing one row, the padding only affects left/right.    / (1 + viz.config.padding / 100)
                    // We could have allowed the padding to affect top as well, which would allow users to create more writespace for putting sparklines etc.
                    // Ideally there needs to be two margin options
                    viz.size = viz.$container_wrap.width() / (viz.item.length * (1 + viz.paddingleftpercent / 100))
                    if (viz.paddingtoppercent !== null) {
                        viz.size = Math.min(viz.$container_wrap.height() / (1 + viz.paddingtoppercent / 100), viz.size);
                    } else {
                        viz.size = Math.min((viz.$container_wrap.height() - 20), viz.size);
                    }
                    viz.size = Math.max(50, viz.size);
                }
                viz.paddingleftpixels = (viz.size * (viz.paddingleftpercent / 100)) / 2;
                if (viz.paddingtoppercent !== null) {
                    viz.paddingtoppixels = (viz.size * (viz.paddingtoppercent / 100)) / 2;
                }
                viz.rows = ((viz.size + (2 * viz.paddingleftpixels)) * viz.item.length) / (viz.$container_wrap.width() - 10);
                //console.log("Total rows: ", viz.rows);
                if (viz.rows > 1.05) {
                    viz.$container_wrap.css({"flex-wrap":"wrap", "justify-content": "center", "align-content": "flex-start"}).empty();
                } else {
                    viz.$container_wrap.css({"flex-wrap":"nowrap", "justify-content": "center"}).empty(); // align-content doesnt work when there is one line of items
                }
            }
            for (i = 0; i < viz.item.length; i++) {
                // Two final data validation checks
                if (viz.item[i].value === null) { 
                    viz.item[i].value = "";
                }
                if (! Array.isArray(viz.item[i].overtimedata)) {
                    viz.item[i].overtimedata = [];
                }
                // Only draw if container has size. Otherwise its hidden
                if (viz.$container_wrap.width() > 0) {
                    viz.doDrawItem(viz.item[i], doAFullRedraw);
                }
            }
        },

        sanitise: function(val) {
            return val.toString().replace(/\W+/g, "_");
        },

        doDrawItem: function(item, doAFullRedraw){
            var viz = this;
            var i, vbmultipler;
            if (! item.hasOwnProperty("min")) {
                item.min = viz.config.min;
            }
            if (! item.hasOwnProperty("max")) {
                item.max = viz.config.max;
            }
            item.min = Number(item.min);
            item.max = Number(item.max);

            if (doAFullRedraw) {
                item.$canvas1 = $('<canvas class="number_display_viz-canvas_areachart"></canvas>');
                item.$canvas2 = $('<canvas class="number_display_viz-canvas_main"></canvas>');
                item.$overlayText = $('<div class="number_display_viz-overlay_text"></div>');
                item.$overlayTitle = $('<div class="number_display_viz-overlay_title"></div>');
                item.$overlaySubTitle = $('<div class="number_display_viz-overlay_subtitle"></div>');
                item.$wrapc1 = $('<div class="number_display_viz-wrap_areachart"></div>').append(item.$canvas1);
                item.$wrapc2 = $('<div class="number_display_viz-wrap_main"></div>');
                item.$container = $('<div class="number_display_viz-wrap_item"></div>');
                item.$svg = $();
                item.$svgPulse = $();
                item.$container.append(item.$wrapc2, item.$wrapc1);
                viz.$container_wrap.append(item.$container);
                item.svgTextureId = "texture_" + viz.instance_id + "_" + item.id;

                // Drilldown only available if there is a title field
                if (item.title) {
                    item.$container.css("cursor","pointer").on("click", function(browserEvent){
                        var data = {};
                        if (viz.drilldown_field) {
                            data[viz.drilldown_field] = item.title;
                        } else {
                            data.title = item.title;
                        }
                        var defaultTokenModel = splunkjs.mvc.Components.get('default');
                        var submittedTokenModel = splunkjs.mvc.Components.get('submitted');
                        if (defaultTokenModel) {
                            defaultTokenModel.set("click.name", item.title);
                            defaultTokenModel.set("click.value", item.value);
                        } 
                        if (submittedTokenModel) {
                            submittedTokenModel.set("click.name", item.title);
                            submittedTokenModel.set("click.value", item.value);
                        }
                        if (viz.datamode !== 1) {
                            for (var k = 0; k < viz.data.fields.length; k++) {
                                var token_name = "row." + viz.sanitise(viz.data.fields[k].name);
                                console.log("Setting token $" +  token_name + "$ to \"" + viz.data.rows[item.id][k] + "\"");
                                if (defaultTokenModel) {
                                    defaultTokenModel.set(token_name, viz.data.rows[item.id][k]);
                                } 
                                if (submittedTokenModel) {
                                    submittedTokenModel.set(token_name, viz.data.rows[item.id][k]);
                                }
                            }
                        }
                         viz.drilldown({
                            action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                            data: data
                        }, browserEvent);
                    });
                }

                if (viz.config.subtitlealign !== "hide") {
                    item.$container.append(item.$overlaySubTitle);
                }
                if (viz.config.titlealign !== "hide") {
                    item.$container.append(item.$overlayTitle);
                }
                if (viz.config.textalign !== "hide") {
                    item.$container.append(item.$overlayText);
                }

                if (viz.config.style.substr(0,1) === "g") {
                        item.$canvas2.appendTo(item.$wrapc2);

                } else {
                    if (viz.config.style === "s0") {
                        // This is the splunk-esq one
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<circle cx="50" cy="50" r="47" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="226" stroke-linecap="round" stroke-width="1" transform="rotate(0 50 50)"><animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform></circle>'+
                        '<circle cx="50" cy="50" r="43" class="number_display_viz-stroke_secondary" stroke="#ffffff" fill="none" stroke-dasharray="44" stroke-linecap="round" stroke-width="1" transform="rotate(90 50 50)"><animateTransform attributeName="transform" type="rotate" values="360 50 50;0 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform></circle>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s1") {
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(71.019 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '<circle cx="50" cy="50" r="45" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="31 251" stroke-linecap="square" stroke-width="7" transform="rotate(0 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="45" class="number_display_viz-stroke_secondary" stroke="#ffffff" fill="none" stroke-dasharray="31 251" stroke-linecap="square" stroke-width="7" transform="rotate(90 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="45" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="31 251" stroke-linecap="square" stroke-width="7" transform="rotate(180 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="45" class="number_display_viz-stroke_secondary" stroke="#ffffff" fill="none" stroke-dasharray="31 251" stroke-linecap="square" stroke-width="7" transform="rotate(270 50 50)"></circle>'+
                        '</g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s2") {
                        // From https://loading.io/spinner/recycle/-recycle-spinner
                        item.$svg = $('<svg width="95%" height="95%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-6 0 106 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="translate(50,50)">'+
                        '<g transform="scale(1.0888888888888888)">'+
                        '<g transform="translate(-50,-50)">'+
                        '<g transform="rotate(142.836 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M12.2,25.7C19.4,14.4,31.5,6.6,45.6,5.2l3.8,7.7l-4.2,8.3c-8.1,1.3-15,6-19.4,12.5l-4.9-7.5L12.2,25.7z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M56,12.9l-4,8c8.2,0.6,15.5,4.6,20.5,10.6l9.3-0.6l4.7-7.2C78.8,13,66.3,5.7,52.1,5.1L56,12.9z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M85.1,36.7l-8.9,0.5c3.5,7.2,3.9,15.6,1.1,23.1l5.1,7.7l8.6,0.5c5.6-12.4,5.3-27.1-1-39.2L85.1,36.7z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M79.1,73.8l-4.9-7.5c-4.4,6.5-11.4,11.1-19.4,12.5l-4.2,8.3l3.8,7.7c14-1.4,26.1-9.2,33.4-20.5L79.1,73.8z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M14.9,63.3l8.9-0.5c-3.5-7.2-3.9-15.6-1.1-23.1L17.6,32L9,31.5c-5.6,12.4-5.3,27.1,1,39.2L14.9,63.3z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M44,87.1l4-8c-8.2-0.6-15.5-4.6-20.5-10.6l-9.3,0.6l-4.7,7.2C21.2,87,33.7,94.3,47.9,94.9L44,87.1z"></path>'+
                        '</g></g></g></g></svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s3") {
                        // This is the splunk-esq one
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<circle cx="50" cy="50" r="47" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="6.18" stroke-linecap="butt" stroke-width="1">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '</circle>'+
                        '<circle cx="50" cy="50" r="45" class="number_display_viz-fill_secondary" fill="#ffffff"></circle>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s4") {
                        // From https://loading.io/spinner/camera/-camera-aperture-ajax-spinner
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(356.226 50.0002 50.0002)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="360 50 50;0 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M54.3,28.1h34.2c-4.5-9.3-12.4-16.7-21.9-20.8L45.7,28.1L54.3,28.1L54.3,28.1z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M61.7,7.3C51.9,4,41.1,4.2,31.5,8.1v29.5l6.1-6.1L61.7,7.3C61.7,7.3,61.7,7.3,61.7,7.3z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M28.1,11.6c-9.3,4.5-16.7,12.4-20.8,21.9l20.8,20.8v-8.6L28.1,11.6C28.1,11.6,28.1,11.6,28.1,11.6z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M31.5,62.4L7.3,38.3c0,0,0,0,0,0C4,48.1,4.2,58.9,8.1,68.5h29.5L31.5,62.4z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M45.7,71.9H11.5c0,0,0,0,0,0c4.5,9.3,12.4,16.7,21.9,20.8l20.8-20.8H45.7z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M62.4,68.5L38.3,92.6c0,0,0,0,0,0c9.8,3.4,20.6,3.1,30.2-0.8V62.4L62.4,68.5z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M71.9,45.7v8.6v34.2c0,0,0,0,0,0c9.3-4.5,16.7-12.4,20.8-21.9L71.9,45.7z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M91.9,31.5C91.9,31.5,91.9,31.5,91.9,31.5l-29.5,0l0,0l6.1,6.1l24.1,24.1c0,0,0,0,0,0 C96,51.9,95.8,41.1,91.9,31.5z"></path>'+
                        '</g></svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s5") {
                        // From https://loading.io/spinner/vortex/-vortex-spiral-spinner
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(325.216 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="360 50 50;0 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M30.4,9.7c-7.4,10.9-11.8,23.8-12.3,37.9c0.2,1,0.5,1.9,0.7,2.8c1.4-5.2,3.4-10.3,6.2-15.1 c2.6-4.4,5.6-8.4,9-12c0.7-0.7,1.4-1.4,2.1-2.1c7.4-7,16.4-12,26-14.6C51.5,3.6,40.2,4.9,30.4,9.7z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M24.8,64.2c-2.6-4.4-4.5-9.1-5.9-13.8c-0.3-0.9-0.5-1.9-0.7-2.8c-2.4-9.9-2.2-20.2,0.4-29.8 C10.6,25.5,6,36,5.3,46.8C11,58.6,20,68.9,31.9,76.3c0.9,0.3,1.9,0.5,2.8,0.8C31,73.3,27.6,69,24.8,64.2z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M49.6,78.9c-5.1,0-10.1-0.6-14.9-1.8c-1-0.2-1.9-0.5-2.8-0.8c-9.8-2.9-18.5-8.2-25.6-15.2 c2.8,10.8,9.5,20,18.5,26c13.1,0.9,26.6-1.7,38.9-8.3c0.7-0.7,1.4-1.4,2.1-2.1C60.7,78.2,55.3,78.9,49.6,78.9z"></path>'+
                        '<path class="number_display_viz-fill_secondary" fill="#ffffff" d="M81.1,49.6c-1.4,5.2-3.4,10.3-6.2,15.1c-2.6,4.4-5.6,8.4-9,12c-0.7,0.7-1.4,1.4-2.1,2.1 c-7.4,7-16.4,12-26,14.6c10.7,3,22.1,1.7,31.8-3.1c7.4-10.9,11.8-23.8,12.3-37.9C81.6,51.5,81.4,50.6,81.1,49.6z"></path>'+
                        '<path class="number_display_viz-fill_secondary " fill="#ffffff" d="M75.2,12.9c-13.1-0.9-26.6,1.7-38.9,8.3c-0.7,0.7-1.4,1.4-2.1,2.1c5.2-1.4,10.6-2.2,16.2-2.2 c5.1,0,10.1,0.6,14.9,1.8c1,0.2,1.9,0.5,2.8,0.8c9.8,2.9,18.5,8.2,25.6,15.2C90.9,28.1,84.2,18.9,75.2,12.9z"></path>'+
                        '<path class="number_display_viz-fill_primary" fill="#ffffff" d="M94.7,53.2C89,41.4,80,31.1,68.1,23.7c-0.9-0.3-1.9-0.5-2.8-0.8c3.8,3.8,7.2,8.1,10,13 c2.6,4.4,4.5,9.1,5.9,13.8c0.3,0.9,0.5,1.9,0.7,2.8c2.4,9.9,2.2,20.2-0.4,29.8C89.4,74.5,94,64,94.7,53.2z"></path>'+
                        '</g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s6") {
                        // From https://loading.io/spinner/hud/-futuristic-game-interface-preloader
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="3 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<style type="text/css">.st2 { opacity: 0.3; }</style>'+
                        '<g transform="scale(1.2) "><g transform="translate(-9,-11)">'+
                        '<g class="st2" transform="rotate(0.0144043 53.064 52)">'+
                        '<path d="M36,61.9c-1.7-3-2.7-6.4-2.7-9.9c0-10.9,8.8-19.7,19.7-19.7v1c-10.3,0-18.8,8.4-18.8,18.8 c0,3.3,0.9,6.5,2.5,9.4L36,61.9z" class="number_display_viz-fill_secondary" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s"  repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g class="st2" transform="rotate(180.519 53.064 52)">'+
                        '<path d="M57,75.3l-0.5-3c9.9-1.7,17.2-10.2,17.2-20.3c0-11.4-9.2-20.6-20.6-20.6S32.5,40.6,32.5,52 c0,1.6,0.2,3.2,0.5,4.7l-3,0.7c-0.4-1.8-0.6-3.6-0.6-5.4c0-13.1,10.6-23.7,23.7-23.7S76.7,38.9,76.7,52 C76.7,63.6,68.4,73.4,57,75.3z"  class="number_display_viz-fill_secondary" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 53.064 52;360 53.064 52" keyTimes="0;1" class="number_display_viz-speed_05x" dur="5s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g  transform="rotate(0.0144043 53.064 52)">'+
                        '<path d="M90.5,45.4c-1.5-8.8-6.2-16.8-13-22.5l0,0c-3.4-2.9-7.3-5.1-11.4-6.6s-8.5-2.3-13-2.3v2.4v1.4v2.4 c3.7,0,7.4,0.6,10.9,1.9l0.8-2.3c0,0,0,0,0,0c3.7,1.4,7.2,3.4,10.3,5.9l1.2-1.5L75,25.8c0,0,0,0,0,0l-1.5,1.8 c5.7,4.8,9.6,11.5,10.9,18.8l3.8-0.7c0,0,0,0,0,0L90.5,45.4z" class="number_display_viz-fill_primary" fill="#ffffff"></path>'+
                        '<path d="M29.7,22l4.7,6.1c3.5-2.8,7.5-4.6,11.9-5.6l-1.7-7.5C39.2,16.2,34.2,18.5,29.7,22z" class="number_display_viz-fill_primary" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(180.519 53.064 52)">'+
                        '<path d="M53.1,92.4v-1c21.8,0,39.5-17.7,39.5-39.5c0-21.8-17.7-39.5-39.5-39.5c-15.8,0-30,9.4-36.2,23.8L15.9,36 c6.4-14.8,21-24.4,37.1-24.4c22.3,0,40.4,18.1,40.4,40.4C93.5,74.3,75.3,92.4,53.1,92.4z" class="number_display_viz-fill_primary" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 53.064 52;360 53.064 52" keyTimes="0;1" class="number_display_viz-speed_05x" dur="5s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g class="st2" transform="rotate(180.007 53.064 52)">'+
                        '<path d="M39.7,28.5l0.6,1c3.9-2.2,8.3-3.4,12.8-3.4V25C48.4,25,43.7,26.2,39.7,28.5z" class="number_display_viz-fill_secondary" fill="#ffffff"></path>'+
                        '<path d="M28.6,60.6l-1.1,0.4C31.3,71.8,41.6,79,53.1,79v-1.2C42.1,77.9,32.3,70.9,28.6,60.6z" class="number_display_viz-fill_secondary" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_15x" dur="15s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '</g></g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s7") {
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(8.69245 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '<circle cx="50" cy="50" r="47" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="2 6" stroke-linecap="round" stroke-width="1" transform="rotate(0 50 50)"  ></circle>'+
                        '<circle cx="50" cy="50" r="47" class="number_display_viz-stroke_secondary" stroke="#ffffff" fill="none" stroke-dasharray="2 6" stroke-linecap="round" stroke-width="1" transform="rotate(3 50 50)" ></circle>'+
                        '</g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s8") {
//<div>Icons made by <a href="https://www.flaticon.com/authors/mynamepong" title="mynamepong">mynamepong</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" 			    title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
                        item.$svg = $('<svg height="100%" width="100%" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">'+
                        '<path d="m440 0h-400c-22.082031.0273438-39.9726562 17.917969-40 40v400c.0273438 22.082031 17.917969 39.972656 40 40h400c22.082031-.027344 39.972656-17.917969 40-40v-400c-.027344-22.082031-17.917969-39.9726562-40-40zm-424 40c0-13.253906 10.746094-24 24-24h113.984375c-63.375 24.511719-113.472656 74.609375-137.984375 137.984375zm224-24c123.710938 0 224 100.289062 224 224s-100.289062 224-224 224-224-100.289062-224-224c.140625-123.652344 100.347656-223.859375 224-224zm-200 448c-13.253906 0-24-10.746094-24-24v-113.984375c24.511719 63.375 74.609375 113.472656 137.984375 137.984375zm424-24c0 13.253906-10.746094 24-24 24h-113.984375c63.375-24.511719 113.472656-74.609375 137.984375-137.984375zm-137.984375-424h113.984375c13.253906 0 24 10.746094 24 24v113.984375c-24.511719-63.375-74.609375-113.472656-137.984375-137.984375zm0 0" class="number_display_viz-fill_secondary" fill="#ffffff"/>'+
                        '<path d="m48 24c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0" class="number_display_viz-fill_secondary" fill="#ffffff"/>'+
                        '<path d="m48 408c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0" class="number_display_viz-fill_secondary" fill="#ffffff"/>'+
                        '<path d="m432 456c13.253906 0 24-10.746094 24-24s-10.746094-24-24-24-24 10.746094-24 24 10.746094 24 24 24zm0-32c4.417969 0 8 3.582031 8 8s-3.582031 8-8 8-8-3.582031-8-8 3.582031-8 8-8zm0 0" class="number_display_viz-fill_secondary" fill="#ffffff"/>'+
                        '<path d="m432 24c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0" class="number_display_viz-fill_secondary" fill="#ffffff"/>'+
                        '<g transform="rotate(360 240 240)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="0 240 240;360 240 240" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path d="m37.265625 212.800781c1.960937 1.828125 4.710937 2.550781 7.320313 1.925781 38.632812-9.273437 79.339843-3.765624 114.117187 15.449219-45.472656 4.953125-87.199219 27.523438-116.222656 62.878907-1.707031 2.070312-2.261719 4.859374-1.480469 7.425781 4.621094 15.171875 10.949219 29.773437 18.863281 43.519531 12.414063 21.550781 28.605469 40.6875 47.800781 56.503906 2.070313 1.726563 4.871094 2.296875 7.449219 1.511719s4.589844-2.8125 5.351563-5.398437c11.277344-38.105469 36.402344-70.609376 70.4375-91.121094-9.855469 22.195312-14.933594 46.21875-14.902344 70.503906.003906 21.039062 3.796875 41.90625 11.199219 61.601562.941406 2.511719 3.074219 4.386719 5.6875 4.992188 39.863281 9.273438 81.574219 6.582031 119.914062-7.738281 2.511719-.9375 4.386719-3.074219 4.992188-5.6875.601562-2.613281-.140625-5.355469-1.984375-7.304688-27.355469-28.820312-42.9375-66.832031-43.679688-106.558593 14.292969 19.621093 32.554688 36.015624 53.597656 48.121093 18.214844 10.519531 38.179688 17.667969 58.929688 21.101563.433594.074218.871094.109375 1.3125.113281 2.21875 0 4.335938-.921875 5.847656-2.542969 27.988282-29.886718 46.527344-67.367187 53.296875-107.746094.441407-2.644531-.472656-5.335937-2.4375-7.164062-1.960937-1.832031-4.707031-2.554688-7.316406-1.929688-38.632813 9.269532-79.339844 3.757813-114.121094-15.449218 24.148438-2.585938 47.480469-10.21875 68.488281-22.402344 18.214844-10.515625 34.386719-24.226562 47.738282-40.476562 1.707031-2.070313 2.261718-4.859376 1.480468-7.425782-4.605468-15.167968-10.914062-29.761718-18.808593-43.503906-12.414063-21.550781-28.605469-40.6875-47.800781-56.503906-2.070313-1.707032-4.855469-2.265625-7.425782-1.484375-2.566406.785156-4.570312 2.800781-5.335937 5.371093-11.265625 38.097657-36.378907 70.597657-70.398438 91.113282 9.828125-22.199219 14.878907-46.21875 14.824219-70.496094-.003906-21.039062-3.796875-41.90625-11.199219-61.601562-.941406-2.511719-3.074219-4.386719-5.6875-4.992188-39.863281-9.257812-81.570312-6.570312-119.914062 7.738281-2.511719.9375-4.386719 3.074219-4.992188 5.6875-.601562 2.613281.140625 5.355469 1.984375 7.304688 27.355469 28.820312 42.9375 66.832031 43.679688 106.558593-14.292969-19.621093-32.554688-36.015624-53.597656-48.121093-18.214844-10.519531-38.179688-17.667969-58.929688-21.101563-2.636719-.441406-5.320312.460938-7.160156 2.398438-28.011719 29.886718-46.574219 67.378906-53.351563 107.777344-.4375 2.640624.476563 5.324218 2.433594 7.152343zm202.734375-36.800781c31.207031-.03125 57.878906 22.460938 63.113281 53.226562 5.234375 30.761719-12.5 60.8125-41.960937 71.101563l-.113282.046875c-24.042968 8.453125-50.808593 1.839844-68.144531-16.84375-17.332031-18.679688-21.933593-45.867188-11.707031-69.210938s33.328125-38.394531 58.8125-38.320312zm-131.007812 204.398438c-23.636719-22.0625-41.3125-49.742188-51.390626-80.460938 11.578126-13.359375 25.308594-24.691406 40.613282-33.539062 19.050781-11.039063 40.207031-17.960938 62.097656-20.320313 1.328125 17.476563 8.390625 34.027344 20.09375 47.074219-32.785156 20.394531-57.898438 51.074218-71.414062 87.246094zm91.726562 47.523437c-13.085938-37.839844-11.390625-79.226563 4.738281-115.875 15.777344 7.65625 33.648438 9.863281 50.816407 6.28125 1.292968 38.539063 15.285156 75.566406 39.804687 105.328125-30.921875 9.417969-63.71875 10.886719-95.359375 4.265625zm226.402344-144.65625c-7.304688 31.5-22.445313 60.644531-44.015625 84.734375-39.308594-7.535156-74.269531-29.761719-97.769531-62.160156 14.359374-9.914063 25.097656-24.238282 30.59375-40.800782 34.027343 18.171876 73.109374 24.578126 111.160156 18.226563zm-56.113282-183.664063c23.636719 22.0625 41.3125 49.742188 51.390626 80.460938-11.578126 13.359375-25.308594 24.691406-40.613282 33.539062-19.050781 11.042969-40.203125 17.964844-62.097656 20.320313-1.328125-17.476563-8.390625-34.027344-20.09375-47.074219 32.785156-20.394531 57.898438-51.074218 71.414062-87.246094zm-91.726562-47.523437c13.085938 37.839844 11.390625 79.226563-4.738281 115.875-15.777344-7.65625-33.648438-9.863281-50.816407-6.28125-1.292968-38.539063-15.285156-75.566406-39.804687-105.328125 30.921875-9.417969 63.71875-10.886719 95.359375-4.265625zm-205.5625 91.921875c6.617188-11.433594 14.390625-22.15625 23.203125-32 17.347656 3.347656 34.015625 9.566406 49.316406 18.398438 19.027344 11.027343 35.53125 25.925781 48.441407 43.730468-14.355469 9.917969-25.089844 24.238282-30.582032 40.800782-34.042968-18.164063-73.132812-24.558594-111.1875-18.195313 4.28125-18.511719 11.296875-36.285156 20.808594-52.734375zm0 0" class="number_display_viz-fill_primary" fill="#ffffff"/>'+
                        '</g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s9") {
                        item.$svg = $('<svg height="100%" width="100%" viewBox="0 0 464 464" xmlns="http://www.w3.org/2000/svg">'+
                        '<g class="number_display_viz-fill_primary" fill="#ffffff">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="0 232 232;360 232 232" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path d="m161.96875 44.632812c29.589844 31.117188 46.070312 72.425782 46.03125 115.367188 0 4.335938-.164062 8.625-.496094 12.871094 19.3125-8.011719 41.324219-6.054688 58.921875 5.234375 24.296875-43.039063 28.285157-94.628907 10.886719-140.890625-38.339844-8.929688-78.464844-6.351563-115.34375 7.417968zm0 0"/>'+
                        '<path d="m34.71875 198.96875c41.746094-10.0625 85.761719-3.675781 122.929688 17.832031 3.734374 2.167969 7.367187 4.457031 10.902343 6.863281 2.714844-20.730468 15.410157-38.8125 33.984375-48.40625-25.121094-42.5625-67.800781-71.808593-116.558594-79.875-26.914062 28.726563-44.746093 64.761719-51.257812 103.585938zm0 0"/>'+
                        '<path d="m104.753906 386.328125c12.15625-41.175781 39.691406-76.097656 76.894532-97.527344 3.734374-2.171875 7.53125-4.175781 11.390624-6.007812-16.589843-12.71875-25.902343-32.757813-24.925781-53.640625-49.417969.476562-96.085937 22.808594-127.457031 60.992187 11.429688 37.671875 33.726562 71.132813 64.097656 96.183594zm0 0"/>'+
                        '<path d="m302.03125 419.367188c-29.589844-31.117188-46.070312-72.425782-46.03125-115.367188 0-4.335938.164062-8.625.496094-12.871094-19.3125 8.011719-41.324219 6.054688-58.921875-5.234375-24.296875 43.039063-28.285157 94.628907-10.886719 140.890625 38.339844 8.929688 78.464844 6.351563 115.34375-7.417968zm0 0"/>'+
                        '<path d="m429.28125 265.03125c-41.746094 10.0625-85.761719 3.675781-122.929688-17.832031-3.734374-2.167969-7.367187-4.457031-10.902343-6.863281-2.699219 20.75-15.394531 38.859374-33.984375 48.464843 25.121094 42.558594 67.800781 71.804688 116.558594 79.871094 26.917968-28.730469 44.746093-64.773437 51.257812-103.601563zm0 0"/>'+
                        '<path d="m359.246094 77.671875c-12.15625 41.175781-39.691406 76.097656-76.894532 97.527344-3.734374 2.167969-7.53125 4.167969-11.390624 6.007812 16.578124 12.710938 25.890624 32.730469 24.925781 53.601563 49.417969-.484375 96.085937-22.820313 127.457031-61.007813-11.429688-37.675781-33.726562-71.132812-64.097656-96.183593zm0 0"/>'+
                        '</g>'+
                        '<path d="m304 232c0 39.765625-32.234375 72-72 72s-72-32.234375-72-72 32.234375-72 72-72 72 32.234375 72 72zm0 0" fill="#bec3d1" class="number_display_viz-fill_primary" />'+
                        '</svg>').appendTo(item.$wrapc2);

                     } else if (viz.config.style === "s10") {
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(71.019 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '<circle cx="50" cy="50" r="46" class="number_display_viz-stroke_secondary" stroke="#ffffff" fill="none" stroke-linecap="butt" stroke-width="7"></circle>'+
                        '<circle cx="50" cy="50" r="46" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="12.1" stroke-linecap="butt" stroke-width="7" transform="rotate(0 50 50)"></circle>'+
                        '</g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "s11") {
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(71.019 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '<circle cx="50" cy="50" r="46" class="number_display_viz-stroke_secondary" stroke="#ffffff" fill="none" stroke-linecap="butt" stroke-width="7"></circle>'+
                        '<circle cx="50" cy="50" r="46" class="number_display_viz-stroke_primary" stroke="#ffffff" fill="none" stroke-dasharray="12.1" stroke-linecap="butt" stroke-width="3" transform="rotate(0 50 50)"></circle>'+
                        '</g>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "path") {
                        var antsize = Number(viz.config.pathantsize);
                        var antgap = Number(viz.config.pathantgap);
                        if (viz.config.pathshape === "round") {
                            antsize = Math.max(0, antsize - Number(viz.config.pathwidth));
                            antgap = antgap + Number(viz.config.pathwidth);
                        }
                        var dashoffset = (antsize + antgap);
                        item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="' + viz.config.pathviewbox + '" preserveAspectRatio="xMidYMid">'+
                        '<path d="' + viz.config.path + '" class="number_display_viz-stroke_secondary" fill="none" stroke-width="' + viz.config.pathwidth + '" stroke-linecap="' + viz.config.pathshape + '" stroke-linejoin="' + viz.config.pathjoin + '" />'+
                        '<path d="' + viz.config.path + '" class="number_display_viz-stroke_primary" fill="none" stroke-width="' + viz.config.pathwidth + '"  stroke-linecap="' + viz.config.pathshape + '" stroke-linejoin="' + viz.config.pathjoin + '"'+
                        ' stroke-dashoffset="' + dashoffset + '" stroke-dasharray="' + antsize + ' ' + antgap + '">'+
                        '<animate attributeName="stroke-dashoffset" dur="1s" class="number_display_viz-speed_1x" repeatCount="indefinite" keyTimes="0;1" values="' + dashoffset + ';0" />'+
                        '</path>'+
                        '</svg>').appendTo(item.$wrapc2);

                    } else if (viz.config.style === "a1") { // square
                        item.svgViewbox = "0 0 100 100";
                        item.svgString = '<rect x="5" y="5" width="90" height="90" class="number_display_viz-shape" />';

                    } else if (viz.config.style === "a2") { // square
                        item.svgViewbox = "0 0 100 100";
                        item.svgString = '<path d="M 10 5 h 80 a 5,5 0 0 1 5,5 v80 a5,5 0 0 1 -5,5 h-80 a5,5 0 0 1 -5,-5 v-80 a5,5 0 0 1 5,-5 z" class="number_display_viz-shape"></path>';

                    } else if (viz.config.style === "a3") { // rect 1
                        item.svgViewbox = "0 0 100 50";
                        item.svgString = '<rect x="2.5" y="2.5" width="95" height="45" class="number_display_viz-shape" />';

                    } else if (viz.config.style === "a4") { // rect 2
                        item.svgViewbox = "0 0 100 50";
                        item.svgString = '<path d="M 5 2.5 h 90 a 2.5,2.5 0 0 1 2.5,2.5 v40 a2.5,2.5 0 0 1 -2.5,2.5 h-90 a2.5,2.5 0 0 1 -2.5,-2.5 v-40 a2.5,2.5 0 0 1 2.5,-2.5 z" class="number_display_viz-shape"></path>';

                    } else if (viz.config.style === "a5") { // circle
                        item.svgViewbox = "0 0 100 100";
                        item.svgString = '<circle cx="50" cy="50" r="45" class="number_display_viz-shape" />';

                    } else if (viz.config.style === "a6") { // big ring
                        item.svgViewbox = "0 0 100 100";
                        item.svgString = '<path d="M 50 5 A 45 45 0 1 0 50 95 A 45 45 0 1 0 50 5 Z M 50 30 A 20 20 0 1 1 50 70 A 20 20 0 1 1 50 30 Z" class="number_display_viz-shape" />';

                    } else if (viz.config.style === "a7") { // little ring
                        item.svgViewbox = "0 0 100 100";
                        item.svgString = '<path d="M 50 5 A 45 45 0 1 0 50 95 A 45 45 0 1 0 50 5 Z M 50 15 A 35 35 0 1 1 50 85 A 35 35 0 1 1 50 15 Z" class="number_display_viz-shape" />';

                    } else if (viz.config.style === "a8") { // Hex 1
                        item.svgViewbox = "-2.5 -2.5 105 105";
                        item.svgString = '<polygon points="100,50 75,93 25,93 0,50 25,7 75,7" class="number_display_viz-shape"></polygon>';

                    } else if (viz.config.style === "a9") { // Hex 2
                        // from here: https://codepen.io/wvr/pen/WrNgJp
                        item.svgViewbox = "0 0 100 87";
                        item.svgString = '<path d="M2.5 47.6 Q 0 43 2.5 39 L 22.5 4.3 Q 25 0 30 0 L 70 0 Q 75 0 77.5 4 L 97.5 39 Q 100 43 97.5 47.6 L 77.5 82 Q 75 86.6 70 86.6 L 30 86.6 Q 25 86.6 22.5 82 Z" class="number_display_viz-shape">';

                    } else if (viz.config.style === "a10") { // Hex 3
                        item.svgViewbox = "-2.5 -2.5 105 105";
                        item.svgString = '<polygon points="100,50 75,93 25,93 0,50 25,7 75,7" class="number_display_viz-shape"  transform="rotate(90 50 50)"></polygon>';

                    } else if (viz.config.style === "a11") { // Hex 4
                        item.svgViewbox = "0 0 87 100";
                        item.svgString = '<path d="M39 2.5 Q 43 0 48 2.5 L 82 22.5 Q 86.6 25 86.6 30L86.6 70 Q 86.6 75 82.3 77.5 L 47.6 97.5 Q 43.3 100 39 97.5 L 4.3 77.5 Q 0 75 0 70 L 0 30 Q 0 25 4.3 22.5 Z" class="number_display_viz-shape">';

                    } else if (viz.config.style === "a12") { // fill
                        // need to use a multipler to get the viewbox max size to be ~100 becuase otherwise the texture wont be consistant
                        vbmultipler = 100 / Math.max(viz.size, (viz.size * viz.config.mainHeight));
                        item.svgViewbox = "0 0 " + (viz.size * vbmultipler) + " " + (viz.size * viz.config.mainHeight * vbmultipler);
                        item.svgString = '<rect x="' + (5 * vbmultipler) + '" y="' + (5 * vbmultipler) + '" width="' + ((viz.size - 10) * vbmultipler) + '" height="' + ((viz.size * viz.config.mainHeight - 10) * vbmultipler) + '" class="number_display_viz-shape" />';

                    } else if (viz.config.style === "a13") { // fill
                        vbmultipler = 100 / Math.max(viz.size, (viz.size * viz.config.mainHeight));
                        var svgaradius = (viz.size * 0.025 * vbmultipler);
                        item.svgViewbox = "0 0 " + (viz.size * vbmultipler) + " " + (viz.size * viz.config.mainHeight * vbmultipler);
                        item.svgString = '<path d="M ' + (5 * vbmultipler + svgaradius) + ' ' + (5 * vbmultipler) + ' h ' + ((viz.size - 10) * vbmultipler - 2 * svgaradius) + ' a ' + svgaradius + ',' + svgaradius + ' 0 0 1 ' + svgaradius + ',' + svgaradius + ' v' + ((viz.size * viz.config.mainHeight - 10) * vbmultipler - 2 * svgaradius) + ' a' + svgaradius + ',' + svgaradius + ' 0 0 1 -' + svgaradius + ',' + svgaradius + ' h-' + ((viz.size - 10) * vbmultipler - 2 * svgaradius) + ' a' + svgaradius + ',' + svgaradius + ' 0 0 1 -' + svgaradius + ',-' + svgaradius + ' v-' + ((viz.size * viz.config.mainHeight - 10) * vbmultipler - 2 * svgaradius) + ' a' + svgaradius + ',' + svgaradius + ' 0 0 1 ' + svgaradius + ',-' + svgaradius + ' z" class="number_display_viz-shape"></path>';

                    }
                }
                // Shapes
                if (viz.config.style.substr(0,1) === "a") {
                    // Add the texture
                    if (viz.config.shapetexture === "solid") {
                        item.svgGradient = '<defs><linearGradient id="' + item.svgTextureId + '" x1="0%" y1="0%" x2="0%" y2="100%">'+
                        '<stop offset="0%" stop-color="rgb(255,255,0)" stop-opacity="1" class="number_display_viz-stop_primary"/>'+
                        '<stop offset="100%" stop-color="rgb(255,0,0)" stop-opacity="1" class="number_display_viz-stop_secondary" />'+
                        '</linearGradient></defs>';

                    } else if (viz.config.shapetexture === "triangles") { // https://www.svgbackgrounds.com/#subtle-prism
                        // FYI You cant insert defs after the svg has been created
                        item.svgGradient = "<defs><pattern id='" + item.svgTextureId + "' patternUnits='userSpaceOnUse' width='270' height='225' x='-10' y='-10'><svg xmlns='http://www.w3.org/2000/svg'  width='270' height='225' viewBox='0 0 1080 900'><defs><linearGradient id='" + item.svgTextureId + "a' gradientUnits='userSpaceOnUse' x1='0' x2='0' y1='0' y2='50%' ><stop offset='0' stop-color='#0fd3ff' class='number_display_viz-stop_primary'/><stop offset='1' stop-color='#4FE' class='number_display_viz-stop_secondary'/></linearGradient><pattern patternUnits='userSpaceOnUse' id='b' width='300' height='250' x='0' y='0' viewBox='0 0 1080 900'><g fill-opacity='0.06'><polygon fill='#444' points='90 150 0 300 180 300'/><polygon points='90 150 180 0 0 0'/><polygon fill='#AAA' points='270 150 360 0 180 0'/><polygon fill='#DDD' points='450 150 360 300 540 300'/><polygon fill='#999' points='450 150 540 0 360 0'/><polygon points='630 150 540 300 720 300'/><polygon fill='#DDD' points='630 150 720 0 540 0'/><polygon fill='#444' points='810 150 720 300 900 300'/><polygon fill='#FFF' points='810 150 900 0 720 0'/><polygon fill='#DDD' points='990 150 900 300 1080 300'/><polygon fill='#444' points='990 150 1080 0 900 0'/><polygon fill='#DDD' points='90 450 0 600 180 600'/><polygon points='90 450 180 300 0 300'/><polygon fill='#666' points='270 450 180 600 360 600'/><polygon fill='#AAA' points='270 450 360 300 180 300'/><polygon fill='#DDD' points='450 450 360 600 540 600'/><polygon fill='#999' points='450 450 540 300 360 300'/><polygon fill='#999' points='630 450 540 600 720 600'/><polygon fill='#FFF' points='630 450 720 300 540 300'/><polygon points='810 450 720 600 900 600'/><polygon fill='#DDD' points='810 450 900 300 720 300'/><polygon fill='#AAA' points='990 450 900 600 1080 600'/><polygon fill='#444' points='990 450 1080 300 900 300'/><polygon fill='#222' points='90 750 0 900 180 900'/><polygon points='270 750 180 900 360 900'/><polygon fill='#DDD' points='270 750 360 600 180 600'/><polygon points='450 750 540 600 360 600'/><polygon points='630 750 540 900 720 900'/><polygon fill='#444' points='630 750 720 600 540 600'/><polygon fill='#AAA' points='810 750 720 900 900 900'/><polygon fill='#666' points='810 750 900 600 720 600'/><polygon fill='#999' points='990 750 900 900 1080 900'/><polygon fill='#999' points='180 0 90 150 270 150'/><polygon fill='#444' points='360 0 270 150 450 150'/><polygon fill='#FFF' points='540 0 450 150 630 150'/><polygon points='900 0 810 150 990 150'/><polygon fill='#222' points='0 300 -90 450 90 450'/><polygon fill='#FFF' points='0 300 90 150 -90 150'/><polygon fill='#FFF' points='180 300 90 450 270 450'/><polygon fill='#666' points='180 300 270 150 90 150'/><polygon fill='#222' points='360 300 270 450 450 450'/><polygon fill='#FFF' points='360 300 450 150 270 150'/><polygon fill='#444' points='540 300 450 450 630 450'/><polygon fill='#222' points='540 300 630 150 450 150'/><polygon fill='#AAA' points='720 300 630 450 810 450'/><polygon fill='#666' points='720 300 810 150 630 150'/><polygon fill='#FFF' points='900 300 810 450 990 450'/><polygon fill='#999' points='900 300 990 150 810 150'/><polygon points='0 600 -90 750 90 750'/><polygon fill='#666' points='0 600 90 450 -90 450'/><polygon fill='#AAA' points='180 600 90 750 270 750'/><polygon fill='#444' points='180 600 270 450 90 450'/><polygon fill='#444' points='360 600 270 750 450 750'/><polygon fill='#999' points='360 600 450 450 270 450'/><polygon fill='#666' points='540 600 630 450 450 450'/><polygon fill='#222' points='720 600 630 750 810 750'/><polygon fill='#FFF' points='900 600 810 750 990 750'/><polygon fill='#222' points='900 600 990 450 810 450'/><polygon fill='#DDD' points='0 900 90 750 -90 750'/><polygon fill='#444' points='180 900 270 750 90 750'/><polygon fill='#FFF' points='360 900 450 750 270 750'/><polygon fill='#AAA' points='540 900 630 750 450 750'/><polygon fill='#FFF' points='720 900 810 750 630 750'/><polygon fill='#222' points='900 900 990 750 810 750'/><polygon fill='#222' points='1080 300 990 450 1170 450'/><polygon fill='#FFF' points='1080 300 1170 150 990 150'/><polygon points='1080 600 990 750 1170 750'/><polygon fill='#666' points='1080 600 1170 450 990 450'/><polygon fill='#DDD' points='1080 900 1170 750 990 750'/></g></pattern></defs><rect x='0' y='0' fill='url(#" + item.svgTextureId + "a)' width='100%' height='100%'/><rect x='0' y='0' fill='url(#b)' width='100%' height='100%'/></svg></pattern></defs>";

                    } else if (viz.config.shapetexture === "Squares") { // https://www.svgbackgrounds.com/#randomized-pattern
item.svgGradient = "<defs><pattern id='" + item.svgTextureId + "' patternUnits='userSpaceOnUse' width='120' height='120' x='0' y='0'><svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 1000 1000'>"+
"<defs><pattern id='" + item.svgTextureId + "a' patternUnits='userSpaceOnUse' width='100' height='100'><rect x='0' y='0' width='100' height='100' fill='#F29E03'  class='number_display_viz-fill_primary'/><rect x='0' y='0' width='80' height='80' fill-opacity='0.2' fill='#ffa61d'  class='number_display_viz-fill_secondary'/></pattern></defs><rect x='0' y='0' width='1000' height='1000' fill='url(#" + item.svgTextureId + "a)'/></svg></pattern></defs>";

                    } else if (viz.config.shapetexture === "texture3") { // https://www.svgbackgrounds.com/#wintery-sunburst centered
item.svgGradient = "<defs><pattern id='" + item.svgTextureId + "' patternUnits='userSpaceOnUse' width='140' height='140' x='-20' y='-20'><svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' x='0' y='0' viewBox='0 0 800 800'><defs><radialGradient id='" + item.svgTextureId + "a' cx='400' cy='400' r='50%' gradientUnits='userSpaceOnUse'><stop offset='0' stop-color='#ffffff' class='number_display_viz-stop_secondary'/><stop offset='1' stop-color='#ff0000' class='number_display_viz-stop_primary'/></radialGradient><radialGradient id='" + item.svgTextureId + "b' cx='400' cy='400' r='70%' gradientUnits='userSpaceOnUse'><stop offset='0' stop-color='#ffffff' class='number_display_viz-stop_secondary'/><stop offset='1' stop-color='#ff0000' class='number_display_viz-stop_primary'/></radialGradient></defs><rect fill='url(#" + item.svgTextureId + "a)' width='800' height='800'/><g fill-opacity='.8'><path fill='url(#" + item.svgTextureId + "b)' d='M998.7 439.2c1.7-26.5 1.7-52.7 0.1-78.5L401 399.9c0 0 0-0.1 0-0.1l587.6-116.9c-5.1-25.9-11.9-51.2-20.3-75.8L400.9 399.7c0 0 0-0.1 0-0.1l537.3-265c-11.6-23.5-24.8-46.2-39.3-67.9L400.8 399.5c0 0 0-0.1-0.1-0.1l450.4-395c-17.3-19.7-35.8-38.2-55.5-55.5l-395 450.4c0 0-0.1 0-0.1-0.1L733.4-99c-21.7-14.5-44.4-27.6-68-39.3l-265 537.4c0 0-0.1 0-0.1 0l192.6-567.4c-24.6-8.3-49.9-15.1-75.8-20.2L400.2 399c0 0-0.1 0-0.1 0l39.2-597.7c-26.5-1.7-52.7-1.7-78.5-0.1L399.9 399c0 0-0.1 0-0.1 0L282.9-188.6c-25.9 5.1-51.2 11.9-75.8 20.3l192.6 567.4c0 0-0.1 0-0.1 0l-265-537.3c-23.5 11.6-46.2 24.8-67.9 39.3l332.8 498.1c0 0-0.1 0-0.1 0.1L4.4-51.1C-15.3-33.9-33.8-15.3-51.1 4.4l450.4 395c0 0 0 0.1-0.1 0.1L-99 66.6c-14.5 21.7-27.6 44.4-39.3 68l537.4 265c0 0 0 0.1 0 0.1l-567.4-192.6c-8.3 24.6-15.1 49.9-20.2 75.8L399 399.8c0 0 0 0.1 0 0.1l-597.7-39.2c-1.7 26.5-1.7 52.7-0.1 78.5L399 400.1c0 0 0 0.1 0 0.1l-587.6 116.9c5.1 25.9 11.9 51.2 20.3 75.8l567.4-192.6c0 0 0 0.1 0 0.1l-537.3 265c11.6 23.5 24.8 46.2 39.3 67.9l498.1-332.8c0 0 0 0.1 0.1 0.1l-450.4 395c17.3 19.7 35.8 38.2 55.5 55.5l395-450.4c0 0 0.1 0 0.1 0.1L66.6 899c21.7 14.5 44.4 27.6 68 39.3l265-537.4c0 0 0.1 0 0.1 0L207.1 968.3c24.6 8.3 49.9 15.1 75.8 20.2L399.8 401c0 0 0.1 0 0.1 0l-39.2 597.7c26.5 1.7 52.7 1.7 78.5 0.1L400.1 401c0 0 0.1 0 0.1 0l116.9 587.6c25.9-5.1 51.2-11.9 75.8-20.3L400.3 400.9c0 0 0.1 0 0.1 0l265 537.3c23.5-11.6 46.2-24.8 67.9-39.3L400.5 400.8c0 0 0.1 0 0.1-0.1l395 450.4c19.7-17.3 38.2-35.8 55.5-55.5l-450.4-395c0 0 0-0.1 0.1-0.1L899 733.4c14.5-21.7 27.6-44.4 39.3-68l-537.4-265c0 0 0-0.1 0-0.1l567.4 192.6c8.3-24.6 15.1-49.9 20.2-75.8L401 400.2c0 0 0-0.1 0-0.1L998.7 439.2z'/></g></svg></pattern></defs>";

                    } else if (viz.config.shapetexture === "texture4") { // https://www.svgbackgrounds.com/#wintery-sunburst offset
item.svgGradient = "<defs><pattern id='" + item.svgTextureId + "' patternUnits='userSpaceOnUse' width='200' height='200' x='0' y='0'><svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' x='0' y='0' viewBox='0 0 800 800'><defs><radialGradient id='" + item.svgTextureId + "a' cx='400' cy='400' r='50%' gradientUnits='userSpaceOnUse'><stop offset='0' stop-color='#ffffff' class='number_display_viz-stop_secondary'/><stop offset='1' stop-color='#ff0000' class='number_display_viz-stop_primary'/></radialGradient><radialGradient id='" + item.svgTextureId + "b' cx='400' cy='400' r='70%' gradientUnits='userSpaceOnUse'><stop offset='0' stop-color='#ffffff' class='number_display_viz-stop_secondary'/><stop offset='1' stop-color='#ff0000' class='number_display_viz-stop_primary'/></radialGradient></defs><rect fill='url(#" + item.svgTextureId + "a)' width='800' height='800'/><g fill-opacity='.8'><path fill='url(#" + item.svgTextureId + "b)' d='M998.7 439.2c1.7-26.5 1.7-52.7 0.1-78.5L401 399.9c0 0 0-0.1 0-0.1l587.6-116.9c-5.1-25.9-11.9-51.2-20.3-75.8L400.9 399.7c0 0 0-0.1 0-0.1l537.3-265c-11.6-23.5-24.8-46.2-39.3-67.9L400.8 399.5c0 0 0-0.1-0.1-0.1l450.4-395c-17.3-19.7-35.8-38.2-55.5-55.5l-395 450.4c0 0-0.1 0-0.1-0.1L733.4-99c-21.7-14.5-44.4-27.6-68-39.3l-265 537.4c0 0-0.1 0-0.1 0l192.6-567.4c-24.6-8.3-49.9-15.1-75.8-20.2L400.2 399c0 0-0.1 0-0.1 0l39.2-597.7c-26.5-1.7-52.7-1.7-78.5-0.1L399.9 399c0 0-0.1 0-0.1 0L282.9-188.6c-25.9 5.1-51.2 11.9-75.8 20.3l192.6 567.4c0 0-0.1 0-0.1 0l-265-537.3c-23.5 11.6-46.2 24.8-67.9 39.3l332.8 498.1c0 0-0.1 0-0.1 0.1L4.4-51.1C-15.3-33.9-33.8-15.3-51.1 4.4l450.4 395c0 0 0 0.1-0.1 0.1L-99 66.6c-14.5 21.7-27.6 44.4-39.3 68l537.4 265c0 0 0 0.1 0 0.1l-567.4-192.6c-8.3 24.6-15.1 49.9-20.2 75.8L399 399.8c0 0 0 0.1 0 0.1l-597.7-39.2c-1.7 26.5-1.7 52.7-0.1 78.5L399 400.1c0 0 0 0.1 0 0.1l-587.6 116.9c5.1 25.9 11.9 51.2 20.3 75.8l567.4-192.6c0 0 0 0.1 0 0.1l-537.3 265c11.6 23.5 24.8 46.2 39.3 67.9l498.1-332.8c0 0 0 0.1 0.1 0.1l-450.4 395c17.3 19.7 35.8 38.2 55.5 55.5l395-450.4c0 0 0.1 0 0.1 0.1L66.6 899c21.7 14.5 44.4 27.6 68 39.3l265-537.4c0 0 0.1 0 0.1 0L207.1 968.3c24.6 8.3 49.9 15.1 75.8 20.2L399.8 401c0 0 0.1 0 0.1 0l-39.2 597.7c26.5 1.7 52.7 1.7 78.5 0.1L400.1 401c0 0 0.1 0 0.1 0l116.9 587.6c25.9-5.1 51.2-11.9 75.8-20.3L400.3 400.9c0 0 0.1 0 0.1 0l265 537.3c23.5-11.6 46.2-24.8 67.9-39.3L400.5 400.8c0 0 0.1 0 0.1-0.1l395 450.4c19.7-17.3 38.2-35.8 55.5-55.5l-450.4-395c0 0 0-0.1 0.1-0.1L899 733.4c14.5-21.7 27.6-44.4 39.3-68l-537.4-265c0 0 0-0.1 0-0.1l567.4 192.6c8.3-24.6 15.1-49.9 20.2-75.8L401 400.2c0 0 0-0.1 0-0.1L998.7 439.2z'/></g></svg></pattern></defs>";

                    } else if (viz.config.shapetexture === "texture5") { // https://www.svgbackgrounds.com/#randomized-pattern
item.svgGradient = "<defs><pattern id='" + item.svgTextureId + "' patternUnits='userSpaceOnUse' width='120' height='120' x='0' y='0'><svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 1000 1000'>"+
"<defs><pattern id='" + item.svgTextureId + "a' patternUnits='userSpaceOnUse' width='100' height='100'><rect x='0' y='0' width='100' height='100' fill='#F29E03'  class='number_display_viz-fill_primary'/><rect x='0' y='0' width='50' height='100' fill-opacity='0.2' fill='#ffa61d'  class='number_display_viz-fill_secondary'/></pattern></defs><rect x='0' y='0' width='1000' height='1000' fill='url(#" + item.svgTextureId + "a)'/></svg></pattern></defs>";

                    } else if (viz.config.shapetexture === "texture6") { // https://www.svgbackgrounds.com/#randomized-pattern
item.svgGradient = "<defs><pattern id='" + item.svgTextureId + "' patternUnits='userSpaceOnUse' width='120' height='120' x='0' y='0'><svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 1000 1000'>"+
"<defs><pattern id='" + item.svgTextureId + "a' patternUnits='userSpaceOnUse' width='100' height='100'><rect x='0' y='0' width='100' height='100' fill='#F29E03'  class='number_display_viz-fill_primary'/><rect x='0' y='0' width='100' height='50' fill-opacity='0.2' fill='#ffa61d'  class='number_display_viz-fill_secondary'/></pattern></defs><rect x='0' y='0' width='1000' height='1000' fill='url(#" + item.svgTextureId + "a)'/></svg></pattern></defs>";

                    }

                    item.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="' + item.svgViewbox + '" preserveAspectRatio="xMidYMid">'+ item.svgGradient + item.svgString + '</svg>');
                    item.$svgShape = item.$svg.find(".number_display_viz-shape");
                    item.$svgShape.attr("fill", "url(#" + item.svgTextureId + ")");
                    item.$svg.appendTo(item.$wrapc2);

                    item.$svgPulse = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="' + item.svgViewbox + '" preserveAspectRatio="xMidYMid" style="position: absolute; top: 0; left: 0; opacity: 0.25; transform: scale(1); transition: transform,opacity 2s,2s;">' + item.svgGradient + item.svgString + '</svg>');
                    item.$svgPulseShape = item.$svgPulse.find(".number_display_viz-shape");
                    item.$svgPulseShape.attr("fill", "url(#" + item.svgTextureId + ")");
                    item.$svgPulse.prependTo(item.$wrapc2);
                    
                    // Add the drop shadow to shapes
                    if (viz.config.shapeshadow === "yes") { 
                        item.$svg.css("filter", "drop-shadow(" + tinycolor(viz.config.shapedropcolor).setAlpha(0.5).toRgbString() + " 0px 0px " + Math.min(10, (viz.size * viz.config.mainHeight * 0.03)) + "px)");
                    }
                }
                item.$svgFillPrimary = item.$svg.find(".number_display_viz-fill_primary").add(item.$svgPulse.find(".number_display_viz-fill_primary"));
                item.$svgFillSecondary = item.$svg.find(".number_display_viz-fill_secondary").add(item.$svgPulse.find(".number_display_viz-fill_secondary"));
                item.$svgStrokePrimary = item.$svg.find(".number_display_viz-stroke_primary").add(item.$svgPulse.find(".number_display_viz-stroke_primary"));
                item.$svgStrokeSecondary = item.$svg.find(".number_display_viz-stroke_secondary").add(item.$svgPulse.find(".number_display_viz-stroke_secondary"));
                item.$svgStopPrimary = item.$svg.find(".number_display_viz-stop_primary").add(item.$svgPulse.find(".number_display_viz-stop_primary"));
                item.$svgStopSecondary = item.$svg.find(".number_display_viz-stop_secondary").add(item.$svgPulse.find(".number_display_viz-stop_secondary"));

                item.$svgSpeed1 = item.$svg.find(".number_display_viz-speed_1x");
                item.$svgSpeed05 = item.$svg.find(".number_display_viz-speed_05x");
                item.$svgSpeed15 = item.$svg.find(".number_display_viz-speed_15x");
            
                if (viz.config.sparkorder === "fg") {
                    item.$wrapc1.css("z-index", 2);
                } else if (viz.config.sparkorder === "bg") {
                    item.$wrapc2.css("z-index", 2);
                }

                item.height = (viz.size * viz.config.mainHeight);
                item.width = (viz.size * viz.config.mainWidth);
                item.$container.css({
                    "height": item.height + "px", 
                    "width": item.width + "px",
                    "margin": viz.padding + "px"
                });

                if (viz.paddingtoppercent !== null) {
                    if (viz.item.length === 1) { 
                        item.$container.css({"margin": viz.paddingtoppixels + "px auto"});
                    } else {
                        item.$container.css({"margin": viz.paddingtoppixels + "px " + viz.paddingleftpixels + "px"});
                    }
                } else {
                    if (viz.item.length === 1) { 
                        item.$container.css({"margin": "10px auto"});
                    } else if (viz.rows > 1.05) {
                        item.$container.css({"margin": viz.paddingleftpixels + "px"});
                    } else {
                        item.$container.css({"margin": "10px " + viz.paddingleftpixels + "px"});
                    }
                }

                // Sparkline
                item.heightSpark = item.height * (viz.config.sparkHeight / 100);
                item.widthSpark = item.width * (viz.config.sparkWidth / 100) ;
                item.$canvas1[0].height = item.heightSpark;
                item.$canvas1[0].width = item.widthSpark;
                item.$wrapc1.css({
                    "top": (item.height * (viz.config.sparkalignv / 100)) + "px",
                    "left": (item.width * (viz.config.sparkalign / 100)) + "px",
                    "height": item.heightSpark + "px",
                    "width": item.widthSpark + "px",
                });

                // Text Value overlay
                var textfontsize = (item.height * 0.2 * (Number(viz.config.textsize) / 100));
                item.$overlayText.css({
                    "font-size": textfontsize + "px", 
                    "line-height": (textfontsize * 1.1) + "px", 
                    "margin-top": (item.height * (viz.config.textalignv / 100) - (textfontsize * 0.5)) + "px", 
                    "height" : (textfontsize * 2) + "px",
                    "width": (item.width * 0.9) + "px",
                    "margin-left": ((item.width * 0.9) / 2 * -1) + "px", 
                    "left": "50%",
                    "text-align": viz.config.textalign,
                }).addClass(viz.config.textfont);

                if (viz.config.textalign === "left") {
                    item.$overlayText.css({"padding-left": item.width * 0.075 + "px"});
                } else if (viz.config.textalign === "right") {
                    item.$overlayText.css({"padding-right": item.width * 0.075 + "px"});
                }

                if (viz.config.textdrop === "yes") {
                    item.$overlayText.css({"text-shadow": "1px 1px 1px " + viz.config.textdropcolor});
                }

                if (viz.config.textmode === "static") {
                    item.$overlayText.css({"color": viz.config.textcolor});
                }
                // Title overlay
                var titlefontsize = (item.height * 0.2 * (Number(viz.config.titlesize) / 100));
                item.$overlayTitle.css({
                    "font-size": titlefontsize + "px", 
                    "margin-top": (item.height * (viz.config.titlealignv / 100) - (titlefontsize * 0.5)) + "px", 
                    "width": (item.width * 0.9) + "px",
                    "margin-left": ((item.width * 0.9) / 2 * -1) + "px", 
                    "left": "50%",
                    "text-align": viz.config.titlealign,
                }).addClass(viz.config.titlefont);

                if (viz.config.titlealign === "left") {
                    item.$overlayTitle.css({"padding-left": item.width * 0.075 + "px"});
                } else if (viz.config.titlealign === "right") {
                    item.$overlayTitle.css({"padding-right": item.width * 0.075 + "px"});
                }
                if (viz.config.titledrop === "yes") {
                    item.$overlayTitle.css({"text-shadow": "1px 1px 1px " + viz.config.titledropcolor});
                }
                if (viz.config.titlecolormode === "static") {
                    item.$overlayTitle.css({"color": viz.config.titlecolor});
                }

                // SubTitle overlay
                var subtitlefontsize = (item.height * 0.2 * (Number(viz.config.subtitlesize) / 100));
                item.$overlaySubTitle.css({
                    "font-size": subtitlefontsize + "px", 
                    "margin-top": (item.height * (viz.config.subtitlealignv / 100) - (subtitlefontsize * 0.5)) + "px", 
                    "width": (item.width * 0.9) + "px",
                    "margin-left": ((item.width * 0.9) / 2 * -1) + "px", 
                    "left": "50%",
                    "text-align": viz.config.subtitlealign,
                }).addClass(viz.config.subtitlefont);

                if (viz.config.subtitlealign === "left") {
                    item.$overlaySubTitle.css({"padding-left": item.width * 0.075 + "px"});
                } else if (viz.config.subtitlealign === "right") {
                    item.$overlaySubTitle.css({"padding-right": item.width * 0.075 + "px"});
                }
                if (viz.config.subtitledrop === "yes") {
                    item.$overlaySubTitle.css({"text-shadow": "1px 1px 1px " + viz.config.subtitledropcolor});
                }
                if (viz.config.subtitlecolormode === "static") {
                    item.$overlaySubTitle.css({"color": viz.config.subtitlecolor});
                }                

                if (viz.config.style.substr(0,1) === "g") {
                    item.$canvas2[0].height = viz.size * viz.config.mainHeight;
                    item.$canvas2[0].width = viz.size * viz.config.mainWidth;
                    item.ctx2 = item.$canvas2[0].getContext('2d');
                    item.donutCfg = {
                        type: 'doughnut',
                        data: {
                            datasets: [],
                            labels: []
                        },
                        options: {
                            cutoutPercentage: (100 - viz.config.thickness),
                            circumference: viz.config.circumference,
                            rotation: viz.config.rotation,
                            maintainAspectRatio: false,
                            responsive: true,
                            legend: {
                                display: false
                            },
                            title: {
                                display: false,
                            },
                            animation: {
                                animateScale: false,
                                animateRotate: true
                            },
                            layout: {
                                padding: {
                                    left: 4,
                                    right: 4,
                                    top: 4,
                                    bottom: 6
                                }
                            },
                            tooltips: {
                                enabled: false,
                            }
                        }
                    };
                    item.myDoughnut = new Chart(item.ctx2, item.donutCfg);
                }
                if (viz.config.sparkorder !== "no") {
                    item.ctx1 = item.$canvas1[0].getContext('2d');
                    item.areaCfg = {
                        type: viz.config.sparkstyle == "column" ? "bar" : "line",
                        data: {
                            datasets: [],
                            labels: []
                        },
                        options: {
                            responsive: true,
                            title: {
                                display: false,
                            },
                            legend: {
                                display: false,
                            },
                            tooltips: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(tooltipItem, data) {
                                        return "";
                                    }
                                }
                            },
                            hover: {
                                mode: 'nearest',
                                intersect: true
                            },
                            animation: {
                                duration: 0,
                            },
                            elements: {
                                line: {
                                    tension: 0 // disables bezier curves
                                }
                            },
                            scales: {
                                xAxes: [{
                                    display: false
                                }],
                                yAxes: [{
                                    display: false,
                                    ticks: {
                                    }
                                }]
                            }
                        }
                    };
                    if ($.trim(viz.config.sparkmax) !== "" && ! isNaN(Number(viz.config.sparkmax))) {
                        item.areaCfg.options.scales.yAxes[0].ticks.max = Number(viz.config.sparkmax);
                    }
                    if ($.trim(viz.config.sparkmin) !== "" && ! isNaN(Number(viz.config.sparkmin))) {
                        item.areaCfg.options.scales.yAxes[0].ticks.min = Number(viz.config.sparkmin);
                    }
                    item.myArea = new Chart(item.ctx1, item.areaCfg);
                }
            }

            // Figure out the thresholds
            var threshold_colors = [];
            var threshold_values = [];
            var thresholds_arr = [{
                color: viz.config.thresholdcol1, 
                value: -Infinity
            }];

            for (i = 2; i < 7; i++){
                if (viz.config["thresholdval" + i] !== "" && ! isNaN(Number(viz.config["thresholdval" + i]))) {
                    var val = Number(viz.config["thresholdval" + i]);
                    thresholds_arr.push({
                        color: viz.config["thresholdcol" + i], 
                        value: val
                    });
                }
            }
            thresholds_arr.sort(function(a, b) {
                if (a.value < b.value)
                    return -1;
                if (a.value > b.value)
                    return 1;
                return 0;
            });
            var nextval;
            for (i = 0; i < thresholds_arr.length; i++){
                if (i+1 === thresholds_arr.length) {
                    nextval = Math.max(item.max, thresholds_arr[i].value);
                } else {
                    nextval = thresholds_arr[i+1].value;
                }
                if (nextval > item.min && thresholds_arr[i].value < item.max) {
                    threshold_colors.push(thresholds_arr[i].color);
                    threshold_values.push(Math.min(nextval, item.max) - Math.max(thresholds_arr[i].value, item.min));
                }
            }

            if (viz.config.titletext === "" && item.title) {
                item.$overlayTitle.html(item.title);
            } else {
                item.$overlayTitle.html(viz.config.titletext); // allow injection
            }

            if (viz.config.subtitletext === "" && item.subtitle) {
                item.$overlaySubTitle.html(item.subtitle);
            } else {
                item.$overlaySubTitle.html(viz.config.subtitletext); // allow injection
            }

            var value = item.value;
            var value_display = value;
            var value_color = viz.config.nodatacolor;
            var value_lowerseg = item.min;
            var value_upperseg;
            var value_nodata = false;
            var value_as_percentage = 0;
            if (value === "" || isNaN(Number(value))) {
                value = item.min;
                value_nodata = true;
            }
            value = Number(value);
            // find the colour of the value
            if (! value_nodata) {
                for (i = 0; i < thresholds_arr.length; i++){
                    if (value > thresholds_arr[i].value) {
                        value_color = thresholds_arr[i].color;
                    }
                }
            }
            // in-data override
            if (item.hasOwnProperty("color")) {
                value_color = item.color;
            }
            // limit to bounds after computing the threshold color
            value = Math.min(Math.max(value, item.min), item.max);

            // determine the split of segments
            value_lowerseg = value - item.min;
            value_upperseg = (item.max - item.min) - value_lowerseg;
            value_as_percentage = (value - item.min) / (item.max - item.min);

            // Add the border to shapes
            if (viz.config.style.substr(0,1) === "a" && viz.config.shapebordersize > 0) {
                item.$svgShape.attr("stroke-width", viz.config.shapebordersize + "%").attr("stroke", viz.getColorFromMode(viz.config.shapebordercolormode, viz.config.shapebordercolor, value_color));
                if (item.hasOwnProperty("$svgPulseShape")) {
                    item.$svgPulseShape.attr("stroke-width", viz.config.shapebordersize + "%").attr("stroke", viz.getColorFromMode(viz.config.shapebordercolormode, viz.config.shapebordercolor, value_color));
                }
            }

            // Add the pulse animation
            if (viz.config.style.substr(0,1) === "a" && viz.config.pulserate > 0 && doAFullRedraw) {
                // get the height so it forces a draw
                item.pulseInterval = setInterval(function(){
                    item.$svgPulse.one('transitionend webkitTransitionEnd oTransitionEnd', function () {
                        item.$svgPulse.css({"transition": "transform,opacity 0s,0s"});
                        // Read the height to force flush
                        item.$svgPulse.height();
                        item.$svgPulse.css({"transition": "transform,opacity 2s,2s","opacity":"0.25","transform":"scale(1)"});
                    });
                    item.$svgPulse.css({"opacity":"0","transform":"scale(1.2)"}); 
                }, Math.max(2500, (60000 / viz.config.pulserate)));
            }
            
            var value_color_primary = viz.getColorFromMode(viz.config.colorprimarymode, viz.config.colorprimary, value_color);
            var value_color_secondary = viz.getColorFromMode(viz.config.colorsecondarymode, viz.config.colorsecondary, value_color);
            // in-data override
            if (item.hasOwnProperty("primarycolor")) {
                value_color_primary = item.primarycolor;
            }
            // in-data override
            if (item.hasOwnProperty("secondarycolor")) {
                value_color_secondary = item.secondarycolor;
            }
            if (viz.config.style.substr(0,1) === "g") {
                item.donutCfg.data.labels = ["",""];
                if (item.donutCfg.data.datasets.length === 0) {
                    item.donutCfg.data.datasets = [{
                        borderColor: viz.config.bordercolor,
                        borderWidth: viz.config.bordersize,
                        weight: viz.config.thresholdsize,
                        label : "Threshold"
                    },{
                        borderColor: viz.config.bordercolor,
                        borderWidth: viz.config.bordersize,
                        label : "",
                        weight: (100 - viz.config.thresholdsize),
                    }];
                }
                item.donutCfg.data.datasets[0].backgroundColor = threshold_colors;
                item.donutCfg.data.datasets[0].data = threshold_values;

                var grd = item.ctx2.createLinearGradient(0, (viz.size * viz.config.mainHeight) / 2, (viz.size * viz.config.mainWidth), (viz.size * viz.config.mainHeight) / 2);
                grd.addColorStop(0, value_color_primary);
                grd.addColorStop(1, value_color_secondary);

                item.donutCfg.data.datasets[1].backgroundColor = [grd, viz.config.shadowcolor];
                item.donutCfg.data.datasets[1].data = [value_lowerseg, value_upperseg];
                
            } else {
                // Calculate the speed of the viz
                var speed = "9999999";
                if (! value_nodata) {
                    speed = (value_as_percentage * (viz.speedmax - viz.speedmin)) + viz.speedmin;
                    speed = (speed === 0) ? 9999999 : 60 / speed;
                }
                item.$svgFillPrimary.attr("fill", value_color_primary);
                item.$svgFillSecondary.attr("fill", value_color_secondary);
                item.$svgStrokePrimary.attr("stroke", value_color_primary);
                item.$svgStrokeSecondary.attr("stroke", value_color_secondary);
                item.$svgStopPrimary.attr("stop-color", value_color_primary);
                item.$svgStopSecondary.attr("stop-color", value_color_secondary);
            
                item.$svgSpeed1.attr("dur", speed + "s");
                item.$svgSpeed05.attr("dur", (speed * 0.5) + "s");
                item.$svgSpeed15.attr("dur", (speed * 1.5) + "s");
            }
            
            if (viz.config.sparkorder !== "no") {
                item.areaCfg.data.labels = item.overtimedata;
                if (item.areaCfg.data.datasets.length === 0) {
                    item.areaCfg.data.datasets.push({});
                }
                item.areaCfg.data.datasets[0].label = "";
                item.areaCfg.data.datasets[0].borderColor = viz.getColorFromMode(viz.config.sparkcolormodeline, viz.config.sparkcolorline, value_color);
                item.areaCfg.data.datasets[0].backgroundColor = viz.getColorFromMode(viz.config.sparkcolormodefill, viz.config.sparkcolorfill, value_color);
                item.areaCfg.data.datasets[0].pointBorderColor = item.areaCfg.data.datasets[0].borderColor;
                item.areaCfg.data.datasets[0].pointBackgroundColor = item.areaCfg.data.datasets[0].borderColor;
                item.areaCfg.data.datasets[0].pointRadius = 1;
                if (viz.config.sparknulls === "zero") {
                    item.areaCfg.data.datasets[0].data = [];
                    for (var m = 0; m < item.overtimedata.length; m++) {
                        item.areaCfg.data.datasets[0].data.push(item.overtimedata[m] === null ? 0 : item.overtimedata[m]);
                    }
                } else {
                    item.areaCfg.data.datasets[0].data = item.overtimedata;
                }
                item.areaCfg.data.datasets[0].fill = viz.config.sparkstyle == "area" ? 'origin' : false;
                item.areaCfg.data.datasets[0].spanGaps = (viz.config.sparknulls === "span");
            }
            // in-data override
            if (item.hasOwnProperty("text")) {
                value_display = item.text;
            }
            var overlay_now = Number(value_display);
            var overlay_prev = item.overlay_prev;
            item.overlay_prev = overlay_now;
            if (viz.config.textshow === "yes") {
                if ($.trim(value_display) === "" || value_display === null) {
                    item.$overlayText.html("");
                // Animate number on change
                // Need to have a previous value and both old and new need to be numbers for animation to work
                } else if (! isNaN(overlay_prev) && ! isNaN(overlay_now) && overlay_prev !== overlay_now && viz.config.textprecision !== "nolimit") {
                    val.textanimateidx = 0;
                    // TODO should add a delay option  
                    $({value: overlay_prev, target: item.$overlayText}).animate({value: overlay_now}, {
                        duration: Number(viz.config.textduration),
                        easing: "swing",
                        step: function(val, fx) {
                            val.textanimateidx++;
                            if (val.textanimateidx % 30 === 0) {
                                this.target.html(viz.buildOverlay(val));
                            }
                        },
                        complete: function(){
                            this.target.html(viz.buildOverlay(val));
                        }
                    });
                } else if (! isNaN(overlay_now)) {
                    item.$overlayText.html(viz.buildOverlay(overlay_now));
                } else {
                    // html injection a-ok round these parts
                    item.$overlayText.html(value_display);
                }
                if (viz.config.textmode !== "static") {
                    item.$overlayText.css({"color": viz.getColorFromMode(viz.config.textmode, viz.config.textcolor, value_color)});
                }
            }
            if (viz.config.titlecolormode !== "static") {
                item.$overlayTitle.css({"color": viz.getColorFromMode(viz.config.titlecolormode, viz.config.titlecolor, value_color)});
            }
            if (viz.config.subtitlecolormode !== "static") {
                item.$overlaySubTitle.css({"color": viz.getColorFromMode(viz.config.subtitlecolormode, viz.config.subtitlecolor, value_color)});
            }

            if (viz.config.sparkorder !== "no") {
                item.myArea.update();
            }
            if (viz.config.style.substr(0,1) === "g") {
                item.myDoughnut.update(); 
            }
            item.$canvas1.css("display", "block");
            item.$canvas2.css("display", "block");
        },

        buildOverlay: function(val) {
            var viz = this;
            var ret = val;
            if (viz.config.textprecision === "1") {
                ret = Math.round(val);
            } else if (viz.config.textprecision === "2") {
                ret = Math.round(val * 10) / 10;
            } else if (viz.config.textprecision === "3") {
                ret = Math.round(val * 100) / 100;
            } else if (viz.config.textprecision === "4") {
                ret = Math.round(val * 1000) / 1000;
            } else if (viz.config.textprecision === "5") {
                ret = Math.round(val * 10000) / 10000;
            } else if (viz.config.textprecision === "6") {
                ret = Math.round(val * 100000) / 100000;
            }

            if (viz.config.textprocessing === "abr1") {
                ret = viz.abbreviate(ret, 1);
            } else if (viz.config.textprocessing === "abr2") {
                ret = viz.abbreviate(ret, 2);
            } else if (viz.config.textprocessing === "abr3") {
                ret = viz.abbreviate(ret, 3);
            } else if (viz.config.textprocessing === "abr4") {
                ret = viz.abbreviate(ret, 4);
            }

            ret = ret.toString();
            if (viz.config.textprocessing === "thou") {
                ret = ret.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            if (viz.config.textunit) {
                // intentially allowing html injection. yolo
                var unit = "<span class='number_display_viz-unit number_display_viz-unit-" + viz.config.textunitposition + "' style='font-size: " + viz.config.textunitsize + "%;'>" + (viz.config.textunitposition === "under" ? "<br />" : "") + viz.config.textunit + "</span>";
                if (viz.config.textunitposition === "before") {
                    ret = unit + ret;
                } else {
                    ret = ret + unit;
                }
            }
            return ret;
        },

        abbreviate: function(number, decPlaces) {
            var isNegative = number < 0;
            var units = ['k', 'm', 'b', 't'];
            number = Math.abs(number);
            for (var i = units.length - 1; i >= 0; i--) {
                var size = Math.pow(10, (i + 1) * 3);
                if (size <= number) {
                    number = number / size; 
                    if ((number === 1000) && (i < units.length - 1)) {
                        number = 1;
                        i++;
                    }
                    if (number > 99) {
                        number = Math.round(number * Math.pow(10, Math.max(decPlaces - 3, 0))) / Math.pow(10, Math.max(decPlaces - 3, 0));
                    } else if (number > 9) {
                        number = Math.round(number * Math.pow(10, Math.max(decPlaces - 2, 0))) / Math.pow(10, Math.max(decPlaces - 2, 0));
                    } else {
                        number = Math.round(number * Math.pow(10, Math.max(decPlaces - 1, 0))) / Math.pow(10, Math.max(decPlaces - 1, 0));
                    }
                    number += units[i];
                    break;
                }
            }
            return isNegative ? '-' + number : number;
        },

        getColorFromMode: function(mode, color1, color2) {
            if (mode === "darker1") {
                return tinycolor(color2).darken(10).toString();
            } else if (mode === "darker2") {
                return tinycolor(color2).darken(20).toString();
            } else if (mode === "darker3") {
                return tinycolor(color2).darken(40).toString();
            } else if (mode === "lighter1") {
                return tinycolor(color2).lighten(10).toString();
            } else if (mode === "lighter2") {
                return tinycolor(color2).lighten(20).toString();
            } else if (mode === "lighter3") {
                return tinycolor(color2).lighten(40).toString();
            } else if (mode === "static") {
                return color1;
            }
            return color2;
        },

        // Override to respond to re-sizing events
        reflow: function() {
            this.scheduleDraw();
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        },
    };



// ##########################################################################################################################################################
//            _____ _              ____      _            
//           |_   _(_)_ __  _   _ / ___|___ | | ___  _ __ 
//             | | | | '_ \| | | | |   / _ \| |/ _ \| '__|
//             | | | | | | | |_| | |__| (_) | | (_) | |   
//             |_| |_|_| |_|\__, |\____\___/|_|\___/|_|   
//                          |___/                         
// ##########################################################################################################################################################
    // TinyColor v1.4.1
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    var tinycolor = (function(Math) {

    var trimLeft = /^\s+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        mathRound = Math.round,
        mathMin = Math.min,
        mathMax = Math.max,
        mathRandom = Math.random;

    function tinycolor (color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
        return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        this._originalInput = color,
        this._r = rgb.r,
        this._g = rgb.g,
        this._b = rgb.b,
        this._a = rgb.a,
        this._roundA = mathRound(100*this._a) / 100,
        this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    }

    tinycolor.prototype = {
        isDark: function() {
            return this.getBrightness() < 128;
        },
        isLight: function() {
            return !this.isDark();
        },
        isValid: function() {
            return this._ok;
        },
        getOriginalInput: function() {
        return this._originalInput;
        },
        getFormat: function() {
            return this._format;
        },
        getAlpha: function() {
            return this._a;
        },
        getBrightness: function() {
            //http://www.w3.org/TR/AERT#color-contrast
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        getLuminance: function() {
            //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            var rgb = this.toRgb();
            var RsRGB, GsRGB, BsRGB, R, G, B;
            RsRGB = rgb.r/255;
            GsRGB = rgb.g/255;
            BsRGB = rgb.b/255;

            if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
            if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
            if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
            return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
        },
        setAlpha: function(value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(100*this._a) / 100;
            return this;
        },
        toHsv: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
            return (this._a == 1) ?
            "hsv("  + h + ", " + s + "%, " + v + "%)" :
            "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHsl: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
            return (this._a == 1) ?
            "hsl("  + h + ", " + s + "%, " + l + "%)" :
            "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
            return '#' + this.toHex(allow3Char);
        },
        toHex8: function(allow4Char) {
            return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
        },
        toHex8String: function(allow4Char) {
            return '#' + this.toHex8(allow4Char);
        },
        toRgb: function() {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
            return (this._a == 1) ?
            "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
            "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toPercentageRgb: function() {
            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
        },
        toPercentageRgbString: function() {
            return (this._a == 1) ?
            "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
            "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
        },
        toName: function() {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function(secondColor) {
            var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
            }

            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
        },
        toString: function(format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex4") {
                formattedString = this.toHex8String(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },
        clone: function() {
            return tinycolor(this.toString());
        },

        _applyModification: function(fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function() {
            return this._applyModification(lighten, arguments);
        },
        brighten: function() {
            return this._applyModification(brighten, arguments);
        },
        darken: function() {
            return this._applyModification(darken, arguments);
        },
        desaturate: function() {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function() {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function() {
            return this._applyModification(greyscale, arguments);
        },
        spin: function() {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function(fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function() {
            return this._applyCombination(analogous, arguments);
        },
        complement: function() {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function() {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function() {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function() {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function() {
            return this._applyCombination(tetrad, arguments);
        }
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var s = null;
        var v = null;
        var l = null;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
                s = convertToPercentage(color.s);
                v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, s, v);
                ok = true;
                format = "hsv";
            }
            else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
                s = convertToPercentage(color.s);
                l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, s, l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = Math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }

    // `rgbaToHex`
    // Converts an RGBA color plus alpha transparency to hex
    // Assumes r, g, b are contained in the set [0, 255] and
    // a in [0, 1]. Returns a 4 or 8 character rgba hex
    function rgbaToHex(r, g, b, a, allow4Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16)),
            pad2(convertDecimalToHex(a))
        ];

        // Return a 4 character hex if possible
        if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
        }

        return hex.join("");
    }

    // `rgbaToArgbHex`
    // Converts an RGBA color to an ARGB Hex8 string
    // Rarely used, but required for "toFilter()"
    function rgbaToArgbHex(r, g, b, a) {

        var hex = [
            pad2(convertDecimalToHex(a)),
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        return hex.join("");
    }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };

    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
        return tinycolor(rgb);
    }

    function darken (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (hsl.h + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    }

    // Utility Functions
    // ---------------------

    tinycolor.mix = function(color1, color2, amount) {
        amount = (amount === 0) ? 0 : (amount || 50);

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;

        var rgba = {
            r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
            g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
            b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
            a: ((rgb2.a - rgb1.a) * p) + rgb1.a
        };

        return tinycolor(rgba);
    };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

    // `contrast`
    // Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
    tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
    };

    // `isReadable`
    // Ensure that foreground and background color combinations meet WCAG2 guidelines.
    // The third argument is an optional Object.
    //      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
    //      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
    // If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    //    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
    tinycolor.isReadable = function(color1, color2, wcag2) {
        var readability = tinycolor.readability(color1, color2);
        var wcag2Parms, out;

        out = false;

        wcag2Parms = validateWCAG2Parms(wcag2);
        switch (wcag2Parms.level + wcag2Parms.size) {
            case "AAsmall":
            case "AAAlarge":
                out = readability >= 4.5;
                break;
            case "AAlarge":
                out = readability >= 3;
                break;
            case "AAAsmall":
                out = readability >= 7;
                break;
        }
        return out;

    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // Optionally returns Black or White if the most readable color is unreadable.
    // *Example*
    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
    tinycolor.mostReadable = function(baseColor, colorList, args) {
        var bestColor = null;
        var bestScore = 0;
        var readability;
        var includeFallbackColors, level, size ;
        args = args || {};
        includeFallbackColors = args.includeFallbackColors ;
        level = args.level;
        size = args.size;

        for (var i= 0; i < colorList.length ; i++) {
            readability = tinycolor.readability(baseColor, colorList[i]);
            if (readability > bestScore) {
                bestScore = readability;
                bestColor = tinycolor(colorList[i]);
            }
        }

        if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
            return bestColor;
        }
        else {
            args.includeFallbackColors=false;
            return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
        }
    };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((Math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            CSS_UNIT: new RegExp(CSS_UNIT),
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

    // `isValidCSSUnit`
    // Take in a single string / number and check to see if it looks like a CSS unit
    // (see `matchers` above for definition).
    function isValidCSSUnit(color) {
        return !!matchers.CSS_UNIT.exec(color);
    }

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hsva.exec(color))) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                a: convertHexToDecimal(match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex4.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                a: convertHexToDecimal(match[4] + '' + match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    function validateWCAG2Parms(parms) {
        // return valid WCAG2 parms for isReadable.
        // If input parms are invalid, return {"level":"AA", "size":"small"}
        var level, size;
        parms = parms || {"level":"AA", "size":"small"};
        level = (parms.level || "AA").toUpperCase();
        size = (parms.size || "small").toLowerCase();
        if (level !== "AA" && level !== "AAA") {
            level = "AA";
        }
        if (size !== "small" && size !== "large") {
            size = "small";
        }
        return {"level":level, "size":size};
    }

    return tinycolor;

    })(Math);

    return SplunkVisualizationBase.extend(vizObj);
});