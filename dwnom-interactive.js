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
    var main_graph = svg.append('g').attr('id', 'main-graph');

    main_graph.append('g').attr('id', 'background');
    main_graph.append('g').attr('id', 'progressions');
    main_graph.append('g').attr('id', 'points');
    main_graph.append('g').attr('id', 'aggregates');

    add_axes(axes, scale_x, scale_y);

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

            return { R: d3.mean(R_dim1s),
                     D: d3.mean(D_dim1s),
                     Dmin: d3.quantile(D_dim1s, 0.05),
                     Dmin2: d3.quantile(D_dim1s, 0.25),
                     Dmax: d3.quantile(D_dim1s, 0.95),
                     Dmax2: d3.quantile(D_dim1s, 0.75),
                     Rmin: d3.quantile(R_dim1s, 0.05),
                     Rmin2: d3.quantile(R_dim1s, 0.25),
                     Rmax: d3.quantile(R_dim1s, 0.95),
                     Rmax2: d3.quantile(R_dim1s, 0.75),
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
            return [ d.key, d.values.Dmin, d.values.Dmax ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'blue')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.Dmin2, d.values.Dmax2 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'red')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.Rmin, d.values.Rmax ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'red')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.key, d.values.Rmin2, d.values.Rmax2 ];
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
        .attr('title', getTitle);

    function draw_aggregate(key, color) {
        var g = main_graph.select('#aggregates').append('g');
        g.append('path')
            .attr('d', line(data_year.map(function (d) {
                return {'dim1': d.values[key], 'year_jitter': d.key};
            })))
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);
        g.append('path')
            .attr('d', line(data_year.map(function (d) {
                return {'dim1': d.values[key], 'year_jitter': d.key};
            })))
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1);
    }

    draw_aggregate('overall', 'black');
    draw_aggregate('D', 'blue');
    draw_aggregate('R', 'red');
}

function highlight_year(year) {
    d3.selectAll('.highlight').classed('highlight', false);

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
