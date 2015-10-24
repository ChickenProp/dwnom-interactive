// right-compose: rcps(a, b, c)(o) == c(b(a(o))). This applies the functions in
// the order written. Additionally, any argument to rcps may be a number or a
// string, in which case it's used as an index. Example:
//     rcps('date', _.isDate)(o) == _.isDate(o['date'])
function rcps () {
    var args = arguments;
    var len = args.length;
    return function (o) {
        for (var i = 0; i < len; i++) {
            var arg = args[i];
            if (typeof arg === 'function')
                o = arg.call(this, o);
            else
                o = o[arg];
        }
        return o;
    }
}

function add_nest_key (nested) {
    nested.key = {};
    for (var i = 0; i < nested.length; i++) {
        var d = nested[i];
        nested.key[ d.key ] = d.values;
    }
}

var parties = {
    100: { name: 'Democrat', pColor: '#0000FF', lColor: '#8080FF' },
    200: { name: 'Republican', pColor: '#FF0000', lColor: '#FF8080' },
    default: { name: 'Other', pColor: '#00FF00', lColor: '#80FF80' }
};
function getParty(id) {
    return parties[id] || parties.default;
}

function getTitle(d) {
    return d.name + ' - ' + getParty(d.party).name + ' - ' + d.dim1;
}

// Make some variables global to help with debugging.
var data;
var data_progressions;
var data_year;

function congress_breaks(years_extent) {
    return _.range(years_extent[0]-1, years_extent[1]+2, 2);
}

function add_axes (parent, scale_x, scale_y) {
    var axis_x = d3.svg.axis()
        .scale(scale_x)
        .orient('top');

    var axis_y = d3.svg.axis()
        .scale(scale_y)
        .orient('left')
        .tickFormat(d3.format(''));

    var axis_y2 = d3.svg.axis()
        .scale(scale_y)
        .orient('left')
        .innerTickSize(-scale_x.range()[1])
        .tickValues(congress_breaks(scale_y.domain()))
        .tickFormat(function () { return ''; });

    parent.append('g').attr('class', 'axis-inner').call(axis_y2);
    parent.append('g').attr('class', 'axis').call(axis_y);
    parent.append('g').attr('class', 'axis').call(axis_x);
}

function add_legend(parent) {
    var rect = parent.append('rect')
        .attr({ x: -150, y: 0, width: 150, height: 180,
                fill: '#eee', stroke: 'white' });

    parent.append('rect')
        .attr({ x: -140, y: 10, width: 20, height: 20,
                fill: '#00f', 'fill-opacity': 0.3 });
    parent.append('rect')
        .attr({ x: -115, y: 10, width: 20, height: 20,
                fill: '#f00', 'fill-opacity': 0.3 });
    parent.append('text')
        .text('5-95 percentile')
        .attr({ x: -90, y: 20, 'dominant-baseline': 'middle',
              'font-size': 13 });

    parent.append('rect')
        .attr({ x: -140, y: 35, width: 20, height: 20,
                fill: '#00f', 'fill-opacity': 0.3 });
    parent.append('rect')
        .attr({ x: -115, y: 35, width: 20, height: 20,
                fill: '#f00', 'fill-opacity': 0.3 });
    parent.append('rect')
        .attr({ x: -140, y: 35, width: 20, height: 20,
                fill: '#00f', 'fill-opacity': 0.3 });
    parent.append('rect')
        .attr({ x: -115, y: 35, width: 20, height: 20,
                fill: '#f00', 'fill-opacity': 0.3 });
    parent.append('text')
        .text('25-75 percentile')
        .attr({ x: -90, y: 45, 'dominant-baseline': 'middle',
              'font-size': 13 });

    parent.append('line')
        .attr({ x1: -135, x2: -125, y1: 60, y2: 80,
                stroke: 'black', 'stroke-width': 2 });
    parent.append('text')
        .text('Party/House mean')
        .attr({ x: -110, y: 70, 'dominant-baseline': 'middle',
              'font-size': 13 });

    parent.append('line')
        .attr({ x1: -135, x2: -125, y1: 90, y2: 110, stroke: '#8080ff' });
    parent.append('circle')
        .attr({ cx: -135, cy: 90, r: 1, fill: '#00f' });
    parent.append('circle')
        .attr({ cx: -125, cy: 110, r: 1, fill: '#00f' });
    parent.append('text')
        .text('Democrat')
        .attr({ x: -110, y: 100, 'dominant-baseline': 'middle',
              'font-size': 13 });

    parent.append('line')
        .attr({ x1: -135, x2: -125, y1: 120, y2: 140, stroke: '#ff8080' });
    parent.append('circle')
        .attr({ cx: -135, cy: 120, r: 1, fill: '#f00' });
    parent.append('circle')
        .attr({ cx: -125, cy: 140, r: 1, fill: '#f00' });
    parent.append('text')
        .text('Republican')
        .attr({ x: -110, y: 130, 'dominant-baseline': 'middle',
              'font-size': 13 });

    parent.append('line')
        .attr({ x1: -135, x2: -125, y1: 150, y2: 170, stroke: '#80ff80' });
    parent.append('circle')
        .attr({ cx: -135, cy: 150, r: 1, fill: '#0f0' });
    parent.append('circle')
        .attr({ cx: -125, cy: 170, r: 1, fill: '#0f0' });
    parent.append('text')
        .text('Independent')
        .attr({ x: -110, y: 160, 'dominant-baseline': 'middle',
              'font-size': 13 });
}

