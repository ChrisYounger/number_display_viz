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
    chartjs
) {

    // TODO in Gauge3, move the sparkline up
    // TODO if there is no sparkline, move the overlay
    // TODO text shadow on overlay
    // TODO impliment spinners
    // TODO impliment boxes
    // TODO sparkline limits
    // subtitle
    // when hiding the sparkline, it should be properly hidden
    // tooltip busted
    var vizObj = {
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            var viz = this;
            var theme = 'light'; 
            if (typeof vizUtils.getCurrentTheme === "function") {
                theme = vizUtils.getCurrentTheme();
            }
            if (theme === 'dark') {
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
                min: "0",
                max: "100",
                style: "g1", 
                thresholdsize: 20,
                thresholdcol1: "#ffffff",
                thresholdcol2: "#ffffff",
                thresholdcol3: "#ffffff",
                thresholdcol4: "#ffffff",
                thresholdcol5: "#ffffff",
                thresholdcol6: "#ffffff",
                thresholdval1: "",
                thresholdval2: "",
                thresholdval3: "",
                thresholdval4: "",
                thresholdval5: "",
                thresholdval6: "",
                shadowcolor: "",
                nodatacolor: "#5C6773",
                bordercolor: "#ffffff",
                bordersize: "2",
                textsize: "100",
                textduration: "300",
                textprecision: "nolimit",
                textthousands: "no",
                textunit: "",
                textunitsize: "50",
                textunitposition: "after",
                textfont: "",
                textcolor: "#000000",
                textmode: "static",
                textshow: "yes",
                animations: "on",
                base_obj: "donut",
                doSvg: "",
                sparkshow: "yes",
                sparkmin: "",
                sparkmax: "",
                sparkcolormode: "auto",
                sparkcolor: "#5C6773",
                sparkstyle: "area",
                sparkorder: "bg",
                spinnerspeedmin: "15",
                spinnerspeedmax: "1",

                // style overrides that can't be set via UI
                circumference: Math.PI + 0.6,
                rotation: -Math.PI - 0.3,
                cutoutPercentage: 50,
                overlayPosition: "center",
                overlayHeight: 0.5,
                overlaySize: 1,
                mainHeight:  0.95,
                mainWidth: 0.95,
                sparkMarginTop: 0.7,
                sparkHeight: 0.3,
                sparkWidth: 1,
                speedMultiplier: 1,
            };
            var style_overrides = {
                g1: {
                    overlayHeight: 0.63,
                },
                g2: {
                    circumference: Math.PI,
                    rotation: -Math.PI,
                    overlayHeight: 0.67,
                },
                g3: {
                    circumference: Math.PI * 1.5,
                    rotation: Math.PI * 0.5,
                    overlayHeight: 0.82,
                    overlayPosition: "right",
                },
                g4: {
                    circumference: Math.PI * 2,
                    rotation: Math.PI * 1.5,
                },
                h1: {
                    cutoutPercentage: 80,
                    overlayHeight: 0.63,
                },
                h2: {
                    circumference: Math.PI,
                    rotation: -Math.PI,
                    cutoutPercentage: 80,
                    overlayHeight: 0.67,
                },
                h3: {
                    circumference: Math.PI * 1.5,
                    rotation: Math.PI * 0.5,
                    cutoutPercentage: 80,
                    overlayHeight: 0.83,
                    overlayPosition: "right",
                },
                h4: {
                    circumference: Math.PI * 2,
                    rotation: Math.PI * 1.5,
                    cutoutPercentage: 80,
                },
                s1: { base_obj: "svg" },
                s2: { base_obj: "svg" },
                s3: { base_obj: "svg" },
                s4: { base_obj: "svg" },
                s5: { base_obj: "svg" },
                s6: { base_obj: "svg" },
                s7: { base_obj: "svg" },
                s8: { base_obj: "svg" },
                s9: { base_obj: "svg" },
                a1: { 
                    base_obj: "svg", 
                    overlayHeight: 0.3,
                    overlaySize: 2,
                    mainHeight:  1,
                    mainWidth: 1,
                    sparkMarginTop: 0.6,
                    sparkHeight: 0.4,
                    sparkWidth: 2,
                },
                a2: { 
                    base_obj: "svg", 
                    overlayHeight: 0.3,
                    overlaySize: 2,
                    mainHeight:  1,
                    mainWidth: 2,
                    sparkMarginTop: 0.6,
                    sparkHeight: 0.4,
                    sparkWidth: 2,
                },
                a3: { 
                    base_obj: "svg", 
                    overlayHeight: 0.5,
                    overlaySize: 2,
                    mainHeight:  1,
                    mainWidth: 1,
                    sparkMarginTop: 0.6,
                    sparkHeight: 0.4,
                    sparkWidth: 2,
                },
                a4: { base_obj: "svg" },
                a5: { base_obj: "svg" },
                a6: { base_obj: "svg" },
                a7: { base_obj: "svg" },
                a8: { base_obj: "svg" },
                a9: { base_obj: "svg" },
                a10: { base_obj: "svg" },

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
            viz.config.min = Number(viz.config.min);
            viz.config.max = Number(viz.config.max);
            viz.config.spinnerspeedmin = Number(viz.config.spinnerspeedmin);
            viz.config.spinnerspeedmax = Number(viz.config.spinnerspeedmax);
            viz.data = data;
            viz.scheduleDraw();
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
            console.log(viz);
            // Dont draw unless this is a real element under body
            if (! viz.$container_wrap.parents().is("body")) {
                return;
            }

            // If the gague type is still the same
            var serialised = JSON.stringify(viz.config);
            var doAFullRedraw = false;
            if (viz.alreadyDrawn !== serialised) {
                doAFullRedraw = true;
                viz.alreadyDrawn = serialised;
            }

            if (doAFullRedraw) {
                // TODO all dom variables should be prefixed with dolalr
                viz.$container_wrap.empty();
                viz.$errordiv = $('<div style="text-align:center; font-size: 16px;"></div>');
                viz.$canvas1 = $('<canvas class="number_display_viz-canvas_areachart"></canvas>');
                viz.$canvas2 = $('<canvas class="number_display_viz-canvas_gauge"></canvas>');
                viz.$overlay = $('<div class="number_display_viz-overlay"></div>');
                viz.$wrapc1 = $('<div class="number_display_viz-wrap_areachart"></div>').append(viz.$canvas1);
                viz.$wrapc2 = $('<div class="number_display_viz-wrap_gauge"></div>');
                viz.$container_wrap.append(viz.$errordiv, viz.$wrapc2, viz.$wrapc1);

                if (viz.config.textshow === "yes") {
                    viz.$container_wrap.append(viz.$overlay);
                }

                if (viz.config.base_obj === "donut") {
                        viz.$canvas2.appendTo(viz.$wrapc2);

                } else if (viz.config.base_obj === "box") {

                    // From https://www.svgbackgrounds.com/
                    /*viz.$wrapc2.css({
                        "background-color": "#ffffff",
                        "background-image": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='100' height='50' viewBox='0 0 100 50'%3E%3Cdefs%3E%3Crect stroke='%23ffffff' stroke-width='0.1' width='1' height='1' id='s'/%3E%3Cpattern id='a' width='2' height='2' patternUnits='userSpaceOnUse'%3E%3Cg stroke='%23ffffff' stroke-width='0.1'%3E%3Crect fill='%23fafafa' width='1' height='1'/%3E%3Crect fill='%23ffffff' width='1' height='1' x='1' y='1'/%3E%3Crect fill='%23f5f5f5' width='1' height='1' y='1'/%3E%3Crect fill='%23f0f0f0' width='1' height='1' x='1'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='b' width='5' height='11' patternUnits='userSpaceOnUse'%3E%3Cg fill='%23ebebeb'%3E%3Cuse xlink:href='%23s' x='2' y='0'/%3E%3Cuse xlink:href='%23s' x='4' y='1'/%3E%3Cuse xlink:href='%23s' x='1' y='2'/%3E%3Cuse xlink:href='%23s' x='2' y='4'/%3E%3Cuse xlink:href='%23s' x='4' y='6'/%3E%3Cuse xlink:href='%23s' x='0' y='8'/%3E%3Cuse xlink:href='%23s' x='3' y='9'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='c' width='7' height='7' patternUnits='userSpaceOnUse'%3E%3Cg fill='%23e5e5e5'%3E%3Cuse xlink:href='%23s' x='1' y='1'/%3E%3Cuse xlink:href='%23s' x='3' y='4'/%3E%3Cuse xlink:href='%23s' x='5' y='6'/%3E%3Cuse xlink:href='%23s' x='0' y='3'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='d' width='11' height='5' patternUnits='userSpaceOnUse'%3E%3Cg fill='%23ffffff'%3E%3Cuse xlink:href='%23s' x='1' y='1'/%3E%3Cuse xlink:href='%23s' x='6' y='3'/%3E%3Cuse xlink:href='%23s' x='8' y='2'/%3E%3Cuse xlink:href='%23s' x='3' y='0'/%3E%3Cuse xlink:href='%23s' x='0' y='3'/%3E%3C/g%3E%3Cg fill='%23e0e0e0'%3E%3Cuse xlink:href='%23s' x='8' y='3'/%3E%3Cuse xlink:href='%23s' x='4' y='2'/%3E%3Cuse xlink:href='%23s' x='5' y='4'/%3E%3Cuse xlink:href='%23s' x='10' y='0'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='e' width='47' height='23' patternUnits='userSpaceOnUse'%3E%3Cg fill='%23BA7'%3E%3Cuse xlink:href='%23s' x='2' y='5'/%3E%3Cuse xlink:href='%23s' x='23' y='13'/%3E%3Cuse xlink:href='%23s' x='4' y='18'/%3E%3Cuse xlink:href='%23s' x='35' y='9'/%3E%3C/g%3E%3C/pattern%3E%3Cpattern id='f' width='61' height='31' patternUnits='userSpaceOnUse'%3E%3Cg fill='%23BA7'%3E%3Cuse xlink:href='%23s' x='16' y='0'/%3E%3Cuse xlink:href='%23s' x='13' y='22'/%3E%3Cuse xlink:href='%23s' x='44' y='15'/%3E%3Cuse xlink:href='%23s' x='12' y='11'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect fill='url(%23a)' width='100' height='50'/%3E%3Crect fill='url(%23b)' width='100' height='50'/%3E%3Crect fill='url(%23c)' width='100' height='50'/%3E%3Crect fill='url(%23d)' width='100' height='50'/%3E%3Crect fill='url(%23e)' width='100' height='50'/%3E%3Crect fill='url(%23f)' width='100' height='50'/%3E%3C/svg%3E\")",
                        "background-attachment": "fixed",
                        "background-size": "cover",
                    });*/
// viz.$wrapc2.css({
// "background-color": "#21ff34",
// "background-image": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='540' height='450' viewBox='0 0 1080 900'%3E%3Cg fill-opacity='.1'%3E%3Cpolygon fill='%23444' points='90 150 0 300 180 300'/%3E%3Cpolygon points='90 150 180 0 0 0'/%3E%3Cpolygon fill='%23AAA' points='270 150 360 0 180 0'/%3E%3Cpolygon fill='%23DDD' points='450 150 360 300 540 300'/%3E%3Cpolygon fill='%23999' points='450 150 540 0 360 0'/%3E%3Cpolygon points='630 150 540 300 720 300'/%3E%3Cpolygon fill='%23DDD' points='630 150 720 0 540 0'/%3E%3Cpolygon fill='%23444' points='810 150 720 300 900 300'/%3E%3Cpolygon fill='%23FFF' points='810 150 900 0 720 0'/%3E%3Cpolygon fill='%23DDD' points='990 150 900 300 1080 300'/%3E%3Cpolygon fill='%23444' points='990 150 1080 0 900 0'/%3E%3Cpolygon fill='%23DDD' points='90 450 0 600 180 600'/%3E%3Cpolygon points='90 450 180 300 0 300'/%3E%3Cpolygon fill='%23666' points='270 450 180 600 360 600'/%3E%3Cpolygon fill='%23AAA' points='270 450 360 300 180 300'/%3E%3Cpolygon fill='%23DDD' points='450 450 360 600 540 600'/%3E%3Cpolygon fill='%23999' points='450 450 540 300 360 300'/%3E%3Cpolygon fill='%23999' points='630 450 540 600 720 600'/%3E%3Cpolygon fill='%23FFF' points='630 450 720 300 540 300'/%3E%3Cpolygon points='810 450 720 600 900 600'/%3E%3Cpolygon fill='%23DDD' points='810 450 900 300 720 300'/%3E%3Cpolygon fill='%23AAA' points='990 450 900 600 1080 600'/%3E%3Cpolygon fill='%23444' points='990 450 1080 300 900 300'/%3E%3Cpolygon fill='%23222' points='90 750 0 900 180 900'/%3E%3Cpolygon points='270 750 180 900 360 900'/%3E%3Cpolygon fill='%23DDD' points='270 750 360 600 180 600'/%3E%3Cpolygon points='450 750 540 600 360 600'/%3E%3Cpolygon points='630 750 540 900 720 900'/%3E%3Cpolygon fill='%23444' points='630 750 720 600 540 600'/%3E%3Cpolygon fill='%23AAA' points='810 750 720 900 900 900'/%3E%3Cpolygon fill='%23666' points='810 750 900 600 720 600'/%3E%3Cpolygon fill='%23999' points='990 750 900 900 1080 900'/%3E%3Cpolygon fill='%23999' points='180 0 90 150 270 150'/%3E%3Cpolygon fill='%23444' points='360 0 270 150 450 150'/%3E%3Cpolygon fill='%23FFF' points='540 0 450 150 630 150'/%3E%3Cpolygon points='900 0 810 150 990 150'/%3E%3Cpolygon fill='%23222' points='0 300 -90 450 90 450'/%3E%3Cpolygon fill='%23FFF' points='0 300 90 150 -90 150'/%3E%3Cpolygon fill='%23FFF' points='180 300 90 450 270 450'/%3E%3Cpolygon fill='%23666' points='180 300 270 150 90 150'/%3E%3Cpolygon fill='%23222' points='360 300 270 450 450 450'/%3E%3Cpolygon fill='%23FFF' points='360 300 450 150 270 150'/%3E%3Cpolygon fill='%23444' points='540 300 450 450 630 450'/%3E%3Cpolygon fill='%23222' points='540 300 630 150 450 150'/%3E%3Cpolygon fill='%23AAA' points='720 300 630 450 810 450'/%3E%3Cpolygon fill='%23666' points='720 300 810 150 630 150'/%3E%3Cpolygon fill='%23FFF' points='900 300 810 450 990 450'/%3E%3Cpolygon fill='%23999' points='900 300 990 150 810 150'/%3E%3Cpolygon points='0 600 -90 750 90 750'/%3E%3Cpolygon fill='%23666' points='0 600 90 450 -90 450'/%3E%3Cpolygon fill='%23AAA' points='180 600 90 750 270 750'/%3E%3Cpolygon fill='%23444' points='180 600 270 450 90 450'/%3E%3Cpolygon fill='%23444' points='360 600 270 750 450 750'/%3E%3Cpolygon fill='%23999' points='360 600 450 450 270 450'/%3E%3Cpolygon fill='%23666' points='540 600 630 450 450 450'/%3E%3Cpolygon fill='%23222' points='720 600 630 750 810 750'/%3E%3Cpolygon fill='%23FFF' points='900 600 810 750 990 750'/%3E%3Cpolygon fill='%23222' points='900 600 990 450 810 450'/%3E%3Cpolygon fill='%23DDD' points='0 900 90 750 -90 750'/%3E%3Cpolygon fill='%23444' points='180 900 270 750 90 750'/%3E%3Cpolygon fill='%23FFF' points='360 900 450 750 270 750'/%3E%3Cpolygon fill='%23AAA' points='540 900 630 750 450 750'/%3E%3Cpolygon fill='%23FFF' points='720 900 810 750 630 750'/%3E%3Cpolygon fill='%23222' points='900 900 990 750 810 750'/%3E%3Cpolygon fill='%23222' points='1080 300 990 450 1170 450'/%3E%3Cpolygon fill='%23FFF' points='1080 300 1170 150 990 150'/%3E%3Cpolygon points='1080 600 990 750 1170 750'/%3E%3Cpolygon fill='%23666' points='1080 600 1170 450 990 450'/%3E%3Cpolygon fill='%23DDD' points='1080 900 1170 750 990 750'/%3E%3C/g%3E%3C/svg%3E\")"
//                 });
viz.$wrapc2.css({
"background-color": "#4fa484",
"background-image": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientUnits='userSpaceOnUse' x1='0' x2='0' y1='0' y2='100%25' gradientTransform='rotate(177,1280,648)'%3E%3Cstop offset='0' stop-color='%234fa484'/%3E%3Cstop offset='1' stop-color='%234fa484'/%3E%3C/linearGradient%3E%3Cpattern patternUnits='userSpaceOnUse' id='b' width='300' height='250' x='0' y='0' viewBox='0 0 1080 900'%3E%3Cg fill-opacity='0.1'%3E%3Cpolygon fill='%23444' points='90 150 0 300 180 300'/%3E%3Cpolygon points='90 150 180 0 0 0'/%3E%3Cpolygon fill='%23AAA' points='270 150 360 0 180 0'/%3E%3Cpolygon fill='%23DDD' points='450 150 360 300 540 300'/%3E%3Cpolygon fill='%23999' points='450 150 540 0 360 0'/%3E%3Cpolygon points='630 150 540 300 720 300'/%3E%3Cpolygon fill='%23DDD' points='630 150 720 0 540 0'/%3E%3Cpolygon fill='%23444' points='810 150 720 300 900 300'/%3E%3Cpolygon fill='%23FFF' points='810 150 900 0 720 0'/%3E%3Cpolygon fill='%23DDD' points='990 150 900 300 1080 300'/%3E%3Cpolygon fill='%23444' points='990 150 1080 0 900 0'/%3E%3Cpolygon fill='%23DDD' points='90 450 0 600 180 600'/%3E%3Cpolygon points='90 450 180 300 0 300'/%3E%3Cpolygon fill='%23666' points='270 450 180 600 360 600'/%3E%3Cpolygon fill='%23AAA' points='270 450 360 300 180 300'/%3E%3Cpolygon fill='%23DDD' points='450 450 360 600 540 600'/%3E%3Cpolygon fill='%23999' points='450 450 540 300 360 300'/%3E%3Cpolygon fill='%23999' points='630 450 540 600 720 600'/%3E%3Cpolygon fill='%23FFF' points='630 450 720 300 540 300'/%3E%3Cpolygon points='810 450 720 600 900 600'/%3E%3Cpolygon fill='%23DDD' points='810 450 900 300 720 300'/%3E%3Cpolygon fill='%23AAA' points='990 450 900 600 1080 600'/%3E%3Cpolygon fill='%23444' points='990 450 1080 300 900 300'/%3E%3Cpolygon fill='%23222' points='90 750 0 900 180 900'/%3E%3Cpolygon points='270 750 180 900 360 900'/%3E%3Cpolygon fill='%23DDD' points='270 750 360 600 180 600'/%3E%3Cpolygon points='450 750 540 600 360 600'/%3E%3Cpolygon points='630 750 540 900 720 900'/%3E%3Cpolygon fill='%23444' points='630 750 720 600 540 600'/%3E%3Cpolygon fill='%23AAA' points='810 750 720 900 900 900'/%3E%3Cpolygon fill='%23666' points='810 750 900 600 720 600'/%3E%3Cpolygon fill='%23999' points='990 750 900 900 1080 900'/%3E%3Cpolygon fill='%23999' points='180 0 90 150 270 150'/%3E%3Cpolygon fill='%23444' points='360 0 270 150 450 150'/%3E%3Cpolygon fill='%23FFF' points='540 0 450 150 630 150'/%3E%3Cpolygon points='900 0 810 150 990 150'/%3E%3Cpolygon fill='%23222' points='0 300 -90 450 90 450'/%3E%3Cpolygon fill='%23FFF' points='0 300 90 150 -90 150'/%3E%3Cpolygon fill='%23FFF' points='180 300 90 450 270 450'/%3E%3Cpolygon fill='%23666' points='180 300 270 150 90 150'/%3E%3Cpolygon fill='%23222' points='360 300 270 450 450 450'/%3E%3Cpolygon fill='%23FFF' points='360 300 450 150 270 150'/%3E%3Cpolygon fill='%23444' points='540 300 450 450 630 450'/%3E%3Cpolygon fill='%23222' points='540 300 630 150 450 150'/%3E%3Cpolygon fill='%23AAA' points='720 300 630 450 810 450'/%3E%3Cpolygon fill='%23666' points='720 300 810 150 630 150'/%3E%3Cpolygon fill='%23FFF' points='900 300 810 450 990 450'/%3E%3Cpolygon fill='%23999' points='900 300 990 150 810 150'/%3E%3Cpolygon points='0 600 -90 750 90 750'/%3E%3Cpolygon fill='%23666' points='0 600 90 450 -90 450'/%3E%3Cpolygon fill='%23AAA' points='180 600 90 750 270 750'/%3E%3Cpolygon fill='%23444' points='180 600 270 450 90 450'/%3E%3Cpolygon fill='%23444' points='360 600 270 750 450 750'/%3E%3Cpolygon fill='%23999' points='360 600 450 450 270 450'/%3E%3Cpolygon fill='%23666' points='540 600 630 450 450 450'/%3E%3Cpolygon fill='%23222' points='720 600 630 750 810 750'/%3E%3Cpolygon fill='%23FFF' points='900 600 810 750 990 750'/%3E%3Cpolygon fill='%23222' points='900 600 990 450 810 450'/%3E%3Cpolygon fill='%23DDD' points='0 900 90 750 -90 750'/%3E%3Cpolygon fill='%23444' points='180 900 270 750 90 750'/%3E%3Cpolygon fill='%23FFF' points='360 900 450 750 270 750'/%3E%3Cpolygon fill='%23AAA' points='540 900 630 750 450 750'/%3E%3Cpolygon fill='%23FFF' points='720 900 810 750 630 750'/%3E%3Cpolygon fill='%23222' points='900 900 990 750 810 750'/%3E%3Cpolygon fill='%23222' points='1080 300 990 450 1170 450'/%3E%3Cpolygon fill='%23FFF' points='1080 300 1170 150 990 150'/%3E%3Cpolygon points='1080 600 990 750 1170 750'/%3E%3Cpolygon fill='%23666' points='1080 600 1170 450 990 450'/%3E%3Cpolygon fill='%23DDD' points='1080 900 1170 750 990 750'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect x='0' y='0' fill='url(%23a)' width='100%25' height='100%25'/%3E%3Crect x='0' y='0' fill='url(%23b)' width='100%25' height='100%25'/%3E%3C/svg%3E\")",
//"background-attachment": "fixed",
"background-size": "cover",
                });
                if (viz.config.style === "a3") {
                    viz.$wrapc2.css({"border-radius": "50%"});
                }
// background-color: #ffffff;
// background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientUnits='userSpaceOnUse' x1='0' x2='0' y1='0' y2='100%25' gradientTransform='rotate(177,1280,648)'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23089929'/%3E%3C/linearGradient%3E%3Cpattern patternUnits='userSpaceOnUse' id='b' width='300' height='250' x='0' y='0' viewBox='0 0 1080 900'%3E%3Cg fill-opacity='0.1'%3E%3Cpolygon fill='%23444' points='90 150 0 300 180 300'/%3E%3Cpolygon points='90 150 180 0 0 0'/%3E%3Cpolygon fill='%23AAA' points='270 150 360 0 180 0'/%3E%3Cpolygon fill='%23DDD' points='450 150 360 300 540 300'/%3E%3Cpolygon fill='%23999' points='450 150 540 0 360 0'/%3E%3Cpolygon points='630 150 540 300 720 300'/%3E%3Cpolygon fill='%23DDD' points='630 150 720 0 540 0'/%3E%3Cpolygon fill='%23444' points='810 150 720 300 900 300'/%3E%3Cpolygon fill='%23FFF' points='810 150 900 0 720 0'/%3E%3Cpolygon fill='%23DDD' points='990 150 900 300 1080 300'/%3E%3Cpolygon fill='%23444' points='990 150 1080 0 900 0'/%3E%3Cpolygon fill='%23DDD' points='90 450 0 600 180 600'/%3E%3Cpolygon points='90 450 180 300 0 300'/%3E%3Cpolygon fill='%23666' points='270 450 180 600 360 600'/%3E%3Cpolygon fill='%23AAA' points='270 450 360 300 180 300'/%3E%3Cpolygon fill='%23DDD' points='450 450 360 600 540 600'/%3E%3Cpolygon fill='%23999' points='450 450 540 300 360 300'/%3E%3Cpolygon fill='%23999' points='630 450 540 600 720 600'/%3E%3Cpolygon fill='%23FFF' points='630 450 720 300 540 300'/%3E%3Cpolygon points='810 450 720 600 900 600'/%3E%3Cpolygon fill='%23DDD' points='810 450 900 300 720 300'/%3E%3Cpolygon fill='%23AAA' points='990 450 900 600 1080 600'/%3E%3Cpolygon fill='%23444' points='990 450 1080 300 900 300'/%3E%3Cpolygon fill='%23222' points='90 750 0 900 180 900'/%3E%3Cpolygon points='270 750 180 900 360 900'/%3E%3Cpolygon fill='%23DDD' points='270 750 360 600 180 600'/%3E%3Cpolygon points='450 750 540 600 360 600'/%3E%3Cpolygon points='630 750 540 900 720 900'/%3E%3Cpolygon fill='%23444' points='630 750 720 600 540 600'/%3E%3Cpolygon fill='%23AAA' points='810 750 720 900 900 900'/%3E%3Cpolygon fill='%23666' points='810 750 900 600 720 600'/%3E%3Cpolygon fill='%23999' points='990 750 900 900 1080 900'/%3E%3Cpolygon fill='%23999' points='180 0 90 150 270 150'/%3E%3Cpolygon fill='%23444' points='360 0 270 150 450 150'/%3E%3Cpolygon fill='%23FFF' points='540 0 450 150 630 150'/%3E%3Cpolygon points='900 0 810 150 990 150'/%3E%3Cpolygon fill='%23222' points='0 300 -90 450 90 450'/%3E%3Cpolygon fill='%23FFF' points='0 300 90 150 -90 150'/%3E%3Cpolygon fill='%23FFF' points='180 300 90 450 270 450'/%3E%3Cpolygon fill='%23666' points='180 300 270 150 90 150'/%3E%3Cpolygon fill='%23222' points='360 300 270 450 450 450'/%3E%3Cpolygon fill='%23FFF' points='360 300 450 150 270 150'/%3E%3Cpolygon fill='%23444' points='540 300 450 450 630 450'/%3E%3Cpolygon fill='%23222' points='540 300 630 150 450 150'/%3E%3Cpolygon fill='%23AAA' points='720 300 630 450 810 450'/%3E%3Cpolygon fill='%23666' points='720 300 810 150 630 150'/%3E%3Cpolygon fill='%23FFF' points='900 300 810 450 990 450'/%3E%3Cpolygon fill='%23999' points='900 300 990 150 810 150'/%3E%3Cpolygon points='0 600 -90 750 90 750'/%3E%3Cpolygon fill='%23666' points='0 600 90 450 -90 450'/%3E%3Cpolygon fill='%23AAA' points='180 600 90 750 270 750'/%3E%3Cpolygon fill='%23444' points='180 600 270 450 90 450'/%3E%3Cpolygon fill='%23444' points='360 600 270 750 450 750'/%3E%3Cpolygon fill='%23999' points='360 600 450 450 270 450'/%3E%3Cpolygon fill='%23666' points='540 600 630 450 450 450'/%3E%3Cpolygon fill='%23222' points='720 600 630 750 810 750'/%3E%3Cpolygon fill='%23FFF' points='900 600 810 750 990 750'/%3E%3Cpolygon fill='%23222' points='900 600 990 450 810 450'/%3E%3Cpolygon fill='%23DDD' points='0 900 90 750 -90 750'/%3E%3Cpolygon fill='%23444' points='180 900 270 750 90 750'/%3E%3Cpolygon fill='%23FFF' points='360 900 450 750 270 750'/%3E%3Cpolygon fill='%23AAA' points='540 900 630 750 450 750'/%3E%3Cpolygon fill='%23FFF' points='720 900 810 750 630 750'/%3E%3Cpolygon fill='%23222' points='900 900 990 750 810 750'/%3E%3Cpolygon fill='%23222' points='1080 300 990 450 1170 450'/%3E%3Cpolygon fill='%23FFF' points='1080 300 1170 150 990 150'/%3E%3Cpolygon points='1080 600 990 750 1170 750'/%3E%3Cpolygon fill='%23666' points='1080 600 1170 450 990 450'/%3E%3Cpolygon fill='%23DDD' points='1080 900 1170 750 990 750'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect x='0' y='0' fill='url(%23a)' width='100%25' height='100%25'/%3E%3Crect x='0' y='0' fill='url(%23b)' width='100%25' height='100%25'/%3E%3C/svg%3E");
// background-attachment: fixed;
// background-size: cover;                
                } else if (viz.config.base_obj === "svg") {
                    if (viz.config.style === "s1") {

                        // From https://loading.io/spinner/dash-ring/
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(71.019 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="31.41592653589793 251.32741228718345" stroke-linecap="round" stroke-width="7" transform="rotate(0 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="31.41592653589793 251.32741228718345" stroke-linecap="round" stroke-width="7" transform="rotate(90 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="31.41592653589793 251.32741228718345" stroke-linecap="round" stroke-width="7" transform="rotate(180 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="31.41592653589793 251.32741228718345" stroke-linecap="round" stroke-width="7" transform="rotate(270 50 50)"></circle>'+
                        '</g>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s2") {

                        // From https://loading.io/spinner/recycle/-recycle-spinner
                        viz.$svg = $('<svg width="95%" height="95%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-6 0 106 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="translate(50,50)">'+
                        '<g transform="scale(1.0888888888888888)">'+
                        '<g transform="translate(-50,-50)">'+
                        '<g transform="rotate(142.836 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M12.2,25.7C19.4,14.4,31.5,6.6,45.6,5.2l3.8,7.7l-4.2,8.3c-8.1,1.3-15,6-19.4,12.5l-4.9-7.5L12.2,25.7z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M56,12.9l-4,8c8.2,0.6,15.5,4.6,20.5,10.6l9.3-0.6l4.7-7.2C78.8,13,66.3,5.7,52.1,5.1L56,12.9z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M85.1,36.7l-8.9,0.5c3.5,7.2,3.9,15.6,1.1,23.1l5.1,7.7l8.6,0.5c5.6-12.4,5.3-27.1-1-39.2L85.1,36.7z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M79.1,73.8l-4.9-7.5c-4.4,6.5-11.4,11.1-19.4,12.5l-4.2,8.3l3.8,7.7c14-1.4,26.1-9.2,33.4-20.5L79.1,73.8z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M14.9,63.3l8.9-0.5c-3.5-7.2-3.9-15.6-1.1-23.1L17.6,32L9,31.5c-5.6,12.4-5.3,27.1,1,39.2L14.9,63.3z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M44,87.1l4-8c-8.2-0.6-15.5-4.6-20.5-10.6l-9.3,0.6l-4.7,7.2C21.2,87,33.7,94.3,47.9,94.9L44,87.1z"></path>'+
                        '</g></g></g></g></svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s3") {

                        // From https://loading.io/spinner/eclipse/-ring-loading-gif
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<path stroke="none" d="M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50" class="number_display_viz-fill_base" fill="#fc4309" transform="rotate(210.185 50 51)">'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '</path>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s4") {

                        // From https://loading.io/spinner/camera/-camera-aperture-ajax-spinner
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="translate(50,50)">'+
                        '<g transform="scale(0.8)">'+
                        '<g transform="translate(-50,-50)">'+
                        '<g transform="rotate(356.226 50.0002 50.0002)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="360 50 50;0 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M54.3,28.1h34.2c-4.5-9.3-12.4-16.7-21.9-20.8L45.7,28.1L54.3,28.1L54.3,28.1z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M61.7,7.3C51.9,4,41.1,4.2,31.5,8.1v29.5l6.1-6.1L61.7,7.3C61.7,7.3,61.7,7.3,61.7,7.3z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M28.1,11.6c-9.3,4.5-16.7,12.4-20.8,21.9l20.8,20.8v-8.6L28.1,11.6C28.1,11.6,28.1,11.6,28.1,11.6z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M31.5,62.4L7.3,38.3c0,0,0,0,0,0C4,48.1,4.2,58.9,8.1,68.5h29.5L31.5,62.4z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M45.7,71.9H11.5c0,0,0,0,0,0c4.5,9.3,12.4,16.7,21.9,20.8l20.8-20.8H45.7z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M62.4,68.5L38.3,92.6c0,0,0,0,0,0c9.8,3.4,20.6,3.1,30.2-0.8V62.4L62.4,68.5z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M71.9,45.7v8.6v34.2c0,0,0,0,0,0c9.3-4.5,16.7-12.4,20.8-21.9L71.9,45.7z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M91.9,31.5C91.9,31.5,91.9,31.5,91.9,31.5l-29.5,0l0,0l6.1,6.1l24.1,24.1c0,0,0,0,0,0 C96,51.9,95.8,41.1,91.9,31.5z"></path>'+
                        '</g></g></g></g></svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s5") {

                        // From https://loading.io/spinner/vortex/-vortex-spiral-spinner
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="translate(50,50)">'+
                        '<g transform="scale(0.8)">'+
                        '<g transform="translate(-50,-50)">'+
                        '<g transform="rotate(325.216 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="360 50 50;0 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M30.4,9.7c-7.4,10.9-11.8,23.8-12.3,37.9c0.2,1,0.5,1.9,0.7,2.8c1.4-5.2,3.4-10.3,6.2-15.1 c2.6-4.4,5.6-8.4,9-12c0.7-0.7,1.4-1.4,2.1-2.1c7.4-7,16.4-12,26-14.6C51.5,3.6,40.2,4.9,30.4,9.7z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M24.8,64.2c-2.6-4.4-4.5-9.1-5.9-13.8c-0.3-0.9-0.5-1.9-0.7-2.8c-2.4-9.9-2.2-20.2,0.4-29.8 C10.6,25.5,6,36,5.3,46.8C11,58.6,20,68.9,31.9,76.3c0.9,0.3,1.9,0.5,2.8,0.8C31,73.3,27.6,69,24.8,64.2z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M49.6,78.9c-5.1,0-10.1-0.6-14.9-1.8c-1-0.2-1.9-0.5-2.8-0.8c-9.8-2.9-18.5-8.2-25.6-15.2 c2.8,10.8,9.5,20,18.5,26c13.1,0.9,26.6-1.7,38.9-8.3c0.7-0.7,1.4-1.4,2.1-2.1C60.7,78.2,55.3,78.9,49.6,78.9z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M81.1,49.6c-1.4,5.2-3.4,10.3-6.2,15.1c-2.6,4.4-5.6,8.4-9,12c-0.7,0.7-1.4,1.4-2.1,2.1 c-7.4,7-16.4,12-26,14.6c10.7,3,22.1,1.7,31.8-3.1c7.4-10.9,11.8-23.8,12.3-37.9C81.6,51.5,81.4,50.6,81.1,49.6z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M75.2,12.9c-13.1-0.9-26.6,1.7-38.9,8.3c-0.7,0.7-1.4,1.4-2.1,2.1c5.2-1.4,10.6-2.2,16.2-2.2 c5.1,0,10.1,0.6,14.9,1.8c1,0.2,1.9,0.5,2.8,0.8c9.8,2.9,18.5,8.2,25.6,15.2C90.9,28.1,84.2,18.9,75.2,12.9z"></path>'+
                        '<path class="number_display_viz-fill_base" fill="#ffffff" d="M94.7,53.2C89,41.4,80,31.1,68.1,23.7c-0.9-0.3-1.9-0.5-2.8-0.8c3.8,3.8,7.2,8.1,10,13 c2.6,4.4,4.5,9.1,5.9,13.8c0.3,0.9,0.5,1.9,0.7,2.8c2.4,9.9,2.2,20.2-0.4,29.8C89.4,74.5,94,64,94.7,53.2z"></path>'+
                        '</g></g></g></g>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s6") {

                        // From https://loading.io/spinner/hud/-futuristic-game-interface-preloader
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="3 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<style type="text/css">.st2 { opacity: 0.3; }</style>'+
                        '<g class="st2" transform="rotate(0.0144043 53.064 52)">'+
                        '<path d="M36,61.9c-1.7-3-2.7-6.4-2.7-9.9c0-10.9,8.8-19.7,19.7-19.7v1c-10.3,0-18.8,8.4-18.8,18.8 c0,3.3,0.9,6.5,2.5,9.4L36,61.9z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s"  repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g class="st2" transform="rotate(180.519 53.064 52)">'+
                        '<path d="M57,75.3l-0.5-3c9.9-1.7,17.2-10.2,17.2-20.3c0-11.4-9.2-20.6-20.6-20.6S32.5,40.6,32.5,52 c0,1.6,0.2,3.2,0.5,4.7l-3,0.7c-0.4-1.8-0.6-3.6-0.6-5.4c0-13.1,10.6-23.7,23.7-23.7S76.7,38.9,76.7,52 C76.7,63.6,68.4,73.4,57,75.3z"  class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 53.064 52;360 53.064 52" keyTimes="0;1" class="number_display_viz-speed_05x" dur="5s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(0.0144043 53.064 52)">'+
                        '<path d="M90.5,45.4c-1.5-8.8-6.2-16.8-13-22.5l0,0c-3.4-2.9-7.3-5.1-11.4-6.6s-8.5-2.3-13-2.3v2.4v1.4v2.4 c3.7,0,7.4,0.6,10.9,1.9l0.8-2.3c0,0,0,0,0,0c3.7,1.4,7.2,3.4,10.3,5.9l1.2-1.5L75,25.8c0,0,0,0,0,0l-1.5,1.8 c5.7,4.8,9.6,11.5,10.9,18.8l3.8-0.7c0,0,0,0,0,0L90.5,45.4z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<path d="M29.7,22l4.7,6.1c3.5-2.8,7.5-4.6,11.9-5.6l-1.7-7.5C39.2,16.2,34.2,18.5,29.7,22z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(180.519 53.064 52)">'+
                        '<path d="M53.1,92.4v-1c21.8,0,39.5-17.7,39.5-39.5c0-21.8-17.7-39.5-39.5-39.5c-15.8,0-30,9.4-36.2,23.8L15.9,36 c6.4-14.8,21-24.4,37.1-24.4c22.3,0,40.4,18.1,40.4,40.4C93.5,74.3,75.3,92.4,53.1,92.4z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 53.064 52;360 53.064 52" keyTimes="0;1" class="number_display_viz-speed_05x" dur="5s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(180.007 53.064 52)">'+
                        '<path d="M39.7,28.5l0.6,1c3.9-2.2,8.3-3.4,12.8-3.4V25C48.4,25,43.7,26.2,39.7,28.5z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<path d="M28.6,60.6l-1.1,0.4C31.3,71.8,41.6,79,53.1,79v-1.2C42.1,77.9,32.3,70.9,28.6,60.6z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_15x" dur="15s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s7") {

                        // From https://loading.io/spinner/dash-ring/
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(8.69245 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(0 50 50)"  ></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(18 50 50)" ></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(36 50 50)" ></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(54 50 50)" ></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(72 50 50)" ></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(90 50 50)" ></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(108 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(126 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(144 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(162 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(180 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(198 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(216 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(234 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(252 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(270 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(288 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(306 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(324 50 50)"></circle>'+
                        '<circle cx="50" cy="50" r="40" class="number_display_viz-stroke_base" stroke="#ffffff" fill="none" stroke-dasharray="6.283185307179586 251.32741228718345" stroke-linecap="round" stroke-width="1" transform="rotate(342 50 50)"></circle>'+
                        '</g>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s8") {

//<div>Icons made by <a href="https://www.flaticon.com/authors/mynamepong" title="mynamepong">mynamepong</a> from <a href="https://www.flaticon.com/" 			    title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" 			    title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
                        viz.$svg = $('<svg height="100%" width="100%" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">'+
                        '<path d="m440 0h-400c-22.082031.0273438-39.9726562 17.917969-40 40v400c.0273438 22.082031 17.917969 39.972656 40 40h400c22.082031-.027344 39.972656-17.917969 40-40v-400c-.027344-22.082031-17.917969-39.9726562-40-40zm-424 40c0-13.253906 10.746094-24 24-24h113.984375c-63.375 24.511719-113.472656 74.609375-137.984375 137.984375zm224-24c123.710938 0 224 100.289062 224 224s-100.289062 224-224 224-224-100.289062-224-224c.140625-123.652344 100.347656-223.859375 224-224zm-200 448c-13.253906 0-24-10.746094-24-24v-113.984375c24.511719 63.375 74.609375 113.472656 137.984375 137.984375zm424-24c0 13.253906-10.746094 24-24 24h-113.984375c63.375-24.511719 113.472656-74.609375 137.984375-137.984375zm-137.984375-424h113.984375c13.253906 0 24 10.746094 24 24v113.984375c-24.511719-63.375-74.609375-113.472656-137.984375-137.984375zm0 0" class="number_display_viz-fill_darker" fill="#ffffff"/>'+
                        '<path d="m48 24c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0" class="number_display_viz-fill_darker" fill="#ffffff"/>'+
                        '<path d="m48 408c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0" class="number_display_viz-fill_darker" fill="#ffffff"/>'+
                        '<path d="m432 456c13.253906 0 24-10.746094 24-24s-10.746094-24-24-24-24 10.746094-24 24 10.746094 24 24 24zm0-32c4.417969 0 8 3.582031 8 8s-3.582031 8-8 8-8-3.582031-8-8 3.582031-8 8-8zm0 0" class="number_display_viz-fill_darker" fill="#ffffff"/>'+
                        '<path d="m432 24c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24-10.746094-24-24-24zm0 32c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0" class="number_display_viz-fill_darker" fill="#ffffff"/>'+
                        '<g transform="rotate(360 240 240)">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="0 240 240;360 240 240" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path d="m37.265625 212.800781c1.960937 1.828125 4.710937 2.550781 7.320313 1.925781 38.632812-9.273437 79.339843-3.765624 114.117187 15.449219-45.472656 4.953125-87.199219 27.523438-116.222656 62.878907-1.707031 2.070312-2.261719 4.859374-1.480469 7.425781 4.621094 15.171875 10.949219 29.773437 18.863281 43.519531 12.414063 21.550781 28.605469 40.6875 47.800781 56.503906 2.070313 1.726563 4.871094 2.296875 7.449219 1.511719s4.589844-2.8125 5.351563-5.398437c11.277344-38.105469 36.402344-70.609376 70.4375-91.121094-9.855469 22.195312-14.933594 46.21875-14.902344 70.503906.003906 21.039062 3.796875 41.90625 11.199219 61.601562.941406 2.511719 3.074219 4.386719 5.6875 4.992188 39.863281 9.273438 81.574219 6.582031 119.914062-7.738281 2.511719-.9375 4.386719-3.074219 4.992188-5.6875.601562-2.613281-.140625-5.355469-1.984375-7.304688-27.355469-28.820312-42.9375-66.832031-43.679688-106.558593 14.292969 19.621093 32.554688 36.015624 53.597656 48.121093 18.214844 10.519531 38.179688 17.667969 58.929688 21.101563.433594.074218.871094.109375 1.3125.113281 2.21875 0 4.335938-.921875 5.847656-2.542969 27.988282-29.886718 46.527344-67.367187 53.296875-107.746094.441407-2.644531-.472656-5.335937-2.4375-7.164062-1.960937-1.832031-4.707031-2.554688-7.316406-1.929688-38.632813 9.269532-79.339844 3.757813-114.121094-15.449218 24.148438-2.585938 47.480469-10.21875 68.488281-22.402344 18.214844-10.515625 34.386719-24.226562 47.738282-40.476562 1.707031-2.070313 2.261718-4.859376 1.480468-7.425782-4.605468-15.167968-10.914062-29.761718-18.808593-43.503906-12.414063-21.550781-28.605469-40.6875-47.800781-56.503906-2.070313-1.707032-4.855469-2.265625-7.425782-1.484375-2.566406.785156-4.570312 2.800781-5.335937 5.371093-11.265625 38.097657-36.378907 70.597657-70.398438 91.113282 9.828125-22.199219 14.878907-46.21875 14.824219-70.496094-.003906-21.039062-3.796875-41.90625-11.199219-61.601562-.941406-2.511719-3.074219-4.386719-5.6875-4.992188-39.863281-9.257812-81.570312-6.570312-119.914062 7.738281-2.511719.9375-4.386719 3.074219-4.992188 5.6875-.601562 2.613281.140625 5.355469 1.984375 7.304688 27.355469 28.820312 42.9375 66.832031 43.679688 106.558593-14.292969-19.621093-32.554688-36.015624-53.597656-48.121093-18.214844-10.519531-38.179688-17.667969-58.929688-21.101563-2.636719-.441406-5.320312.460938-7.160156 2.398438-28.011719 29.886718-46.574219 67.378906-53.351563 107.777344-.4375 2.640624.476563 5.324218 2.433594 7.152343zm202.734375-36.800781c31.207031-.03125 57.878906 22.460938 63.113281 53.226562 5.234375 30.761719-12.5 60.8125-41.960937 71.101563l-.113282.046875c-24.042968 8.453125-50.808593 1.839844-68.144531-16.84375-17.332031-18.679688-21.933593-45.867188-11.707031-69.210938s33.328125-38.394531 58.8125-38.320312zm-131.007812 204.398438c-23.636719-22.0625-41.3125-49.742188-51.390626-80.460938 11.578126-13.359375 25.308594-24.691406 40.613282-33.539062 19.050781-11.039063 40.207031-17.960938 62.097656-20.320313 1.328125 17.476563 8.390625 34.027344 20.09375 47.074219-32.785156 20.394531-57.898438 51.074218-71.414062 87.246094zm91.726562 47.523437c-13.085938-37.839844-11.390625-79.226563 4.738281-115.875 15.777344 7.65625 33.648438 9.863281 50.816407 6.28125 1.292968 38.539063 15.285156 75.566406 39.804687 105.328125-30.921875 9.417969-63.71875 10.886719-95.359375 4.265625zm226.402344-144.65625c-7.304688 31.5-22.445313 60.644531-44.015625 84.734375-39.308594-7.535156-74.269531-29.761719-97.769531-62.160156 14.359374-9.914063 25.097656-24.238282 30.59375-40.800782 34.027343 18.171876 73.109374 24.578126 111.160156 18.226563zm-56.113282-183.664063c23.636719 22.0625 41.3125 49.742188 51.390626 80.460938-11.578126 13.359375-25.308594 24.691406-40.613282 33.539062-19.050781 11.042969-40.203125 17.964844-62.097656 20.320313-1.328125-17.476563-8.390625-34.027344-20.09375-47.074219 32.785156-20.394531 57.898438-51.074218 71.414062-87.246094zm-91.726562-47.523437c13.085938 37.839844 11.390625 79.226563-4.738281 115.875-15.777344-7.65625-33.648438-9.863281-50.816407-6.28125-1.292968-38.539063-15.285156-75.566406-39.804687-105.328125 30.921875-9.417969 63.71875-10.886719 95.359375-4.265625zm-205.5625 91.921875c6.617188-11.433594 14.390625-22.15625 23.203125-32 17.347656 3.347656 34.015625 9.566406 49.316406 18.398438 19.027344 11.027343 35.53125 25.925781 48.441407 43.730468-14.355469 9.917969-25.089844 24.238282-30.582032 40.800782-34.042968-18.164063-73.132812-24.558594-111.1875-18.195313 4.28125-18.511719 11.296875-36.285156 20.808594-52.734375zm0 0" class="number_display_viz-fill_base" fill="#ffffff"/>'+
                        '</g>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s9") {

                        viz.$svg = $('<svg height="100%" width="100%" viewBox="0 0 464 464" xmlns="http://www.w3.org/2000/svg">'+
                        '<g class="number_display_viz-fill_base" fill="#ffffff">'+
                        '<animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" values="0 232 232;360 232 232" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" keySplines="0.5 0.5 0.5 0.5" calcMode="spline"></animateTransform>'+
                        '<path d="m161.96875 44.632812c29.589844 31.117188 46.070312 72.425782 46.03125 115.367188 0 4.335938-.164062 8.625-.496094 12.871094 19.3125-8.011719 41.324219-6.054688 58.921875 5.234375 24.296875-43.039063 28.285157-94.628907 10.886719-140.890625-38.339844-8.929688-78.464844-6.351563-115.34375 7.417968zm0 0"/>'+
                        '<path d="m34.71875 198.96875c41.746094-10.0625 85.761719-3.675781 122.929688 17.832031 3.734374 2.167969 7.367187 4.457031 10.902343 6.863281 2.714844-20.730468 15.410157-38.8125 33.984375-48.40625-25.121094-42.5625-67.800781-71.808593-116.558594-79.875-26.914062 28.726563-44.746093 64.761719-51.257812 103.585938zm0 0"/>'+
                        '<path d="m104.753906 386.328125c12.15625-41.175781 39.691406-76.097656 76.894532-97.527344 3.734374-2.171875 7.53125-4.175781 11.390624-6.007812-16.589843-12.71875-25.902343-32.757813-24.925781-53.640625-49.417969.476562-96.085937 22.808594-127.457031 60.992187 11.429688 37.671875 33.726562 71.132813 64.097656 96.183594zm0 0"/>'+
                        '<path d="m302.03125 419.367188c-29.589844-31.117188-46.070312-72.425782-46.03125-115.367188 0-4.335938.164062-8.625.496094-12.871094-19.3125 8.011719-41.324219 6.054688-58.921875-5.234375-24.296875 43.039063-28.285157 94.628907-10.886719 140.890625 38.339844 8.929688 78.464844 6.351563 115.34375-7.417968zm0 0"/>'+
                        '<path d="m429.28125 265.03125c-41.746094 10.0625-85.761719 3.675781-122.929688-17.832031-3.734374-2.167969-7.367187-4.457031-10.902343-6.863281-2.699219 20.75-15.394531 38.859374-33.984375 48.464843 25.121094 42.558594 67.800781 71.804688 116.558594 79.871094 26.917968-28.730469 44.746093-64.773437 51.257812-103.601563zm0 0"/>'+
                        '<path d="m359.246094 77.671875c-12.15625 41.175781-39.691406 76.097656-76.894532 97.527344-3.734374 2.167969-7.53125 4.167969-11.390624 6.007812 16.578124 12.710938 25.890624 32.730469 24.925781 53.601563 49.417969-.484375 96.085937-22.820313 127.457031-61.007813-11.429688-37.675781-33.726562-71.132812-64.097656-96.183593zm0 0"/>'+
                        '</g>'+
                        //'<path d="m304 232c0 39.765625-32.234375 72-72 72s-72-32.234375-72-72 32.234375-72 72-72 72 32.234375 72 72zm0 0" fill="#bec3d1"/>'+
                        '</svg>').appendTo(viz.$wrapc2);
// TODO the drop shadow needs to scale.
// Drop shadow color and enablement should be configurable
// Add textured background
// add internal multiplier of spinner speed so all go about the same
// Add subtitle
// Add library that can do color darkening etc.
// Then set borders around the place to be a few shades darker than the elem 
                    } else if (viz.config.style === "a1") { // square
                        viz.$svg = $('<svg width="100%" height="100%" mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<rect x="5" y="5" width="90" height="90" class="number_display_viz-fill_base" fill="#ffffff" />' +
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a2") { // rect 1
                        viz.$svg = $('<svg width="100%" height="100%" mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 50" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<rect x="5" y="5" width="90" height="45" class="number_display_viz-fill_base" fill="#ffffff" />' +
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a3") { // rect 2
                        viz.$svg = $('<svg width="100%" height="100%" mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="7 6 90 90" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        // TODO
                        '<path d="M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10 Z M 50 30 A 20 20 0 1 1 50 70 A 20 20 0 1 1 50 30 Z" class="number_display_viz-fill_base" fill="#ffffff" />' +
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a4") { // circle
                        viz.$svg = $('<svg width="100%" height="100%" mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="10 10 90 90" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<circle cx="55" cy="55" r="40" class="number_display_viz-fill_base" fill="#ffffff" />' +
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a5") { // big ring
                        viz.$svg = $('<svg width="100%" height="100%" mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="7 6 86 86" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<path d="M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10 Z M 50 30 A 20 20 0 1 1 50 70 A 20 20 0 1 1 50 30 Z" class="number_display_viz-fill_base" fill="#ffffff" />' +
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a6") { // little ring
                        viz.$svg = $('<svg width="100%" height="100%" mlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="7 6 86 86" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<path d="M 50 10 '+ 
                        'A 40 40 0 1 0 50 90 '+
                        'A 40 40 0 1 0 50 10 '+
                        'Z '+
                        'M 50 15 '+
                        'A 35 35 0 1 1 50 85 '+
                        'A 35 35 0 1 1 50 15 Z" class="number_display_viz-fill_base" fill="#ffffff" />' +
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a7") { // Hex 1
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid"  style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<polygon points="300,150 225,280 75,280 0,150 75,20 225,20" class="number_display_viz-fill_base" fill="#ffffff"></polygon>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a8") { // Hex 2
                        // from here: https://codepen.io/wvr/pen/WrNgJp
                        viz.$svg = $('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 0 200 173.20508075688772" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);"><path fill="#0000dd" d="M5.000000000000001 95.26279441628824Q0 86.60254037844386 5.000000000000001 77.94228634059948L45 8.660254037844386Q50 0 60 0L140 0Q150 0 155 8.660254037844386L195 77.94228634059948Q200 86.60254037844386 195 95.26279441628824L155 164.54482671904333Q150 173.20508075688772 140 173.20508075688772L60 173.20508075688772Q50 173.20508075688772 45 164.54482671904333Z" class="number_display_viz-fill_base" fill="#ffffff"></path></svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a9") { // Hex 3
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 -5 175 205" preserveAspectRatio="xMidYMid" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);">'+
                        '<polygon points="87,0 174,50 174,150 87,200 0,150 0,50 87,0" class="number_display_viz-fill_base" fill="#ffffff"></polygon>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "a10") { // Hex 4
                        viz.$svg = $('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewbox="0 -4 173.20508075688772 204" style="filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 10px);"><path fill="#0000dd" d="M77.94228634059948 4.999999999999999Q86.60254037844386 0 95.26279441628824 4.999999999999999L164.54482671904333 45Q173.20508075688772 50 173.20508075688772 60L173.20508075688772 140Q173.20508075688772 150 164.54482671904333 155L95.26279441628824 195Q86.60254037844386 200 77.94228634059948 195L8.660254037844387 155Q0 150 0 140L0 60Q0 50 8.660254037844387 45Z" class="number_display_viz-fill_base" fill="#ffffff"></path></svg>').appendTo(viz.$wrapc2);
                    }                                        
                }
            }

            if (viz.config.sparkorder === "fg") {
                viz.$wrapc1.css("z-index", 2);
            } else if (viz.config.sparkorder === "bg") {
                viz.$wrapc2.css("z-index", 2);
            }
            // Figure out the size
            if (viz.config.size > 0) {
                viz.size = viz.config.size;
            } else {
                viz.size = Math.min(viz.$container_wrap.height(), viz.$container_wrap.width()) - 10;
            }

            viz.$wrapc1.css({
                "margin-top": (viz.size * viz.config.sparkMarginTop) + "px", 
                "height": (viz.size * viz.config.sparkHeight) + "px", 
                "width": (viz.size * viz.config.sparkWidth) + "px"
            });
            viz.$wrapc2.css({
                "height": (viz.size * viz.config.mainHeight) + "px", 
                "width": (viz.size * viz.config.mainWidth) + "px"
                });
            viz.$canvas1[0].height = viz.size * viz.config.sparkHeight;
            viz.$canvas1[0].width = viz.size * viz.config.sparkWidth;
            viz.ctx1 = viz.$canvas1[0].getContext('2d');

            var overlayPosition = {
                center: {"margin-left": (viz.size / 2 * -1) + "px"},
                right: {"margin-left": (viz.size * 0.05) + "px", "text-align": "left"}
            }
            var fontsize = (viz.size * 0.2 * (Number(viz.config.textsize) / 100) * viz.config.overlaySize);
            viz.$overlay.css({
                "font-size": fontsize + "px", 
                "margin-top": (viz.size * viz.config.overlayHeight - (fontsize * 0.5)) + "px", 
                "height" : viz.size - (viz.size * viz.config.overlayHeight - (fontsize * 0.5)) + "px", 
                "width": (viz.size * viz.config.mainWidth) + "px",
                "left": "50%"
            }).css(overlayPosition[viz.config.overlayPosition]).addClass(viz.config.textfont);
            if (viz.config.textmode === "static") {
                viz.$overlay.css({"color": viz.config.textcolor});
            }

            if (doAFullRedraw) {
                if (viz.config.base_obj === "donut") {
                    viz.$canvas2[0].height = viz.size * viz.config.mainHeight;
                    viz.$canvas2[0].width = viz.size * viz.config.mainWidth;
                    viz.ctx2 = viz.$canvas2[0].getContext('2d');
                    viz.donutCfg = {
                        type: 'doughnut',
                        data: {
                            datasets: [],
                            labels: []
                        },
                        options: {
                            cutoutPercentage: viz.config.cutoutPercentage,
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
                                filter: function(tt) {
                                    return !(tt.datasetIndex === 1 && tt.index === 1);
                                },
                                callbacks: {
                                    label: function(tt, data) {
                                        // Threshold band
                                        if (tt.datasetIndex === 0) {
                                            var thrs = [];
                                            var last_val = 0;
                                            for (var i = 0; i < data.datasets[0].data.length; i++) {
                                                last_val += data.datasets[0].data[i];
                                                thrs.push(last_val);
                                            }
                                            thrs.pop();
                                            return  "Thresholds: " + thrs.join(", ")

                                        } else if (tt.datasetIndex === 1 && tt.index === 0) {
                                            return data.datasets[1].data[0];
                                        }
                                        return null;
                                    } 
                                }
                            },
                            // onClick: function(browserEvent, elements){
                            //     var data = {};
                            //     if (elements.length > 0) {
                            //         data[instance.datas.fields[0].name] = viz.data.labels[elements[0]._index];
                            //         instance.drilldown({
                            //             action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                            //             data: data
                            //         }, browserEvent);
                            //     }
                            // }
                        }
                    };
                    viz.myDoughnut = new Chart(viz.ctx2, viz.donutCfg);
                }
                if (viz.config.sparkshow === "yes") {
                    viz.areaCfg = {
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
                            },
                            tooltips: {
                                callbacks: {
                                    label: function(tooltipItem, data) {
                                        return "";
                                    } 
                                }
                            },
                        }
                    };
                    if ($.trim(viz.config.sparkmax) !== "" && ! isNaN(Number(viz.config.sparkmax))) {
                        viz.areaCfg.options.scales.yAxes[0].ticks.max = Number(viz.config.sparkmax);
                    }
                    if ($.trim(viz.config.sparkmin) !== "" && ! isNaN(Number(viz.config.sparkmin))) {
                        viz.areaCfg.options.scales.yAxes[0].ticks.min = Number(viz.config.sparkmin);
                    }
                    viz.myArea = new Chart(viz.ctx1, viz.areaCfg);
                }
            }

            // Figure out the thresholds
            var threshold_colors = [];
            var threshold_values = [];
            var thresholds_arr = [{
                color: viz.config.thresholdcol1, 
                value: -Infinity
            }];
            //viz.config.thresholdval1 = viz.config.min;
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
                    nextval = Math.max(viz.config.max, thresholds_arr[i].value);
                } else {
                    nextval = thresholds_arr[i+1].value;
                }
                if (nextval > viz.config.min && thresholds_arr[i].value < viz.config.max) {
                    threshold_colors.push(thresholds_arr[i].color);
                    threshold_values.push(Math.min(nextval, viz.config.max) - Math.max(thresholds_arr[i].value, viz.config.min));
                }
            }
            console.log("thresholds: ", threshold_colors, threshold_values);
            var ignoreField = -1;
            var colors = viz.colors;
            var foundNumeric = true;
            var overtimedata = [];
            var value;
            if (viz.data.columns.length) {
                //console.log(viz.data);
                // Sparkline data
                if (Array.isArray(viz.data.columns[0]) && Array.isArray(viz.data.columns[0][0]) && viz.data.columns[0][0][0] === "##__SPARKLINE__##") {
                    overtimedata = viz.data.columns[0][0].slice(1);
                    // by default, use the last element in the sparkline as the value.
                    value = overtimedata[overtimedata.length - 1];
                    // but if there is a second field it can be the override value
                    if (viz.data.columns.length > 1 && viz.data.columns[1].length > 0 && typeof viz.data.columns[1][0] === "string") {
                        value = viz.data.columns[1][0];
                    }
                // Timechart data
                } else if (viz.data.columns.length > 1 && viz.data.fields[0].name === "_time") {
                    overtimedata = viz.data.columns[1];
                    // with timechart data you cant supply an override
                    value = overtimedata[overtimedata.length - 1];
                // Fall back to a single value in the first column. there will be overtime chart
                } else if (typeof viz.data.columns[0][0] === "string") {
                    overtimedata = [];
                    value = viz.data.columns[0][0];
                } else {
                    foundNumeric = false;
                }
                console.log(overtimedata, value);

                var value_display = value;
                var value_color = viz.config.nodatacolor;
                var value_lowerseg = viz.config.min;
                var value_upperseg;
                var value_nodata = false;
                var value_as_percentage = 0;
                if (value === "" || isNaN(Number(value))) {
                    value = viz.config.min;
                    value_nodata = true;
                }
                value = Number(value);
                // limit to bounds
                value = Math.min(Math.max(value, viz.config.min), viz.config.max);
                // find the colour of the value
                if (! value_nodata) {
                    for (i = 0; i < thresholds_arr.length; i++){
                        if (value > thresholds_arr[i].value) {
                            value_color = thresholds_arr[i].color;
                        }
                    }
                }
                // determine the split of segments
                value_lowerseg = value - viz.config.min;
                value_upperseg = viz.config.max - value_lowerseg;
                value_as_percentage = (value - viz.config.min) / (viz.config.max - viz.config.min);

                if (viz.config.base_obj === "donut") {
                    viz.donutCfg.data.labels = ["",""];
                    if (viz.donutCfg.data.datasets.length === 0) {
                        viz.donutCfg.data.datasets = [{
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
                    viz.donutCfg.data.datasets[0].backgroundColor = threshold_colors;
                    viz.donutCfg.data.datasets[0].data = threshold_values;
                    viz.donutCfg.data.datasets[1].backgroundColor = [value_color, viz.config.shadowcolor];
                    viz.donutCfg.data.datasets[1].data = [value_lowerseg, value_upperseg];
                console.log(viz.donutCfg.data);
                } else if (viz.config.base_obj === "svg") {
                    // Calculate the speed of the viz
                    var speed = "999999";
                    if (! value_nodata) {
                        speed = (value_as_percentage * (viz.config.spinnerspeedmax - viz.config.spinnerspeedmin)) + viz.config.spinnerspeedmin;
                        speed = speed * viz.config.speedMultiplier;
                    }
                    var value_color_darker = viz.lightenDarkenColor(value_color, 30);
                    viz.$svg.find(".number_display_viz-fill_base").attr("fill", value_color);
                    viz.$svg.find(".number_display_viz-fill_darker").attr("fill", value_color_darker);
                    viz.$svg.find(".number_display_viz-stroke_base").attr("stroke", value_color);
                    viz.$svg.find(".number_display_viz-stroke_darker").attr("stroke", value_color_darker);
                    viz.$svg.find(".number_display_viz-speed_1x").attr("dur", speed + "s");
                    viz.$svg.find(".number_display_viz-speed_05x").attr("dur", (speed * 0.5) + "s");
                    viz.$svg.find(".number_display_viz-speed_15x").attr("dur", (speed * 1.5) + "s");
                } else if (viz.config.base_obj === "box") {
                    viz.$wrapc2.css({"background-color": value_color});
                }
                
                if (viz.config.sparkshow === "yes") {
                    viz.areaCfg.data.labels = overtimedata;
                    if (viz.areaCfg.data.datasets.length === 0) {
                        viz.areaCfg.data.datasets.push({});
                    }
                    viz.areaCfg.data.datasets[0].label = "";
                    if (viz.config.sparkcolormode === "auto") {
                        viz.areaCfg.data.datasets[0].backgroundColor = value_color;
                        viz.areaCfg.data.datasets[0].borderColor = value_color;
                    } else {
                        viz.areaCfg.data.datasets[0].backgroundColor = viz.config.sparkcolor;
                        viz.areaCfg.data.datasets[0].borderColor = viz.config.sparkcolor;
                    }
                    viz.areaCfg.data.datasets[0].pointRadius = 1;
                    viz.areaCfg.data.datasets[0].data = overtimedata;
                    viz.areaCfg.data.datasets[0].fill = viz.config.sparkstyle == "area" ? 'origin' : false;
                }
                // Animate number on change
                // Need to have a previous value and both old and new need to be numbers for animation to work
                // TODO need to kill any currently running animations
                
                var overlay_now = Number(value_display);
                var overlay_prev = viz.overlay_prev;
                viz.overlay_prev = overlay_now;

                if (viz.config.textshow === "yes") {
                    if (! isNaN(overlay_prev) && ! isNaN(overlay_now) && overlay_prev !== overlay_now && viz.config.textprecision !== "nolimit") {
                        $({value: overlay_prev, target: viz.$overlay}).animate({value: overlay_now}, {
                            duration: viz.config.textduration,
                            easing: "linear",
                            step: function(val, fx) {
                                this.target.html(viz.buildOverlay(val));
                            }
                        });
                    } else if (! isNaN(overlay_now)) {
                        viz.$overlay.html(viz.buildOverlay(overlay_now));
                    } else {
                        // html injection a-ok round these parts
                        viz.$overlay.html(value_display);
                    }
                    if (viz.config.textmode === "auto") {
                        viz.$overlay.css({"color": value_color});
                    }
                }

            } else {
                viz.$errordiv.html("No data").css("display", "block");
                viz.$canvas1.css("display", "none");
                viz.$canvas2.css("display", "none");
            }

            if (! foundNumeric) {
                viz.$errordiv.html("Numeric data required").css("display", "block");
                viz.$canvas1.css("display", "none");
                viz.$canvas2.css("display", "none");

            } else {
                if (viz.config.sparkshow === "yes") {
                    viz.myArea.update();
                }
                if (viz.config.base_obj === "donut") {
                    viz.myDoughnut.update(); 
                }
                viz.$errordiv.css("display", "none");
                viz.$canvas1.css("display", "block");
                viz.$canvas2.css("display", "block");
            }
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
            ret = ret.toString();
            if (viz.config.textthousands === "yes") {
                ret = ret.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            if (viz.config.textunit) {
                // intentially allowing html injection. yolo
                var unit = "<span class='number_display_viz-unit' style='font-size: " + viz.config.textunitsize + "%'>" + viz.config.textunit + "</span>";
                if (viz.config.textunitposition === "after") {
                    ret = ret + unit;
                } else {
                    ret = unit + ret;
                }
            }
            return ret;
        },

        lightenDarkenColor: function(col, amt) {
            col = col.slice(1);
            var num = parseInt(col,16);
            var r = (num >> 16) + amt;
            if (r > 255) r = 255;
            else if  (r < 0) r = 0;
            var b = ((num >> 8) & 0x00FF) + amt;
            if (b > 255) b = 255;
            else if  (b < 0) b = 0;
            var g = (num & 0x0000FF) + amt;
            if (g > 255) g = 255;
            else if (g < 0) g = 0;
            return "#" + (g | (b << 8) | (r << 16)).toString(16);
        },

        // Override to respond to re-sizing events
        reflow: function() {
            this.scheduleDraw();
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        },
    };

    return SplunkVisualizationBase.extend(vizObj);
});