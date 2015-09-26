// Wrapper aronud d3.scale.linear, allowing internal margins to be added. Only
// allows simple linear scales (not polylinear).

// This doesn't really make sense as a specific type of scale, but there's no
// way to add .margin() to existing scales without completely reimplementing
// them.

d3.scale.margin = function () {
    var range, domain, margin = [0, 0];
    var linear;

    function rescale () {
        linear = d3.scale.linear();

        if (domain)
            linear = linear.domain(domain);
        if (range)
            linear = linear.range([range[0] + margin[0],
                                   range[1] - margin[1]]);

        scale.ticks = linear.ticks;
        scale.tickFormat = linear.tickFormat;

        return scale;
    }

    function scale (x) {
        return linear(x);
    }

    scale.domain = function (x) {
        if (!arguments.length)
            return domain;
        domain = x;
        return rescale();
    }

    scale.range = function (x) {
        if (!arguments.length)
            return range;
        range = x;
        return rescale();
    }

    scale.margin = function (x) {
        if (!arguments.length)
            return margin;
        margin = x.map(Number);
        return rescale();
    }

    scale.copy = function () {
        var copy = d3.scale.margin().margin(margin);

        if (domain)
            copy = copy.domain(domain);
        if (range)
            copy = copy.range(range);

        return copy;
    }

    return rescale();
}

