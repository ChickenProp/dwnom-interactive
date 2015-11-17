function add_legend(parent) {
    // All rects in the legend are the same, except for their x position and
    // their class. Use this to generate their attributes.
    function rect_attrs(x, cls) {
        return { x: x, y: 0, width: 15, height: 15, class: cls };
    }

    // Add 5-95 percentile legend.
    var percentiles_0595 = parent.append('g');
    percentiles_0595.append('rect').attr(rect_attrs(0, 'dem'));
    percentiles_0595.append('rect').attr(rect_attrs(20, 'rep'));
    percentiles_0595.append('text')
        .text('5-95 percentile')
        .attr({ x: 40, y: 9 });

    // Add 25-75 percentile legend. Just draw two of the 5-95 ones overlaid,
    // because that's what it is on the graph itself.
    var percentiles_2575 = parent.append('g')
        .attr('transform', 'translate(0, 20)');
    percentiles_2575.append('rect').attr(rect_attrs(0, 'dem'));
    percentiles_2575.append('rect').attr(rect_attrs(0, 'dem'));
    percentiles_2575.append('rect').attr(rect_attrs(20, 'rep'));
    percentiles_2575.append('rect').attr(rect_attrs(20, 'rep'));
    percentiles_2575.append('text')
        .text('25-75 percentile')
        .attr({ x: 40, y: 9 });

    // Add party/house means legend.
    var means = parent.append('g')
        .attr('transform', 'translate(0, 40)');
    means.append('line')
        .attr({ x1: 5, x2: 15, y1: 0, y2: 15,
                stroke: 'black', 'stroke-width': 2 });
    means.append('text')
        .text('Party/House mean')
        .attr({ x: 25, y: 9 });
}
