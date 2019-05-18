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
                animations: "on",
                base_obj: "donut",
                doSvg: "",
                sparkmin: "",
                sparkmax: "",
                sparkcolormode: "auto",
                sparkcolor: "#5C6773",
                sparkstyle: "area",
                sparkorder: "bg",
                spinnerspeedmin: "10",
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
                b1: { 
                    base_obj: "box", 
                    overlayHeight: 0.3,
                    overlaySize: 2,
                    mainHeight:  1,
                    mainWidth: 2,
                    sparkMarginTop: 0.6,
                    sparkHeight: 0.4,
                    sparkWidth: 2,
                }
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
                viz.$container_wrap.append(viz.$errordiv, viz.$wrapc2, viz.$wrapc1, viz.$overlay);

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
// background-color: #ffffff;
// background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientUnits='userSpaceOnUse' x1='0' x2='0' y1='0' y2='100%25' gradientTransform='rotate(177,1280,648)'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23089929'/%3E%3C/linearGradient%3E%3Cpattern patternUnits='userSpaceOnUse' id='b' width='300' height='250' x='0' y='0' viewBox='0 0 1080 900'%3E%3Cg fill-opacity='0.1'%3E%3Cpolygon fill='%23444' points='90 150 0 300 180 300'/%3E%3Cpolygon points='90 150 180 0 0 0'/%3E%3Cpolygon fill='%23AAA' points='270 150 360 0 180 0'/%3E%3Cpolygon fill='%23DDD' points='450 150 360 300 540 300'/%3E%3Cpolygon fill='%23999' points='450 150 540 0 360 0'/%3E%3Cpolygon points='630 150 540 300 720 300'/%3E%3Cpolygon fill='%23DDD' points='630 150 720 0 540 0'/%3E%3Cpolygon fill='%23444' points='810 150 720 300 900 300'/%3E%3Cpolygon fill='%23FFF' points='810 150 900 0 720 0'/%3E%3Cpolygon fill='%23DDD' points='990 150 900 300 1080 300'/%3E%3Cpolygon fill='%23444' points='990 150 1080 0 900 0'/%3E%3Cpolygon fill='%23DDD' points='90 450 0 600 180 600'/%3E%3Cpolygon points='90 450 180 300 0 300'/%3E%3Cpolygon fill='%23666' points='270 450 180 600 360 600'/%3E%3Cpolygon fill='%23AAA' points='270 450 360 300 180 300'/%3E%3Cpolygon fill='%23DDD' points='450 450 360 600 540 600'/%3E%3Cpolygon fill='%23999' points='450 450 540 300 360 300'/%3E%3Cpolygon fill='%23999' points='630 450 540 600 720 600'/%3E%3Cpolygon fill='%23FFF' points='630 450 720 300 540 300'/%3E%3Cpolygon points='810 450 720 600 900 600'/%3E%3Cpolygon fill='%23DDD' points='810 450 900 300 720 300'/%3E%3Cpolygon fill='%23AAA' points='990 450 900 600 1080 600'/%3E%3Cpolygon fill='%23444' points='990 450 1080 300 900 300'/%3E%3Cpolygon fill='%23222' points='90 750 0 900 180 900'/%3E%3Cpolygon points='270 750 180 900 360 900'/%3E%3Cpolygon fill='%23DDD' points='270 750 360 600 180 600'/%3E%3Cpolygon points='450 750 540 600 360 600'/%3E%3Cpolygon points='630 750 540 900 720 900'/%3E%3Cpolygon fill='%23444' points='630 750 720 600 540 600'/%3E%3Cpolygon fill='%23AAA' points='810 750 720 900 900 900'/%3E%3Cpolygon fill='%23666' points='810 750 900 600 720 600'/%3E%3Cpolygon fill='%23999' points='990 750 900 900 1080 900'/%3E%3Cpolygon fill='%23999' points='180 0 90 150 270 150'/%3E%3Cpolygon fill='%23444' points='360 0 270 150 450 150'/%3E%3Cpolygon fill='%23FFF' points='540 0 450 150 630 150'/%3E%3Cpolygon points='900 0 810 150 990 150'/%3E%3Cpolygon fill='%23222' points='0 300 -90 450 90 450'/%3E%3Cpolygon fill='%23FFF' points='0 300 90 150 -90 150'/%3E%3Cpolygon fill='%23FFF' points='180 300 90 450 270 450'/%3E%3Cpolygon fill='%23666' points='180 300 270 150 90 150'/%3E%3Cpolygon fill='%23222' points='360 300 270 450 450 450'/%3E%3Cpolygon fill='%23FFF' points='360 300 450 150 270 150'/%3E%3Cpolygon fill='%23444' points='540 300 450 450 630 450'/%3E%3Cpolygon fill='%23222' points='540 300 630 150 450 150'/%3E%3Cpolygon fill='%23AAA' points='720 300 630 450 810 450'/%3E%3Cpolygon fill='%23666' points='720 300 810 150 630 150'/%3E%3Cpolygon fill='%23FFF' points='900 300 810 450 990 450'/%3E%3Cpolygon fill='%23999' points='900 300 990 150 810 150'/%3E%3Cpolygon points='0 600 -90 750 90 750'/%3E%3Cpolygon fill='%23666' points='0 600 90 450 -90 450'/%3E%3Cpolygon fill='%23AAA' points='180 600 90 750 270 750'/%3E%3Cpolygon fill='%23444' points='180 600 270 450 90 450'/%3E%3Cpolygon fill='%23444' points='360 600 270 750 450 750'/%3E%3Cpolygon fill='%23999' points='360 600 450 450 270 450'/%3E%3Cpolygon fill='%23666' points='540 600 630 450 450 450'/%3E%3Cpolygon fill='%23222' points='720 600 630 750 810 750'/%3E%3Cpolygon fill='%23FFF' points='900 600 810 750 990 750'/%3E%3Cpolygon fill='%23222' points='900 600 990 450 810 450'/%3E%3Cpolygon fill='%23DDD' points='0 900 90 750 -90 750'/%3E%3Cpolygon fill='%23444' points='180 900 270 750 90 750'/%3E%3Cpolygon fill='%23FFF' points='360 900 450 750 270 750'/%3E%3Cpolygon fill='%23AAA' points='540 900 630 750 450 750'/%3E%3Cpolygon fill='%23FFF' points='720 900 810 750 630 750'/%3E%3Cpolygon fill='%23222' points='900 900 990 750 810 750'/%3E%3Cpolygon fill='%23222' points='1080 300 990 450 1170 450'/%3E%3Cpolygon fill='%23FFF' points='1080 300 1170 150 990 150'/%3E%3Cpolygon points='1080 600 990 750 1170 750'/%3E%3Cpolygon fill='%23666' points='1080 600 1170 450 990 450'/%3E%3Cpolygon fill='%23DDD' points='1080 900 1170 750 990 750'/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect x='0' y='0' fill='url(%23a)' width='100%25' height='100%25'/%3E%3Crect x='0' y='0' fill='url(%23b)' width='100%25' height='100%25'/%3E%3C/svg%3E");
// background-attachment: fixed;
// background-size: cover;                
                } else if (viz.config.base_obj === "svg") {
                    if (viz.config.style === "s1") {

                        // From https://loading.io/spinner/dash-ring/
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(71.019 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;90 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
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
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 51;360 50 51" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" begin="0s" repeatCount="indefinite"></animateTransform>'+
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
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" begin="0s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g class="st2" transform="rotate(180.519 53.064 52)">'+
                        '<path d="M57,75.3l-0.5-3c9.9-1.7,17.2-10.2,17.2-20.3c0-11.4-9.2-20.6-20.6-20.6S32.5,40.6,32.5,52 c0,1.6,0.2,3.2,0.5,4.7l-3,0.7c-0.4-1.8-0.6-3.6-0.6-5.4c0-13.1,10.6-23.7,23.7-23.7S76.7,38.9,76.7,52 C76.7,63.6,68.4,73.4,57,75.3z"  class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 53.064 52;360 53.064 52" keyTimes="0;1" class="number_display_viz-speed_05x" dur="5s" begin="0s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(0.0144043 53.064 52)">'+
                        '<path d="M90.5,45.4c-1.5-8.8-6.2-16.8-13-22.5l0,0c-3.4-2.9-7.3-5.1-11.4-6.6s-8.5-2.3-13-2.3v2.4v1.4v2.4 c3.7,0,7.4,0.6,10.9,1.9l0.8-2.3c0,0,0,0,0,0c3.7,1.4,7.2,3.4,10.3,5.9l1.2-1.5L75,25.8c0,0,0,0,0,0l-1.5,1.8 c5.7,4.8,9.6,11.5,10.9,18.8l3.8-0.7c0,0,0,0,0,0L90.5,45.4z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<path d="M29.7,22l4.7,6.1c3.5-2.8,7.5-4.6,11.9-5.6l-1.7-7.5C39.2,16.2,34.2,18.5,29.7,22z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" begin="0s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(180.519 53.064 52)">'+
                        '<path d="M53.1,92.4v-1c21.8,0,39.5-17.7,39.5-39.5c0-21.8-17.7-39.5-39.5-39.5c-15.8,0-30,9.4-36.2,23.8L15.9,36 c6.4-14.8,21-24.4,37.1-24.4c22.3,0,40.4,18.1,40.4,40.4C93.5,74.3,75.3,92.4,53.1,92.4z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 53.064 52;360 53.064 52" keyTimes="0;1" class="number_display_viz-speed_05x" dur="5s" begin="0s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '<g transform="rotate(180.007 53.064 52)">'+
                        '<path d="M39.7,28.5l0.6,1c3.9-2.2,8.3-3.4,12.8-3.4V25C48.4,25,43.7,26.2,39.7,28.5z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<path d="M28.6,60.6l-1.1,0.4C31.3,71.8,41.6,79,53.1,79v-1.2C42.1,77.9,32.3,70.9,28.6,60.6z" class="number_display_viz-fill_base" fill="#ffffff"></path>'+
                        '<animateTransform attributeName="transform" type="rotate" calcMode="linear" values="360 53.064 52;0 53.064 52" keyTimes="0;1" class="number_display_viz-speed_15x" dur="15s" begin="0s" repeatCount="indefinite"></animateTransform>'+
                        '</g>'+
                        '</svg>').appendTo(viz.$wrapc2);

                    } else if (viz.config.style === "s7") {

                        // From https://loading.io/spinner/dash-ring/
                        viz.$svg = $('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">'+
                        '<g transform="rotate(8.69245 50 50)">'+
                        '<animateTransform attributeName="transform" type="rotate" values="0 50 50;18 50 50" keyTimes="0;1" class="number_display_viz-speed_1x" dur="10s" repeatCount="indefinite"></animateTransform>'+
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

                    }
                }
            }

            if (viz.config.sparkorder === "fg") {
                viz.$wrapc1.css("z-index", 2);
            } else if (viz.config.sparkorder === "bg") {
                viz.$wrapc2.css("z-index", 2);
            } else if (viz.config.sparkorder === "hidden") {
                viz.$wrapc1.css("display", "none");
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
                                callbacks: {
                                    label: function(tooltipItem, data) {
                                        // Threshold band
                                        if (tooltipItem.datasetIndex === 0) {
                                            var thrs = [];
                                            var last_val = 0;
                                            for (var i = 0; i < data.datasets[0].data.length; i++) {
                                                last_val += data.datasets[0].data[i];
                                                thrs.push(last_val);
                                            }
                                            thrs.pop();
                                            return  "Thresholds: " + thrs.join(", ")

                                        } else if (tooltipItem.datasetIndex === 1 && tooltipItem['index'] === 0) {
                                            return data.datasets[1].data[0];
                                        }
                                        // return label;
                                        // var label = data['labels'][tooltipItem['index']] + ': ';
                                        // if (data.datasets[tooltipItem.datasetIndex].label) {
                                        //     label += data.datasets[tooltipItem.datasetIndex].label + ': ';
                                        // }
                                        // label += Math.round(parseFloat(data.datasets[tooltipItem.datasetIndex].data[tooltipItem['index']]) * 100) / 100;
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
                            display: false
                        },
                        tooltips: {
                            mode: 'index',
                            intersect: false,
                        },
                        hover: {
                            mode: 'nearest',
                            intersect: true
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
                                display: false
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
                viz.myArea = new Chart(viz.ctx1, viz.areaCfg);
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
                    }
                    viz.$svg.find(".number_display_viz-fill_base").attr("fill", value_color);
                    viz.$svg.find(".number_display_viz-stroke_base").attr("stroke", value_color);
                    viz.$svg.find(".number_display_viz-speed_1x").attr("dur", speed + "s");
                    viz.$svg.find(".number_display_viz-speed_05x").attr("dur", (speed * 0.5) + "s");
                    viz.$svg.find(".number_display_viz-speed_15x").attr("dur", (speed * 1.5) + "s");
                } else if (viz.config.base_obj === "box") {
                    viz.$wrapc2.css({"background-color": value_color});
                }
                
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

                // Animate number on change
                // Need to have a previous value and both old and new need to be numbers for animation to work
                // TODO need to kill any currently running animations
                
                var overlay_now = Number(value_display);
                var overlay_prev = viz.overlay_prev;
                viz.overlay_prev = overlay_now;
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
                viz.myArea.update();
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