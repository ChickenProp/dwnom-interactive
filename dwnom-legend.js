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
