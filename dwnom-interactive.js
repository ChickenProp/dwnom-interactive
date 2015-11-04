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

// Turn [ { key: k0, values: v0 }, ... ] into just [ v0, ... ]. But also add a
// .key property, with .key[k0] = v0.
function restructure_nest (nested) {
    nested.key = {};
    for (var i = 0; i < nested.length; i++) {
        var d = nested[i];
        nested.key[ d.key ] = d.values;
        nested[i] = d.values;
    }
}

var parties = {
    100: { name: 'Democrat' },
    200: { name: 'Republican' },
    default: { name: 'Other' }
};
function getParty(id) {
    return parties[id] || parties.default;
}

var set_party_class = {
    dem: function (d) { return (d[0]||d).party == 100; },
    rep: function (d) { return (d[0]||d).party == 200; },
    ind: function (d) { var p = (d[0]||d).party; return p != 100 && p != 200; }
};

function getTitle(d) {
    return sprintf('%s - %s - %.2f', d.name, getParty(d.party).name, d.dim1);
}

// Make some variables global to help with debugging.
var data;
var data_icpsr;
var data_year;
var data_year_long;
var notes;

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

            var R_aggs = aggs(R_dim1s);
            var D_aggs = aggs(D_dim1s);

            return { year: values[0].year,
                     R: aggs(R_dim1s),
                     D: aggs(D_dim1s),
                     I: { count: I_count },
                     all: { mean: d3.mean(values, rcps('dim1')),
                            count: values.length },
                     polarization: R_aggs.mean - D_aggs.mean,
                     icpsr_classes: _.pluck(values, 'icpsr_class') };
        })
        .entries(data);
    restructure_nest(data_year);

    data_year_long = _.flatten(data_year.map(function (d) {
        return [
            _.extend({}, d.R, { year: d.year, party: 'Republican' }),
            _.extend({}, d.D, { year: d.year, party: 'Democrat' }),
            _.extend({}, d.I, { year: d.year, party: 'Independent' }),
        ];
    }), true);

    data_icpsr = d3.nest()
        .key(rcps('icpsr'))
        .rollup(function (values) {
            var ret = { icpsr: values[0].icpsr,
                        ever_independent: false,
                        has_progress: values.length > 1,
                        progressions: [],
                        icpsr_class: values[0].icpsr_class };

            for (var i = 0; i < values.length; i++) {
                var party = values[i].party;
                if (party != 100 && party != 200)
                    ret.ever_independent = true;

                if (i)
                    ret.progressions.push([ values[i-1], values[i] ]);
            }

            ret.ever_independent_and_progress =
                ret.ever_independent && ret.has_progress;
            return ret;
        })
        .entries(data);
    restructure_nest(data_icpsr);

    data.map(function (d) {
        d.ever_independent = data_icpsr.key[d.icpsr].ever_independent;
    });
}

