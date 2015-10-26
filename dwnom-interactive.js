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
    100: { name: 'Democrat', pColor: '#0000FF', lColor: '#9090FF' },
    200: { name: 'Republican', pColor: '#FF0000', lColor: '#FF9090' },
    default: { name: 'Other', pColor: '#00CC00', lColor: '#80FF80' }
};
function getParty(id) {
    return parties[id] || parties.default;
}

function getTitle(d) {
    return sprintf('%s - %s - %.2f', d.name, getParty(d.party).name, d.dim1);
}

// Make some variables global to help with debugging.
var data;
var data_icpsr;
var data_year;

function restructure_data(data_) {
    data = data_;

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
            var I_count = values.length - D_dim1s.length - R_dim1s.length;

            function aggs(vals) {
                return { mean: d3.mean(vals),
                         count: vals.length,
                         p05: d3.quantile(vals, 0.05),
                         p25: d3.quantile(vals, 0.25),
                         p75: d3.quantile(vals, 0.75),
                         p95: d3.quantile(vals, 0.95) };
            }

            return { R: aggs(R_dim1s),
                     D: aggs(D_dim1s),
                     I: { count: I_count },
                     overall: d3.mean(values, rcps('dim1')),
                     icpsr_classes: _.pluck(values, 'icpsr_class') };
        })
        .entries(data);
    add_nest_key(data_year);

    data_icpsr = d3.nest()
        .key(rcps('icpsr'))
        .rollup(function (values) {
            var ret = { outlier: false,
                        has_progress: values.length > 1,
                        progressions: [],
                        icpsr_class: values[0].icpsr_class };

            for (var i = 0; i < values.length; i++) {
                var val = values[i];
                var aggs = data_year.key[val.year];
                if (val.party == 100) {
                    // if (val.dim1 < aggs.D.p05 || val.dim1 > aggs.D.p95)
                    //     ret.outlier = true;
                }
                else if (val.party == 200) {
                    // if (val.dim1 < aggs.R.p05 || val.dim1 > aggs.R.p95)
                    //     ret.outlier = true;
                }
                else
                    ret.outlier = true;

                if (i)
                    ret.progressions.push([ values[i-1], values[i] ]);
            }

            ret.outlier_and_progress = ret.outlier && ret.has_progress;
            return ret;
        })
        .entries(data);
    add_nest_key(data_icpsr);

    data.map(function (d) {
        d.outlier = data_icpsr.key[d.icpsr].outlier;
    });
}

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
    data_ = data_.filter(function (d) { return d.year >= 1866; });
    restructure_data(data_); // defines global vars data, data_*

    var margin = { left: 75, right: 30, top: 50, bottom: 30 };
    var width = 1200 - margin.left - margin.right;
    var height = 1200 - margin.top - margin.bottom;

    var svg = d3.select('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g') // transform on svg doesn't work in chrome?
        .attr('transform', sprintf('translate(%d, %d)',
                                   margin.left, margin.top));

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
        .data(data_icpsr.filter(rcps('values', 'outlier_and_progress')))
      .enter()
        .append('g')
        .attr('class', function (d) {
            return 'progression ' + d.values.icpsr_class;
        })
        .each(function (d) {
            d3.select(this)
                .selectAll('path')
                .data(d.values.progressions)
              .enter()
               .append('path')
                .attr('d', line)
                .attr('stroke', rcps(0, 'party', getParty, 'lColor'))
                .attr('stroke-width', 2);
        });

    main_graph.select('#points').selectAll('circle')
        .data(data.filter(rcps('outlier')))
      .enter()
       .append('circle')
        .attr('class', rcps('icpsr_class'))
        .attr('cx', rcps('dim1', scale_x))
        .attr('cy', rcps('year_jitter', scale_y))
        .attr('r', 2)
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
            d3.select('#infobox-year').text(sprintf('%d - %d',
                                                    +d.key - 1, +d.key + 1));
            d3.select('#num-democrats').text(d.values.D.count);
            d3.select('#num-republicans').text(d.values.R.count);
            d3.select('#num-independents').text(d.values.I.count);
            d3.select('#polarization').text((d.values.R.mean - d.values.D.mean).toFixed(2));
        })
        .on('mouseout', function () {
            d3.select(this).attr('width', 10);
            highlight_year(false);
        })
       .append('title')
        .text(function (d) {
            var vals = d.values;
            return sprintf('Counts: %d D, %d R, %d I; Polarization: %.2f',
                           vals.D.count, vals.R.count, vals.I.count,
                           vals.R.mean - vals.D.mean);
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
