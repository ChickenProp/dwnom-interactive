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

var parties = {
    100: { name: 'Democrat', color: '#0000FF' },
    200: { name: 'Republican', color: '#FF0000' },
    default: { name: 'Other', color: '#00FF00' }
};
function getParty(id) {
    return parties[id] || parties.default;
}

function getTitle(d) {
    return d.name + ' - ' + getParty(d.party).name + ' - ' + d.dim1;
}

var data;
function render (data_) {
    data = data_; // Putting it in a global variable helps with debugging.

    var margin = 75;
    var width = 1200 - 2*margin;
    var height = 1200 - 2*margin;

    var svg = d3.select('svg')
        .attr('width', width + 2*margin)
        .attr('height', height + 2*margin)
      .append('g') // transform on svg doesn't work in chrome?
        .attr('transform', 'translate(' + margin + ',' + margin + ')');

    var main_graph = svg.append('g');

    var scale_x = d3.scale.margin()
        .range([0, width])
        .margin([5, 0])
        .domain(d3.extent(data, rcps('dim1')));
    var scale_y = d3.scale.margin()
        .range([0, height])
        .margin([5, 0])
        .domain(d3.extent(data, rcps('year')));

    var axis_x = d3.svg.axis()
        .scale(scale_x)
        .orient('top');
    svg.append('g').attr('class', 'axis').call(axis_x);

    var axis_y = d3.svg.axis()
        .scale(scale_y)
        .orient('left')
        .tickFormat(d3.format(''));
    svg.append('g').attr('class', 'axis').call(axis_y);

    main_graph.selectAll('circle')
        .data(data)
      .enter()
        .append('circle')
        .attr('cx', rcps('dim1', scale_x))
        .attr('cy', rcps('year', scale_y))
        .attr('r', 1)
        .attr('fill', rcps('party', getParty, 'color'))
        .attr('title', getTitle);

}

function transform (row) {
    row.dim1 = +row.dim1;
    return row;
}

d3.tsv('house.tsv', transform, render);
