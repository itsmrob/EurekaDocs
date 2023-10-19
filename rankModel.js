function Model(field, module, stash) {
    var width = 350;
    var height = 350;
    var radius = 15;
    var margin = 35;
    var re = /\s*¡\s*/;

    var focused = ko.observable(0);

    var numColumns = ko.observable(
        parseInt(field.loadAttribute("numColumns")) || 2
    );
    field.setAttributeFunction("numColumns", numColumns, {
        serializer: function (attribute) {
            return attribute();
        },
    });

    var numRows = ko.observable(parseInt(field.loadAttribute("numRows")) || 2);
    field.setAttributeFunction("numRows", numRows, {
        serializer: function (attribute) {
            return attribute();
        },
    });

    var xAxis = ko.observable(field.loadAttribute("xAxis"));
    field.setAttributeFunction("xAxis", xAxis, {
        serializer: function (attribute) {
            return attribute();
        },
        localizable: true,
    });

    var yAxis = ko.observable(field.loadAttribute("yAxis"));
    field.setAttributeFunction("yAxis", yAxis, {
        serializer: function (attribute) {
            return attribute();
        },
        localizable: true,
    });

    var quadrantNames = ko.observable(
        field.loadAttribute("quadrantNames") || []
    );
    field.setAttributeFunction("quadrantNames", quadrantNames, {
        serializer: function (attribute) {
            return attribute();
        },
        localizable: true,
    });

    stash.loadedQuadrantNames = ko.observable(
        field.loadAttribute("quadrantNames") || []
    );

    var xLegends = ko.observable(field.loadAttribute("xLegends") || []);
    field.setAttributeFunction("xLegends", xLegends, {
        serializer: function (attribute) {
            return attribute();
        },
        localizable: true,
    });

    stash.loadedXLegends = ko.observable(field.loadAttribute("xLegends") || []);

    var yLegends = ko.observable(field.loadAttribute("yLegends") || []);
    field.setAttributeFunction("yLegends", yLegends, {
        serializer: function (attribute) {
            return attribute();
        },
        localizable: true,
    });

    stash.loadedYLegends = ko.observable(field.loadAttribute("yLegends") || []);

    var showAsReadonly = ko.observable(
        field.loadAttribute("showAsReadonly") === true
    );
    field.setAttributeFunction("showAsReadonly", showAsReadonly, {
        serializer: function (attribute) {
            return attribute();
        },
    });

    var addLabel = ko.observable(field.loadAttribute("addLabel") || "Add");
    field.setAttributeFunction("addLabel", addLabel, {
        serializer: function (attribute) {
            return attribute();
        },
        localizable: true,
    });

    var showValueFor = ko.observable("mine");
    field.setStashedAttributeFunction("showValueFor", showValueFor);

    var colWidth = parseInt(width / numColumns());
    var rowHeight = parseInt(height / numRows());

    var values = ko.observableArray([]);
    var allValues = ko.observable();

    stash.showResetButton = ko.observable(false);
    stash.initialValues = ko.observable();

    function newValue(value, focus, x, y, disabled, color, number) {
        var newValue = {
            v: ko.observable(value),
            f: ko.observable(focus),
            x: ko.observable(x),
            y: ko.observable(y),
            disabled: ko.observable(disabled),
            i: ko.observable(0),
            color: ko.observable(color),
            number: ko.observable(number),
        };
        newValue.v.subscribe(change);
        newValue.f.subscribe(elementFocus, newValue);
        return newValue;
    }

    if (field.loadValuesWithUsers()) {
        var newAllValues = {};

        field.loadValuesWithUsers().forEach(function (v) {
            v.value.forEach(function (value) {
                if (value.label) {
                    var cleaned = value.label.trim();
                    value.user_id = v.user_id;
                    value.user = module.getUsers()[v.user_id]
                        ? module.getUsers()[v.user_id].name
                        : "";
                    if (!(cleaned in newAllValues)) {
                        newAllValues[cleaned] = {
                            others: [],
                            mine: [],
                            all: [],
                        };
                    }

                    newAllValues[cleaned]["all"].push(value);
                    if (_usr_id == v.user_id) {
                        newAllValues[cleaned]["mine"].push(value);
                    } else {
                        newAllValues[cleaned]["others"].push(value);
                    }
                }
            });
        });

        allValues(newAllValues);
        Object.keys(allValues()).forEach(function (key) {
            if (allValues()[key]["mine"].length > 0) {
                var value = allValues()[key]["mine"][0];
                var dot = newValue(
                    value.label,
                    false,
                    value.x * width,
                    value.y * height,
                    showAsReadonly()
                );

                values.push(dot);
            } else {
                var value = allValues()[key]["others"][0];
                var dot = newValue(
                    value.label,
                    false,
                    radius,
                    height - radius,
                    showAsReadonly()
                );

                values.push(dot);
            }
        });
    }
    if (values().length == 0) {
        values.push(
            newValue("", false, radius, height - radius, showAsReadonly(), true)
        );
    }
    field.setStashedAttributeFunction("values", values);
    values.subscribe(change);

    function add(itemIndex) {
        values.splice(
            itemIndex() + 1,
            0,
            newValue("", true, radius, height - radius, showAsReadonly(), true)
        );
    }
    field.setStashedAttributeFunction("add", add);

    function change(updatedValue) {
        var serialized = [];
        values().forEach(function (e) {
            if (e.disabled()) return;

            s = {
                label: e.v() ? e.v().trim() : "",
                x: e.x() / width,
                y: e.y() / height,
            };
            serialized.push(s);
        });
        field.saveValue(serialized);

        if (values().length == 0) {
            values.push(
                newValue("", false, radius, height - radius, showAsReadonly())
            );
        }
        focused(0);
    }

    function elementFocus(updatedValue) {
        if (updatedValue && this.f()) {
            focused(this.i());
        } else {
            focused(0);
        }
    }

    function dotDragStarted(d) {
        if (d.disabled()) return;
        d3.select(this.parentElement.firstChild)
            .attr("stroke", "#00719E")
            .attr("fill", "#00719E");
    }

    function dotDragged(d) {
        var x = d3.event.x;
        var y = d3.event.y;

        if (d.disabled()) return;
        if (x < radius) x = radius;
        if (width - radius < x) x = width - radius;
        if (y < radius) y = radius;
        if (height - radius < y) y = height - radius;

        d3.select(this.parentElement.firstChild)
            .attr("x", x - radius)
            .attr("y", y - radius);
        d3.select(this.parentElement.lastChild).attr("x", x).attr("y", y);
    }

    function dotDragEnded(d) {
        var x = d3.event.x;
        var y = d3.event.y;

        if (d.disabled()) return;
        if (x < radius) x = radius;
        if (width - radius < x) x = width - radius;
        if (y < radius) y = radius;
        if (height - radius < y) y = height - radius;

        var previousX = (d.x() / width).toFixed(3);
        var previousY = (d.y() / height).toFixed(3);

        if (d.v() in allValues()) {
            var all = allValues()[d.v()].all;
            var found = all.filter(function (e) {
                return (
                    e.x.toFixed(3) == previousX && e.y.toFixed(3) == previousY
                );
            });
            if (found.length > 0) {
                found[0].x = x / width;
                found[0].y = y / height;
            }
        }

        // Don't want to trigger two updates, that's why x and y don't have
        // subscriptions to change() and we need to call it after the fact.
        d.x(x).y(y);

        change();
        values.valueHasMutated();

        d3.select(this.parentElement.firstChild)
            .attr("stroke", "#26B3EB")
            .attr("fill", "#26B3EB")
            .attr("stroke-width", 1);
    }

    var averages = function (label) {
        var pos = { x: 0, y: 0 };
        if (label && allValues() && allValues()[label]) {
            var all = allValues()[label].all;
            var length = 0;

            all.forEach(function (v) {
                if (v.x > 0.0428571428571429 && v.y < 0.957142857142857) {
                    pos["x"] += v.x;
                    pos["y"] += v.y;
                    length += 1;
                }
            });

            if (length > 0) {
                pos["x"] = (pos["x"] / length) * width;
                pos["y"] = (pos["y"] / length) * height;
            } else {
                pos["x"] = radius;
                pos["y"] = height - radius;
            }
        } else {
            console.debug("not found");
        }

        return pos;
    };

    function draw(element) {
        // Update the list index
        values().forEach(function (v, i) {
            v.i(i + 1);
        });

        // Should a dot be visible
        var shouldBevisible = function (v) {
            if (focused() > 0) {
                return v.i() == focused();
            } else {
                return true;
            }
        };

        d3.select(element).select("svg").remove();

        var svg = d3
            .select(element)
            .append("svg")
            .attr("width", width + margin)
            .attr("height", height + margin);

        // Grid
        var grid = svg
            .append("g")
            .attr("transform", "translate(" + margin + "," + 0 + ")");

        // Border box
        grid.append("rect")
            .attr("class", "rect")
            .attr("x", 1)
            .attr("y", 1)
            .attr("width", width - 2)
            .attr("height", height - 2)
            .attr("rx", radius)
            .attr("ry", radius)
            .attr("fill", "#FFFFFF")
            .attr("stroke", "#5D6D7E")
            .attr("stroke-width", "2");

        // Column guides
        grid.selectAll(".columnGuide")
            .data(d3.range(colWidth, width - 10, colWidth))
            .enter()
            .append("line")
            .attr("class", "columnGuide")
            .attr("x1", function (d) {
                return Math.floor(d);
            })
            .attr("y1", 0)
            .attr("x2", function (d) {
                return Math.floor(d);
            })
            .attr("y2", height)
            .attr("stroke", "#5D6D7E")
            .attr("stroke-width", "2");

        // Row guides
        grid.selectAll(".rowGuide")
            .data(d3.range(rowHeight, height - 10, rowHeight))
            .enter()
            .append("line")
            .attr("class", "rowGuide")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return d;
            })
            .attr("x2", width)
            .attr("y2", function (d) {
                return d;
            })
            .attr("stroke", "#5D6D7E")
            .attr("stroke-width", 2);

        // Quadrant Name
        grid.selectAll(".quadrantName")
            .data(quadrantNames())
            .enter()
            .append("text")
            .attr("class", "quadrantName")
            .attr("x", function (d, i) {
                return (
                    parseInt(i % numColumns()) * colWidth +
                    colWidth -
                    colWidth / 2
                );
            })
            .attr("y", function (d, i) {
                return (
                    parseInt(i / numColumns()) * rowHeight + 12
                ); /*rowHeight/2*/
            })
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", "#a4a4a4")
            .attr("font-size", "80%")
            .each(function (d, i) {
                var text = d3.select(this);
                var removeDots = /(\.)+$/;

                var name = d.replace(removeDots, "");

                name.slice(0, 85)
                    .replace(/(?![^\n]{1,20}$)([^\n]{1,20})\s/g, "$1\n")
                    .split("\n")
                    .forEach(function (l) {
                        text.append("tspan")
                            .attr("dy", 10)
                            .attr(
                                "x",
                                parseInt(i % numColumns()) * colWidth +
                                    colWidth -
                                    colWidth / 2
                            )
                            .text(l);
                    });
            });
        //.text(function(d) { return d != '-' ? d : '' });

        // x Text Container
        var xTextContainers = svg
            .append("g")
            .attr(
                "transform",
                "translate(" + margin + "," + (height + 10) + ")"
            );

        // x Axis
        xTextContainers
            .append("text")
            .attr("class", "xAxis")
            .attr("x", width / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", "#00000")
            .attr("font-size", "100%")
            .text(xAxis());

        // x Legends
        xTextContainers
            .selectAll(".xLegend")
            .data(xLegends())
            .enter()
            .append("text")
            .attr("class", "xLegend")
            .attr("x", function (d, i) {
                return (width / (xLegends().length - 1)) * i;
            })
            .attr("y", 0)
            .attr("text-anchor", function (d, i) {
                return i == 0
                    ? "start"
                    : i == xLegends().length - 1
                    ? "end"
                    : "middle";
            })
            .attr("alignment-baseline", "middle")
            .attr("fill", "#086788")
            .attr("font-size", "90%")
            .text(function (d) {
                return d != "-" ? d : "";
            });

        // y Text Container
        var yTextContainers = svg
            .append("g")
            .attr(
                "transform",
                "translate(" + (margin - 10) + "," + height + ") rotate(-90)"
            );

        // y Axis
        yTextContainers
            .append("text")
            .attr("class", "yAxis")
            .attr("x", width / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", "#00000")
            .attr("font-size", "100%")
            .text(yAxis());

        // y Legends
        yTextContainers
            .selectAll(".yLegend")
            .data(yLegends())
            .enter()
            .append("text")
            .attr("class", "yLegend")
            .attr("x", function (d, i) {
                return (width / (yLegends().length - 1)) * i;
            })
            .attr("y", 0)
            .attr("text-anchor", function (d, i) {
                return i == 0
                    ? "start"
                    : i == yLegends().length - 1
                    ? "end"
                    : "middle";
            })
            .attr("alignment-baseline", "middle")
            .attr("fill", "#086788")
            .attr("font-size", "90%")
            .text(function (d) {
                return d != "-" ? d : "";
            });

        var reversedValues = values().slice(0);
        reversedValues.reverse();

        // Averages
        if (showValueFor() == "averages" || focused() > 0) {
            var average = grid
                .selectAll(".dot")
                .data(reversedValues.filter(shouldBevisible))
                .enter()
                .append("g")
                .attr("class", "average");

            average
                .append("rect")
                .attr("x", function (d) {
                    return averages(d.v())["x"] - radius;
                })
                .attr("y", function (d) {
                    return averages(d.v())["y"] - radius;
                })
                .attr("width", radius * 2)
                .attr("height", radius * 2)
                .attr("rx", 3)
                .attr("stoke", function (d) {
                    return d.disabled() ? "#008080" : "#008080";
                })
                .attr("fill", function (d) {
                    return d.disabled()
                        ? "rgb(176, 189, 33, 0.6)"
                        : "rgb(176, 189, 33, 0.6)";
                })
                .append("title")
                .text(function (d) {
                    return d.v();
                });

            average
                .append("text")
                .attr("x", function (d) {
                    return averages(d.v())["x"];
                })
                .attr("y", function (d) {
                    return averages(d.v())["y"];
                })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("fill", "white")
                .text(function (d) {
                    return d.i();
                });
        }

        if (showValueFor() == "mine" || focused() > 0) {
            var dot = grid
                .selectAll(".dot")
                .data(reversedValues.filter(shouldBevisible))
                .enter()
                .append("g")
                .attr("class", "dot");

            let dotRect = dot
                .append("rect")
                .attr("x", function (d) {
                    return d.x() - radius;
                })
                .attr("y", function (d) {
                    return d.y() - radius;
                })
                .attr("width", radius * 2)
                .attr("height", radius * 2)
                .attr("rx", 3)
                .attr("stoke", function (d) {
                    return d.color()
                        ? d.color()[0] != "r"
                            ? "rgba(0, 0, 0, 0)"
                            : d.color()
                        : "#008080";
                })
                .attr("fill", function (d) {
                    return d.color()
                        ? d.color()[0] != "r"
                            ? "rgba(0, 0, 0, 0)"
                            : d.color()
                        : "rgba(0, 128, 128, 0.6)";
                });

            if (!showAsReadonly()) {
                dotRect
                    .call(
                        d3
                            .drag()
                            .on("start", dotDragStarted)
                            .on("drag", dotDragged)
                            .on("end", dotDragEnded)
                    )
                    .append("title")
                    .text(function (d) {
                        return d.v();
                    });
            }

            let dotText = dot
                .append("text")
                .attr("x", function (d) {
                    return d.x();
                })
                .attr("y", function (d) {
                    return d.y();
                })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("fill", function (d) {
                    return d.color() && d.color()[0] != "r"
                        ? d.color()
                        : "white";
                })
                .attr("font-size", "90%")
                .attr("font-weight", "bold")
                .text(function (d) {
                    return d.color() && d.color()[0] != "r"
                        ? d.v().substring(0, 20)
                        : typeof d.number() === "undefined"
                        ? d.i()
                        : d.number();
                });

            if (!showAsReadonly()) {
                dotText.call(
                    d3
                        .drag()
                        .on("start", dotDragStarted)
                        .on("drag", dotDragged)
                        .on("end", dotDragEnded)
                );
            }
        }

        return true;
    }
    field.setStashedAttributeFunction("draw", draw);

    function createOutput(currentCol, currentRow) {
        return ko.computed(function () {
            var results = [];
            values().forEach(function (e) {
                var x = parseInt(e.x() / colWidth);
                var y = parseInt(e.y() / rowHeight);
                if (x == currentCol && y == currentRow) {
                    results.push({ v: e.v(), x: e.x(), y: e.y() });
                }
            });

            return results;
        });
    }

    function createAvgOutput(currentCol, currentRow) {
        return ko.computed(function () {
            var results = [];
            Object.keys(allValues()).forEach(function (key) {
                var avg = averages(key);

                var x = parseInt(avg.x / colWidth);
                var y = parseInt(avg.y / rowHeight);
                if (x == currentCol && y == currentRow) {
                    results.push({ v: key, x: avg.x, y: avg.y });
                }
            });

            return results;
        });
    }

    for (var col = 0; col < numColumns(); col++) {
        for (var row = 0; row < numRows(); row++) {
            var currentCol = parseInt(col);
            var currentRow = parseInt(row);
            field.setOutputFunction(
                "quadrant_" + currentCol + "_" + currentRow,
                createOutput(currentCol, currentRow)
            );
            field.setOutputFunction(
                "avg_quadrant_" + currentCol + "_" + currentRow,
                createAvgOutput(currentCol, currentRow)
            );
        }
    }

    field.setOutputFunction(
        "avg_coordinates",
        ko.computed(function () {
            var results = [];
            values().forEach(function (e) {
                if (e.v()) {
                    var avg = averages(e.v());
                    results.push({
                        v: e.v(),
                        x: avg.x,
                        y: avg.y,
                        number: e.number(),
                    });
                }
            });
            return results;
        })
    );

    field.setOutputFunction(
        "mine_coordinates",
        ko.computed(function () {
            var results = [];
            values().forEach(function (e) {
                if (e.v()) {
                    results.push({
                        v: e.v(),
                        x: e.x(),
                        y: e.y(),
                        number: e.number(),
                    });
                }
            });
            return results;
        })
    );

    field.setOutputFunction(
        "allValues",
        ko.computed(function () {
            var results = [];
            Object.keys(allValues()).forEach(function (k) {
                results = results.concat(allValues()[k].all);
            });
            return results;
        })
    );

    field.setOutputFunction(
        "labels",
        ko.computed(function () {
            var results = [];
            values().forEach(function (e) {
                if (e.v()) {
                    results.push({ value: e.v() });
                }
            });
            return results;
        })
    );

    field.setProcessInputFunction(function (inputValues, subinput) {
        inputValues.forEach(function (input) {
            input.forEach(function (singleValue, index) {
                var found = values().filter(function (value) {
                    return singleValue.trim() == value.v().trim();
                });
                if (found.length == 0) {
                    values.push(
                        newValue(
                            singleValue,
                            false,
                            radius,
                            height - radius,
                            showAsReadonly()
                        )
                    );
                }
            });
        });
    });

    field.setProcessInputFunction("replace", function (inputValues, subinput) {
        var labels = [];

        inputValues.forEach(function (input) {
            input.forEach(function (singleValue) {
                var cleaned = singleValue ? singleValue.trim() : "";

                labels.push(cleaned);

                if (!(cleaned in allValues())) {
                    var v = {
                        label: cleaned,
                        x: radius / width,
                        y: (height - radius) / height,
                    };

                    allValues()[cleaned] = { others: [], mine: [v], all: [v] };
                }
            });
        });

        Object.keys(allValues()).forEach(function (k) {
            if (labels.indexOf(k) < 0) {
                allValues()[k].shown = false;
            } else {
                allValues()[k].shown = true;
            }
        });

        values.removeAll();
        Object.keys(allValues()).forEach(function (key) {
            if (allValues()[key].shown) {
                if (allValues()[key]["mine"].length > 0) {
                    var value = allValues()[key]["mine"][0];
                    var dot = newValue(
                        value.label,
                        false,
                        value.x * width,
                        value.y * height,
                        showAsReadonly()
                    );

                    values.push(dot);
                } else {
                    var value = allValues()[key]["others"][0];
                    var dot = newValue(
                        value.label,
                        false,
                        radius,
                        height - radius,
                        showAsReadonly()
                    );

                    values.push(dot);
                }
            }
        });
    });

    stash.setValuesWithCoordinates = function (inputValues) {
        var newValues = [];
        inputValues.forEach(function (input) {
            input.forEach(function (singleValue, index) {
                newValues.push(
                    newValue(
                        singleValue.label,
                        false,
                        singleValue.x * width,
                        singleValue.y * height,
                        showAsReadonly(),
                        singleValue.color,
                        singleValue.number
                    )
                );

                var v = {
                    label: singleValue.label,
                    x: singleValue.x,
                    y: singleValue.y,
                };
                allValues()[singleValue.label] = {
                    others: [],
                    mine: [v],
                    all: [v],
                };
            });
        });
        values(newValues);
    };

    field.setProcessInputFunction(
        "coordinates",
        function (inputValues, subinput) {
            //showAsReadonly(false);
            stash.setValuesWithCoordinates(inputValues);
        }
    );

    field.setProcessInputFunction(
        "initialize",
        function (inputValues, subinput) {
            //showAsReadonly(false);
            stash.initialValues(inputValues);
            stash.showResetButton(true);
            var initializedValues = Object.keys(allValues()).filter(function (
                k
            ) {
                if (
                    allValues()[k]["mine"].length > 0 &&
                    allValues()[k]["mine"][0].x > 0 &&
                    allValues()[k]["mine"][0].y > 0
                )
                    return true;
            });
            if (initializedValues.length == 0) {
                stash.setValuesWithCoordinates(inputValues);
            }
        }
    );
}
