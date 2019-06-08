# number_display_viz



This visualization can deal with most datasets you want to throw at it. However for most reliable results, use a search like this:

`|stats sparkline(avg(SOME_VALUE)) as Sparkline latest(SOME_VALUE) as Number by SPLIT_CATEGORY`

If you want only one viz, then the SPLIT_CATEGORY is optional.  Additionally if you have extra fields with specific names you can override the cconfigured properties.

Here is an example where the subtitle is supplied in the data:

`|stats sparkline(avg(SOME_VALUE)) as Sparkline latest(SOME_VALUE) as Number latest(SOME_VALUE2) as subtext by SPLIT_CATEGORY`

another way of doing the same thing is like so: 

`|stats sparkline(avg(SOME_VALUE)) as Sparkline latest(SOME_VALUE) as Number by SPLIT_CATEGORY | eval subtext = "something"`

These are the fields that can be overridden in data:

|Field|Type|Description|
| --- | --- | --- |
|`color`|HTML color code|Set the base color, overriding the thresholds. By using this field you can have whatever complicated threshold logic you like|
|`primarycolor`|HTML color code|Similar to above but will only overide the primary color. The threshold color can be used seperately. The primary color is only used by the main element in the viz. |
|`secondarycolor`|HTML color code|As above.|
|`text`|String|If supplied, this field enables overriding what would be shown as the numeric value|
|`subtitle`|String|Override the subtitle value. Note that subtitle must be blank in the formatting options|
|`min`|Number|Overrides the "min" limit|
|`max`|Number|Overrides the "max" limit|


See below for more examples of searches that add text, icons and clock overlays to the visualization.

![screenshot](https://raw.githubusercontent.com/ChrisYounger/day_night_map_viz/master/static/example1.png)


## Icons
The title, `text`, or `subtitle` fields allow for HTML injection. This allows icons to be used in place of text or numbers. 
Any icon from the FontAwesome v5 Free icon sets can be used, the complete list is here: https://fontawesome.com/cheatsheet/
There are also some Splunk built-in icons that can be used. See the list at the following page of your Splunk environment: `/en-GB/static/docs/style/style-guide.html#icons`
Here is an example showing an icon being displayed:

`|stats sparkline(avg(SOME_VALUE)) as Sparkline latest(SOME_VALUE) as Number by SPLIT_CATEGORY | eval text="<i class="fas fa-check"></i>"`




## Third party software

The following third-party libraries are used by this app. Thank you!

* jQuery - MIT - https://jquery.com/
* Chart.js - MIT - https://www.chartjs.org/
* Font Awesome - Creative Commons Attribution-ShareAlike 4.0 License - https://fontawesome.com/
* Tiyncolor - MIT - https://github.com/bgrins/TinyColor
* Fan SVGs are by mynamepong - Creative Commons BY 3.0 - https://www.flaticon.com/authors/mynamepong
* SVG textures are by svgbackgrounds.com - Creative Commons Attribution-ShareAlike 4.0 License - https://www.svgbackgrounds.com
* Four spinners from https://loading.io/