function render (data_) {
    data = data_.filter(function (d) { return d.year >= 1866; });

    var margin = { left: 75, right: 30, top: 50, bottom: 30 };
    var width = 1200 - margin.left - margin.right;
    var height = 1200 - margin.top - margin.bottom;

    var svg = d3.select('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g') // transform on svg doesn't work in chrome?
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var scale_x = d3.scale.margin()
        .range([0, width])
        .margin([5, 0])
        .domain(d3.extent(data, rcps('dim1')));
    var scale_y = d3.scale.margin()
        .range([0, height])
        .margin([5, 0])
        .domain(d3.extent(data, rcps('year')));

    var axes = svg.append('g').attr('id', 'axes');
    add_axes(axes, scale_x, scale_y);

    var main_graph = svg.append('g').attr('id', 'main-graph');
    main_graph.append('g').attr('id', 'background');
    main_graph.append('g').attr('id', 'progressions');
    main_graph.append('g').attr('id', 'points');
    main_graph.append('g').attr('id', 'aggregates');
    main_graph.append('g').attr('id', 'year-highlights');

    var legend = svg.append('g')
        .attr('id', 'legend')
        .attr('transform', 'translate(' + (width-10) + ', 10)');
    add_legend(legend);

    data_progressions = d3.nest()
        .key(rcps('icpsr'))
        .rollup(function (values) {
            var ret = [];
            for (var i = 0; i < values.length - 1; i++) {
                ret.push([ values[i], values[i+1] ]);
            }
            return ret;
        })
        .entries(data)
        .filter(function (kv) { return kv.values.length != 0; });

    data_year = d3.nest()
        .key(rcps('year'))
        .rollup(function (values) {
            function dim1s(name) {
                return values.filter(function (v) {
                    return getParty(v.party).name == name;
                }).map(rcps('dim1')).sort(function (a, b) { return a-b; });
            }
            var D_dim1s = dim1s('Democrat');
            var R_dim1s = dim1s('Republican');

            function aggs(vals) {
                return { mean: d3.mean(vals),
                         p05: d3.quantile(vals, 0.05),
                         p25: d3.quantile(vals, 0.25),
                         p75: d3.quantile(vals, 0.75),
                         p95: d3.quantile(vals, 0.95) };
            }

            return { R: aggs(R_dim1s),
                     D: aggs(D_dim1s),
                     overall: d3.mean(values, rcps('dim1')),
                     icpsr_classes: _.pluck(values, 'icpsr_class') };
        })
        .entries(data);
    add_nest_key(data_year);

    var line = d3.svg.line()
        .x(rcps('dim1', scale_x))
        .y(rcps('year_jitter', scale_y))
        .defined(function (d) { return d.dim1 !== undefined; });

    var area = d3.svg.area()
        .y(rcps(0, scale_y))
        .x0(rcps(1, scale_x))
        .x1(rcps(2, scale_x))
        .defined(function (d) { return !isNaN(+d[0] + d[1] + d[2]); });

    main_graph.select('#background').append('path')
        .attr('fill', 'blue')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.D.p25, d.values.D.p75 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'blue')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.D.p05, d.values.D.p95 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'red')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.R.p25, d.values.R.p75 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'red')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.R.p05, d.values.R.p95 ];
        })));

    main_graph.select('#progressions').selectAll('g.progression')
        .data(data_progressions)
      .enter()
        .append('g')
        .attr('class', function (d) {
            return 'progression ' + d.values[0][0].icpsr_class;
        })
        .each(function (d) {
            d3.select(this)
                .selectAll('path')
                .data(d.values)
              .enter()
               .append('path')
                .attr('d', line)
                .attr('stroke', rcps(0, 'party', getParty, 'lColor'));
        });

    main_graph.select('#points').selectAll('circle')
        .data(data)
      .enter()
       .append('circle')
        .attr('class', rcps('icpsr_class'))
        .attr('cx', rcps('dim1', scale_x))
        .attr('cy', rcps('year_jitter', scale_y))
        .attr('r', 1)
        .attr('fill', rcps('party', getParty, 'pColor'))
        .append('title').text(getTitle);

    main_graph.select('#year-highlights').selectAll('rect')
        .data(data_year)
      .enter()
       .append('rect')
        .attr({ x: 0, y: function (d) { return scale_y(d.key - 1); },
                width: 10, height: scale_y(2) - scale_y(0),
                'fill-opacity': 0.5, fill: 'white' })
        .on('mouseover', function (d) {
            d3.select(this).attr('width', width);
            // Might get better results by doing this in setInterval.
            highlight_year(d.key);
        })
        .on('mouseout', function () {
            d3.select(this).attr('width', 10);
            highlight_year(false);
        })
       .append('title')
        .text(function (d) {
            return 'Polarization: ' + (d.values.R.mean - d.values.D.mean);
        });

    function draw_aggregate(fun, color) {
        var g = main_graph.select('#aggregates').append('g');
        g.append('path')
            .attr('d', line(data_year.map(function (d) {
                return {'dim1': fun(d.values), 'year_jitter': d.key};
            })))
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);
    }

    draw_aggregate(rcps('overall'), 'black');
    draw_aggregate(rcps('D', 'mean'), 'blue');
    draw_aggregate(rcps('R', 'mean'), 'red');
}

function highlight_year(year) {
    d3.selectAll('.highlight').classed('highlight', false);

    if (!year)
        return;

    var classes = data_year.key[year].icpsr_classes;
    classes.map(function (c) {
        d3.selectAll('.' + c).classed('highlight', true);
    });
}

function transform (row) {
    row.dim1 = +row.dim1;
    row.year = +row.year;

    row.icpsr_class = 'icpsr-' + row.icpsr;
    // Add some vertical jitter to reduce overplotting.
    row.year_jitter = row.year + Math.random() - 0.5;

    return row;
}

d3.tsv('house.tsv', transform, render);
