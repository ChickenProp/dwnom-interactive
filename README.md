### Summary

This is a visualization of political polarization in the US House of Representatives, as calculated by [DW-NOMINATE](https://en.wikipedia.org/wiki/NOMINATE_\(scaling_method\)). DW-NOMINATE allows one to calculate the political leaning of a member simply by comparing their voting record to others', ignoring their party affiliation and even the content of the bills they vote on.

### Design

My initial idea was to draw the career progression of every House member as a distinct path, color coded according to their party affiliation in any given congress. The user would also be able to select members to view detailed statistics about them. But when I implemented that, I discovered it was far too noisy. Trends were difficult to make out, few individual members were discernible, and the elements used to represent them were so small that they were almost impossible to select. Feedback #1 confirmed that this was a problem.

I added aggregated statistics, to make the trends visible, but there was still too much noise. I briefly removed all members whose careers fell completely within the 5-95 percentile range of their parties. That helped a bit, but not enough, and it looked strange. Then I removed all members who had never served as an independent, which helped a lot. I was able to increase the size of the nodes, making them easier to see and easier to select.

Meanwhile, I also decided it would be useful to be able to see statistics about each individual congress. And once those statistics were available, I also wanted them to be available as distinct graphs, since they couldn't easily be seen on the main ones. So I added some secondary graphs that could be displayed hovering over the main graph.

In response to feedback #3, I flipped the vertical orientation of the graph, agreeing that people were more likely to be interested in recent congresses than historical ones. I also added some annotations noting significant periods and events.

### Feedback

1. The green of the independents is a bit hard to see against the grey background. It’s also hard to intentionally get the right cursor position to trigger the illumination of individual representatives.

2. [What do you learn from this graph?] That there were a lot of independents back in ye olden days. That some independents moved a long way. That the Democrats lost a lot of members.

3. [Same person as 2] That light green is kinda hard to see. My guess is that people are more interested in the present so I'd flip it. You could link to sources on the results - so people could look up why there was a huge jump. Or you could annotate noticeable jumps / longstanding independents.

4. The independent representation is definitely the visual weak spot of this graph. I'm not getting enough easy information.

### Resources

The DW-NOMINATE data set itself is from <http://voteview.com/dwnomin.htm>.

I drew much inspiration from an XKCD poster: <http://xkcd.com/1127/large/>.

Many wikipedia pages were useful for research, and are linked from the visualization itself.

The .min.js files are all libraries available on <http://cdnjs.com>.