function congress_breaks(years_extent) {
    return _.range(years_extent[0], years_extent[1]+1, 2);
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

var infobox_fixed = false;
function fix_infobox () {
    infobox_fixed = true;
    d3.select('#infobox').classed('fixed', true);
}
function unfix_infobox () {
    infobox_fixed = false;
    d3.select('#infobox').classed('fixed', false);
}

function fill_infobox (d, force) {
    if (infobox_fixed && !force)
        return;

    d3.select('#infobox').style('display', 'block');

    d3.select('#infobox-year')
        .text(sprintf('%d - %d', +d.year - 1, +d.year + 1));
    d3.select('#num-democrats').text(d.D.count);
    d3.select('#num-republicans').text(d.R.count);
    d3.select('#num-independents').text(d.I.count);
    d3.select('#polarization').text(d.polarization.toFixed(2));

    d3.select('#infobox-notes').html(d.notes || '');
}

function render (data_) {
    data_ = data_.filter(function (d) { return d.year >= 1866; });
    restructure_data(data_); // defines global vars data, data_*

    var margin = { left: 75, right: 30, top: 50, bottom: 30 };
    var width = 1200 - margin.left - margin.right;
    var height = 1200 - margin.top - margin.bottom;

    var svg = d3.select('#main-graph-ctnr')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g') // transform on svg doesn't work in chrome?
        .attr('transform', sprintf('translate(%d, %d)',
                                   margin.left, margin.top));

    var scale_x = d3.scale.margin()
        .range([0, width])
        .margin([5, 0])
        .domain(d3.extent(data, rcps('dim1')));
    var year_extent = d3.extent(data, rcps('year'));
    var scale_y = d3.scale.linear()
        .range([height, 0])
        .domain([year_extent[0]-1, year_extent[1]+1]);

    var axes = svg.append('g').attr('class', 'axes');
    add_axes(axes, scale_x, scale_y);

    var main_graph = svg.append('g').attr('id', 'main-graph');
    main_graph.append('g').attr('id', 'background');
    main_graph.append('g').attr('id', 'year-highlights');
    main_graph.append('g').attr('id', 'progressions');
    main_graph.append('g').attr('id', 'points');
    main_graph.append('g').attr('id', 'aggregates');
    main_graph.append('g').attr('id', 'notes-markers');

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
            return [ d.year, d.D.p25, d.D.p75 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'blue')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.year, d.D.p05, d.D.p95 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'red')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.year, d.R.p25, d.R.p75 ];
        })));

    main_graph.select('#background').append('path')
        .attr('fill', 'red')
        .attr('fill-opacity', 0.3)
        .attr('d', area(data_year.map(function (d) {
            return [ d.year, d.R.p05, d.R.p95 ];
        })));

    main_graph.select('#progressions').selectAll('g.progression')
        .data(data_icpsr.filter(rcps('ever_independent_and_progress')))
      .enter()
        .append('g')
        .attr('class', rcps('icpsr_class'))
        .classed('progression', true)
        .each(function (d) {
            d3.select(this)
                .selectAll('path')
                .data(d.progressions)
              .enter()
               .append('path')
                .classed(set_party_class)
                .attr('d', line);
        });

    main_graph.select('#points').selectAll('circle')
        .data(data.filter(rcps('ever_independent')))
      .enter()
       .append('circle')
        .attr('class', rcps('icpsr_class'))
        .classed(set_party_class)
        .attr({ cx: rcps('dim1', scale_x),
                cy: rcps('year_jitter', scale_y),
                r: 2 })
       .append('title').text(getTitle);

    main_graph.select('#year-highlights').selectAll('rect')
        .data(data_year)
      .enter()
       .append('rect')
        .attr({ x: 0, y: function (d) { return scale_y(d.year + 1); },
                width: width, height: scale_y(0) - scale_y(2),
                'fill-opacity': 0.5, fill: 'none' })
        .on('mouseover', function (d) {
            highlight_year(d.year);
            fill_infobox(d);
        })
        .on('mouseout', function () {
            highlight_year(false);
        })
        .on('click', function (d) {
            fill_infobox(d, true);
            fix_infobox();
        });

    function draw_aggregate(party) {
        var g = main_graph.select('#aggregates').append('g');
        g.append('path')
            .attr('d', line(data_year.map(function (d) {
                return {'dim1': d[party].mean, 'year_jitter': d.year};
            })))
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);
    }

    draw_aggregate('all');
    draw_aggregate('D');
    draw_aggregate('R');

    d3.select('#show-polarization')
        .on('click', secondary_click_handler(render_polarization, data_year));
    d3.select('#show-count-ind')
        .on('click', secondary_click_handler(render_counts,
                                             data_year_long, 'IDR'));
    d3.select('#show-count-rep')
        .on('click', secondary_click_handler(render_counts,
                                             data_year_long, 'RDI'));
    d3.select('#show-count-dem')
        .on('click', secondary_click_handler(render_counts,
                                             data_year_long, 'DRI'));

    d3.select('html').on('click', function () {
        var ctnr = d3.select('#secondary-graph-ctnr').node();
        if (!ctnr.contains(d3.event.target))
            hide_secondary();
    });
    d3.select('#infobox-unfix').on('click', function () {
        unfix_infobox();
        d3.event.preventDefault();
    });

    d3.json('notes.json', function(error, notes) {
        render_notes(notes, data_year, scale_y);
    });
}

function render_notes(notes_, data, scale_y) {
    notes = notes_;

    notes.map(function (note) {
        data.key[ note.year ].notes = note.text;
    });

    d3.select('#notes-markers').selectAll('circle')
        .data(notes)
      .enter()
       .append('circle')
        .attr({ cx: 5, cy: rcps('year', scale_y), r: 3});
}

function secondary_click_handler(func, data, arg) {
    return function () {
        show_secondary();
        d3.select('#secondary-graph-ctnr').html('');
        func(data, arg);
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }
}

function render_counts (data, order) {
    var svg = d3.select('#secondary-graph-ctnr')
        .classed({counts: true, polarization: false});

    var margin = { left: 50, right: 30, top: 30, bottom: 60 };
    var width = 800 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;

    var chart = new dimple.chart(svg, data);
    chart.setBounds(margin.left, margin.top, width, height);

    var x = chart.addCategoryAxis('x', 'year');
    var y = chart.addMeasureAxis('y', 'count');
    var s = chart.addSeries('party', dimple.plot.area);

    x.title = 'Year';
    y.title = 'Number of members';
    s.interpolation = 'step';

    chart.assignClass('Democrat', 'dem');
    chart.assignClass('Republican', 'rep');
    chart.assignClass('Independent', 'ind');

    if (order) {
        var o = [null, null, null];
        o[ order.indexOf('I') ] = 'Independent';
        o[ order.indexOf('D') ] = 'Democrat';
        o[ order.indexOf('R') ] = 'Republican';
        s.addOrderRule(o);
    }

    chart.draw();

    // Hacky: when there are no independents, the independent marker completely
    // covers the one below it, so remove all those markers. Don't bother if the
    // independents are at the bottom anyway.

    if (order && order[0] == 'I')
        return;

    d3.selectAll('circle.dimple-marker').each(function (d) {
        if (d.yValue == 0)
            d3.select(this).remove();
    });
}

function render_polarization (data) {
    var svg = d3.select('#secondary-graph-ctnr')
        .classed({counts: false, polarization: true});

    var margin = { left: 50, right: 30, top: 30, bottom: 60 };
    var width = 800 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;

    var chart = new dimple.chart(svg, data);
    chart.setBounds(margin.left, margin.top, width, height);
    var x = chart.addCategoryAxis('x', 'year');
    var y = chart.addMeasureAxis('y', 'polarization');
    chart.addSeries(null, dimple.plot.line);

    x.title = 'Year';
    y.title = 'Polarization';

    chart.draw();
}

function show_secondary () {
    d3.select('#secondary-graph-ctnr').style('display', 'block');
}
function hide_secondary () {
    d3.select('#secondary-graph-ctnr').style('display', 'none');
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
